import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import type { PublicUser } from '../auth/auth.types';
import { KycRepository } from './kyc.repository';
import {
  type KycCase,
  type KycDocument,
  type KycDocumentType,
  requiredKycDocumentTypes,
  type ReviewKycCase,
  type StoredKycDocument,
  type UploadIntent,
} from './kyc.types';
import { PrivateStorageService } from './private-storage.service';

const maximumFileSize = 8 * 1024 * 1024;
const allowedExtensions: Record<string, readonly string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
};

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @Inject(KycRepository)
    private readonly repository: KycRepository,
    @Inject(PrivateStorageService)
    private readonly storage: PrivateStorageService,
  ) {}

  getMine(userId: string): Promise<KycCase | null> {
    return this.repository.findCaseByUserId(userId);
  }

  async createUploadIntent(
    userId: string,
    input: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      type: KycDocumentType;
    },
  ): Promise<UploadIntent> {
    validateFile(input);
    const kycCase = await this.repository.getOrCreateCase(userId);
    if (kycCase.status === 'pending_review') {
      throw new ConflictException(
        'A verificação já foi enviada e está em análise.',
      );
    }
    if (kycCase.status === 'approved') {
      throw new ConflictException('A verificação desta conta já foi aprovada.');
    }

    const previousDocument = await this.repository.findDocumentByType(
      kycCase.id,
      input.type,
    );
    const safeName = sanitizeFileName(input.fileName);
    const storageKey = `kyc/${userId}/${kycCase.id}/${randomUUID()}${extname(safeName).toLowerCase()}`;
    const signedUpload = await this.storage.createUploadUrl(
      storageKey,
      input.mimeType,
    );
    const document = await this.repository.prepareDocument({
      caseId: kycCase.id,
      mimeType: input.mimeType,
      originalName: safeName,
      sizeBytes: input.sizeBytes,
      storageKey,
      type: input.type,
      uploadExpiresAt: signedUpload.expiresAt,
      userId,
    });

    if (kycCase.status === 'rejected') {
      await this.repository.reopenCase(kycCase.id);
    }
    if (
      previousDocument &&
      previousDocument.storageKey !== document.storageKey
    ) {
      await this.storage
        .deleteObject(previousDocument.storageKey)
        .catch(() =>
          this.logger.warn(
            'A previous private KYC object could not be removed.',
          ),
        );
    }
    await this.repository.recordAudit({
      actorUserId: userId,
      caseId: kycCase.id,
      documentId: document.id,
      event: 'upload_prepared',
      metadata: { mimeType: input.mimeType, type: input.type },
    });

    return {
      document: toPublicDocument(document),
      expiresAt: signedUpload.expiresAt.toISOString(),
      headers: signedUpload.headers,
      uploadUrl: signedUpload.url,
    };
  }

  async completeUpload(
    userId: string,
    documentId: string,
  ): Promise<KycDocument> {
    const document = await this.ownedDocument(documentId, userId);
    if (document.status !== 'upload_pending') {
      throw new ConflictException('Este upload já foi concluído.');
    }
    if (document.uploadExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'A autorização de upload expirou. Envie o documento novamente.',
      );
    }

    const verified = await this.storage.verifyObject(
      document.storageKey,
      document.mimeType,
      document.sizeBytes,
    );
    const updated = await this.repository.markDocumentUploaded(
      document.id,
      verified,
    );
    await this.repository.recordAudit({
      actorUserId: userId,
      caseId: document.caseId,
      documentId: document.id,
      event: 'upload_completed',
      metadata: { sizeBytes: verified.sizeBytes, type: document.type },
    });
    return toPublicDocument(updated);
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const document = await this.ownedDocument(documentId, userId);
    const kycCase = await this.repository.findCaseByUserId(userId);
    if (!kycCase || !['draft', 'rejected'].includes(kycCase.status)) {
      throw new ConflictException(
        'Documentos enviados para análise não podem ser removidos.',
      );
    }

    await this.storage.deleteObject(document.storageKey);
    const deleted = await this.repository.deleteDocument(documentId, userId);
    if (!deleted) {
      throw new NotFoundException('Documento não encontrado.');
    }
    await this.repository.recordAudit({
      actorUserId: userId,
      caseId: document.caseId,
      event: 'document_deleted',
      metadata: { type: document.type },
    });
  }

  async submit(userId: string): Promise<KycCase> {
    const kycCase = await this.repository.findCaseByUserId(userId);
    if (!kycCase) {
      throw new BadRequestException('Envie os documentos obrigatórios.');
    }
    if (kycCase.status === 'pending_review') {
      throw new ConflictException('A verificação já está em análise.');
    }
    if (kycCase.status === 'approved') {
      throw new ConflictException('A verificação já foi aprovada.');
    }

    const completedTypes = new Set(
      kycCase.documents
        .filter((document) => document.status === 'uploaded')
        .map((document) => document.type),
    );
    const missing = requiredKycDocumentTypes.filter(
      (type) => !completedTypes.has(type),
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        'Conclua o envio da CNH frente, CNH verso e selfie.',
      );
    }

    await this.repository.submitCase(kycCase.id);
    await this.repository.recordAudit({
      actorUserId: userId,
      caseId: kycCase.id,
      event: 'case_submitted',
    });
    return (await this.repository.findCaseByUserId(userId))!;
  }

  async getViewUrl(
    actor: PublicUser,
    documentId: string,
  ): Promise<{ expiresInSeconds: number; url: string }> {
    const document = await this.repository.findDocumentById(documentId);
    if (!document) {
      throw new NotFoundException('Documento não encontrado.');
    }
    if (document.userId !== actor.id && !isReviewer(actor)) {
      throw new NotFoundException('Documento não encontrado.');
    }
    if (document.status === 'upload_pending') {
      throw new ConflictException(
        'O upload deste documento não foi concluído.',
      );
    }

    const url = await this.storage.createViewUrl(document.storageKey);
    await this.repository.recordAudit({
      actorUserId: actor.id,
      caseId: document.caseId,
      documentId: document.id,
      event: 'document_viewed',
    });
    return { expiresInSeconds: 300, url };
  }

  listPending(actor: PublicUser): Promise<ReviewKycCase[]> {
    assertReviewer(actor);
    return this.repository.listPendingCases();
  }

  async getForReview(
    actor: PublicUser,
    caseId: string,
  ): Promise<ReviewKycCase> {
    assertReviewer(actor);
    const kycCase = await this.repository.findCaseById(caseId);
    if (!kycCase) {
      throw new NotFoundException('Verificação não encontrada.');
    }
    return kycCase;
  }

  async approve(actor: PublicUser, caseId: string): Promise<ReviewKycCase> {
    const kycCase = await this.pendingCaseForReview(actor, caseId);
    await this.repository.approveCase(caseId, actor.id);
    await this.repository.recordAudit({
      actorUserId: actor.id,
      caseId,
      event: 'case_approved',
    });
    return (await this.repository.findCaseById(kycCase.id))!;
  }

  async reject(
    actor: PublicUser,
    caseId: string,
    reason: string,
  ): Promise<ReviewKycCase> {
    const kycCase = await this.pendingCaseForReview(actor, caseId);
    const normalizedReason = reason.trim();
    await this.repository.rejectCase(caseId, actor.id, normalizedReason);
    await this.repository.recordAudit({
      actorUserId: actor.id,
      caseId,
      event: 'case_rejected',
      metadata: { reason: normalizedReason },
    });
    return (await this.repository.findCaseById(kycCase.id))!;
  }

  private async ownedDocument(
    documentId: string,
    userId: string,
  ): Promise<StoredKycDocument> {
    const document = await this.repository.findDocumentById(documentId);
    if (!document || document.userId !== userId) {
      throw new NotFoundException('Documento não encontrado.');
    }
    return document;
  }

  private async pendingCaseForReview(
    actor: PublicUser,
    caseId: string,
  ): Promise<ReviewKycCase> {
    const kycCase = await this.getForReview(actor, caseId);
    if (kycCase.status !== 'pending_review') {
      throw new ConflictException(
        'A verificação não está pendente de análise.',
      );
    }
    return kycCase;
  }
}

