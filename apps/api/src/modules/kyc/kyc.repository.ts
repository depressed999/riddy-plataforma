import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import {
  kycAuditEvents,
  kycCases,
  kycDocuments,
  users,
  type KycCaseSelect,
  type KycDocumentSelect,
} from '../../database/schema';
import type {
  KycCase,
  KycDocument,
  KycDocumentType,
  ReviewKycCase,
  StoredKycDocument,
} from './kyc.types';

@Injectable()
export class KycRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async findCaseByUserId(userId: string): Promise<KycCase | null> {
    const [kycCase] = await this.databaseService.database
      .select()
      .from(kycCases)
      .where(eq(kycCases.userId, userId))
      .limit(1);
    return kycCase ? this.withDocuments(kycCase) : null;
  }

  async findCaseById(id: string): Promise<ReviewKycCase | null> {
    const [row] = await this.databaseService.database
      .select({ kycCase: kycCases, user: users })
      .from(kycCases)
      .innerJoin(users, eq(kycCases.userId, users.id))
      .where(eq(kycCases.id, id))
      .limit(1);

    if (!row) {
      return null;
    }
    return {
      ...(await this.withDocuments(row.kycCase)),
      user: { email: row.user.email, id: row.user.id, name: row.user.name },
    };
  }

  async getOrCreateCase(userId: string): Promise<KycCase> {
    await this.databaseService.database
      .insert(kycCases)
      .values({ userId })
      .onConflictDoNothing({ target: kycCases.userId });
    const result = await this.findCaseByUserId(userId);
    if (!result) {
      throw new Error('O processo KYC não foi persistido.');
    }
    return result;
  }

  async listPendingCases(): Promise<ReviewKycCase[]> {
    const rows = await this.databaseService.database
      .select({ kycCase: kycCases, user: users })
      .from(kycCases)
      .innerJoin(users, eq(kycCases.userId, users.id))
      .where(eq(kycCases.status, 'pending_review'))
      .orderBy(asc(kycCases.submittedAt));

    return Promise.all(
      rows.map(async (row) => ({
        ...(await this.withDocuments(row.kycCase)),
        user: { email: row.user.email, id: row.user.id, name: row.user.name },
      })),
    );
  }

  async findDocumentById(id: string): Promise<StoredKycDocument | null> {
    const [document] = await this.databaseService.database
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.id, id))
      .limit(1);
    return document ? this.toStoredDocument(document) : null;
  }

  async findDocumentByType(
    caseId: string,
    type: KycDocumentType,
  ): Promise<StoredKycDocument | null> {
    const [document] = await this.databaseService.database
      .select()
      .from(kycDocuments)
      .where(and(eq(kycDocuments.caseId, caseId), eq(kycDocuments.type, type)))
      .limit(1);
    return document ? this.toStoredDocument(document) : null;
  }

  async prepareDocument(input: {
    caseId: string;
    mimeType: string;
    originalName: string;
    sizeBytes: number;
    storageKey: string;
    type: KycDocumentType;
    uploadExpiresAt: Date;
    userId: string;
  }): Promise<StoredKycDocument> {
    const [document] = await this.databaseService.database
      .insert(kycDocuments)
      .values(input)
      .onConflictDoUpdate({
        set: {
          checksumSha256: null,
          mimeType: input.mimeType,
          originalName: input.originalName,
          sizeBytes: input.sizeBytes,
          status: 'upload_pending',
          storageKey: input.storageKey,
          updatedAt: new Date(),
          uploadExpiresAt: input.uploadExpiresAt,
          uploadedAt: null,
        },
        target: [kycDocuments.caseId, kycDocuments.type],
      })
      .returning();
    if (!document) {
      throw new Error('O documento KYC não foi persistido.');
    }
    return this.toStoredDocument(document);
  }

  async markDocumentUploaded(
    id: string,
    input: { checksumSha256: string; mimeType: string; sizeBytes: number },
  ): Promise<StoredKycDocument> {
    const now = new Date();
    const [document] = await this.databaseService.database
      .update(kycDocuments)
      .set({
        ...input,
        status: 'uploaded',
        updatedAt: now,
        uploadedAt: now,
      })
      .where(eq(kycDocuments.id, id))
      .returning();
    if (!document) {
      throw new Error('O documento KYC não foi atualizado.');
    }
    return this.toStoredDocument(document);
  }

  async reopenCase(caseId: string): Promise<void> {
    await this.databaseService.database
      .update(kycCases)
      .set({
        rejectionReason: null,
        reviewedAt: null,
        reviewedBy: null,
        status: 'draft',
        submittedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(kycCases.id, caseId));
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const [deleted] = await this.databaseService.database
      .delete(kycDocuments)
      .where(and(eq(kycDocuments.id, id), eq(kycDocuments.userId, userId)))
      .returning({ id: kycDocuments.id });
    return Boolean(deleted);
  }

  async submitCase(id: string): Promise<void> {
    await this.databaseService.database.transaction(async (transaction) => {
      const now = new Date();
      await transaction
        .update(kycDocuments)
        .set({ status: 'pending_review', updatedAt: now })
        .where(eq(kycDocuments.caseId, id));
      await transaction
        .update(kycCases)
        .set({
          rejectionReason: null,
          reviewedAt: null,
          reviewedBy: null,
          status: 'pending_review',
          submittedAt: now,
          updatedAt: now,
        })
        .where(eq(kycCases.id, id));
    });
  }

  async approveCase(id: string, reviewerId: string): Promise<void> {
    await this.databaseService.database.transaction(async (transaction) => {
      const now = new Date();
      await transaction
        .update(kycDocuments)
        .set({ status: 'approved', updatedAt: now })
        .where(eq(kycDocuments.caseId, id));
      await transaction
        .update(kycCases)
        .set({
          rejectionReason: null,
          reviewedAt: now,
          reviewedBy: reviewerId,
          status: 'approved',
          updatedAt: now,
        })
        .where(eq(kycCases.id, id));
    });
  }

  async rejectCase(
    id: string,
    reviewerId: string,
    reason: string,
  ): Promise<void> {
    await this.databaseService.database.transaction(async (transaction) => {
      const now = new Date();
      await transaction
        .update(kycDocuments)
        .set({ status: 'rejected', updatedAt: now })
        .where(eq(kycDocuments.caseId, id));
      await transaction
        .update(kycCases)
        .set({
          rejectionReason: reason,
          reviewedAt: now,
          reviewedBy: reviewerId,
          status: 'rejected',
          updatedAt: now,
        })
        .where(eq(kycCases.id, id));
    });
  }

  async recordAudit(input: {
    actorUserId: string;
    caseId: string;
    documentId?: string;
    event:
      | 'case_approved'
      | 'case_created'
      | 'case_rejected'
      | 'case_submitted'
      | 'document_deleted'
      | 'document_viewed'
      | 'upload_completed'
      | 'upload_prepared';
    metadata?: Record<string, string | number | boolean | null>;
  }): Promise<void> {
    await this.databaseService.database.insert(kycAuditEvents).values({
      ...input,
      metadata: input.metadata ?? {},
    });
  }

  private async withDocuments(kycCase: KycCaseSelect): Promise<KycCase> {
    const documents = await this.databaseService.database
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.caseId, kycCase.id))
      .orderBy(desc(kycDocuments.createdAt));
    return {
      createdAt: kycCase.createdAt.toISOString(),
      documents: documents.map((document) => this.toDocument(document)),
      id: kycCase.id,
      rejectionReason: kycCase.rejectionReason,
      reviewedAt: kycCase.reviewedAt?.toISOString() ?? null,
      status: kycCase.status,
      submittedAt: kycCase.submittedAt?.toISOString() ?? null,
      updatedAt: kycCase.updatedAt.toISOString(),
      userId: kycCase.userId,
    };
  }

  private toDocument(document: KycDocumentSelect): KycDocument {
    return {
      createdAt: document.createdAt.toISOString(),
      id: document.id,
      mimeType: document.mimeType,
      originalName: document.originalName,
      sizeBytes: document.sizeBytes,
      status: document.status,
      type: document.type,
      updatedAt: document.updatedAt.toISOString(),
      uploadedAt: document.uploadedAt?.toISOString() ?? null,
    };
  }

  private toStoredDocument(document: KycDocumentSelect): StoredKycDocument {
    return {
      ...this.toDocument(document),
      caseId: document.caseId,
      checksumSha256: document.checksumSha256,
      storageKey: document.storageKey,
      uploadExpiresAt: document.uploadExpiresAt,
      userId: document.userId,
    };
  }
}
