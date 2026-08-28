import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { PublicUser } from '../auth/auth.types';
import type { KycRepository } from './kyc.repository';
import { KycService } from './kyc.service';
import type {
  KycCase,
  KycDocument,
  ReviewKycCase,
  StoredKycDocument,
} from './kyc.types';
import type { PrivateStorageService } from './private-storage.service';

const userId = '11111111-1111-4111-8111-111111111111';
const caseId = '22222222-2222-4222-8222-222222222222';
const documentId = '33333333-3333-4333-8333-333333333333';
const reviewerId = '44444444-4444-4444-8444-444444444444';
const now = '2026-08-26T12:00:00.000Z';

const user: PublicUser = {
  avatarUrl: null,
  email: 'locatario@example.com',
  emailVerified: true,
  id: userId,
  name: 'Locatário Riddy',
  role: 'user',
};

const reviewer: PublicUser = {
  ...user,
  email: 'analista@example.com',
  id: reviewerId,
  name: 'Analista Riddy',
  role: 'reviewer',
};

const document: StoredKycDocument = {
  caseId,
  checksumSha256: null,
  createdAt: now,
  id: documentId,
  mimeType: 'image/jpeg',
  originalName: 'cnh-frente.jpg',
  sizeBytes: 1024,
  status: 'upload_pending',
  storageKey: `kyc/${userId}/${caseId}/document.jpg`,
  type: 'drivers_license_front',
  updatedAt: now,
  uploadExpiresAt: new Date('2026-08-26T12:05:00.000Z'),
  uploadedAt: null,
  userId,
};

const draftCase: KycCase = {
  createdAt: now,
  documents: [],
  id: caseId,
  rejectionReason: null,
  reviewedAt: null,
  status: 'draft',
  submittedAt: null,
  updatedAt: now,
  userId,
};

describe('KycService', () => {
  let repository: jest.Mocked<KycRepository>;
  let storage: jest.Mocked<PrivateStorageService>;
  let service: KycService;

  beforeEach(() => {
    repository = {
      approveCase: jest.fn(),
      deleteDocument: jest.fn(),
      findCaseById: jest.fn(),
      findCaseByUserId: jest.fn(),
      findDocumentById: jest.fn(),
      findDocumentByType: jest.fn(),
      getOrCreateCase: jest.fn(),
      listPendingCases: jest.fn(),
      markDocumentUploaded: jest.fn(),
      prepareDocument: jest.fn(),
      recordAudit: jest.fn(),
      rejectCase: jest.fn(),
      reopenCase: jest.fn(),
      submitCase: jest.fn(),
    } as unknown as jest.Mocked<KycRepository>;
    storage = {
      createUploadUrl: jest.fn(),
      createViewUrl: jest.fn(),
      deleteObject: jest.fn(),
      verifyObject: jest.fn(),
    } as unknown as jest.Mocked<PrivateStorageService>;
    service = new KycService(repository, storage);
  });

  it('creates a private upload intent without exposing the storage key', async () => {
    repository.getOrCreateCase.mockResolvedValue(draftCase);
    repository.findDocumentByType.mockResolvedValue(null);
    repository.prepareDocument.mockResolvedValue(document);
    storage.createUploadUrl.mockResolvedValue({
      expiresAt: new Date('2026-08-26T12:05:00.000Z'),
      headers: { 'content-type': 'image/jpeg' },
      url: 'http://storage.test/signed-upload',
    });

    const result = await service.createUploadIntent(userId, {
      fileName: 'cnh-frente.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      type: 'drivers_license_front',
    });

    expect(result.uploadUrl).toBe('http://storage.test/signed-upload');
    expect(result.document).not.toHaveProperty('storageKey');
    expect(result.document).not.toHaveProperty('checksumSha256');
    expect(repository.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'upload_prepared' }),
    );
  });

  it('rejects a filename whose extension does not match its MIME type', async () => {
    await expect(
      service.createUploadIntent(userId, {
        fileName: 'cnh-frente.exe',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        type: 'drivers_license_front',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.createUploadUrl).not.toHaveBeenCalled();
  });

  it('does not reveal a document that belongs to another user', async () => {
    repository.findDocumentById.mockResolvedValue(document);

    await expect(
      service.completeUpload(
        '55555555-5555-4555-8555-555555555555',
        documentId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires every mandatory document before submission', async () => {
    repository.findCaseByUserId.mockResolvedValue({
      ...draftCase,
      documents: [toPublicDocument(document, 'uploaded')],
    });

    await expect(service.submit(userId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.submitCase).not.toHaveBeenCalled();
  });

  it('submits a complete case for review', async () => {
    const completedCase = completeCase();
    repository.findCaseByUserId
      .mockResolvedValueOnce(completedCase)
      .mockResolvedValueOnce({ ...completedCase, status: 'pending_review' });

    await expect(service.submit(userId)).resolves.toMatchObject({
      status: 'pending_review',
    });
    expect(repository.submitCase).toHaveBeenCalledWith(caseId);
    expect(repository.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'case_submitted' }),
    );
  });

  it('prevents a regular user from accessing the review queue', () => {
    expect(() => service.listPending(user)).toThrow(ForbiddenException);
  });

  it('allows a reviewer to approve a pending case', async () => {
    const pendingCase: ReviewKycCase = {
      ...completeCase(),
      status: 'pending_review',
      submittedAt: now,
      user: { email: user.email, id: user.id, name: user.name },
    };
    repository.findCaseById
      .mockResolvedValueOnce(pendingCase)
      .mockResolvedValueOnce({ ...pendingCase, status: 'approved' });

    await expect(service.approve(reviewer, caseId)).resolves.toMatchObject({
      status: 'approved',
    });
    expect(repository.approveCase).toHaveBeenCalledWith(caseId, reviewerId);
  });
});

function toPublicDocument(
  storedDocument: StoredKycDocument,
  status: KycDocument['status'],
  type = storedDocument.type,
): KycDocument {
  return {
    createdAt: storedDocument.createdAt,
    id: storedDocument.id,
    mimeType: storedDocument.mimeType,
    originalName: storedDocument.originalName,
    sizeBytes: storedDocument.sizeBytes,
    status,
    type,
    updatedAt: storedDocument.updatedAt,
    uploadedAt: now,
  };
}

function completeCase(): KycCase {
  return {
    ...draftCase,
    documents: [
      toPublicDocument(document, 'uploaded', 'drivers_license_front'),
      toPublicDocument(
        { ...document, id: '66666666-6666-4666-8666-666666666666' },
        'uploaded',
        'drivers_license_back',
      ),
      toPublicDocument(
        { ...document, id: '77777777-7777-4777-8777-777777777777' },
        'uploaded',
        'selfie',
      ),
    ],
  };
}