function toPublicDocument(document: StoredKycDocument): KycDocument {
  return {
    createdAt: document.createdAt,
    id: document.id,
    mimeType: document.mimeType,
    originalName: document.originalName,
    sizeBytes: document.sizeBytes,
    status: document.status,
    type: document.type,
    updatedAt: document.updatedAt,
    uploadedAt: document.uploadedAt,
  };
}

function validateFile(input: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): void {
  if (input.sizeBytes <= 0 || input.sizeBytes > maximumFileSize) {
    throw new BadRequestException('O arquivo deve ter no máximo 8 MB.');
  }
  const extensions = allowedExtensions[input.mimeType];
  if (!extensions?.includes(extname(input.fileName).toLowerCase())) {
    throw new BadRequestException(
      'Envie um arquivo JPEG, PNG ou PDF com extensão compatível.',
    );
  }
}

function sanitizeFileName(fileName: string): string {
  const name = fileName
    .trim()
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .slice(0, 255);
  if (!name || name === '.' || name === '..') {
    throw new BadRequestException('Nome de arquivo inválido.');
  }
  return name;
}

function isReviewer(user: PublicUser): boolean {
  return user.role === 'admin' || user.role === 'reviewer';
}

function assertReviewer(user: PublicUser): void {
  if (!isReviewer(user)) {
    throw new ForbiddenException('Permissão de análise KYC necessária.');
  }
}
