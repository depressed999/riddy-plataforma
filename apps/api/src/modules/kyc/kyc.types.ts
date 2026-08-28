export const kycDocumentTypes = [
  'drivers_license_front',
  'drivers_license_back',
  'selfie',
  'proof_of_address',
] as const;

export const requiredKycDocumentTypes = [
  'drivers_license_front',
  'drivers_license_back',
  'selfie',
] as const;

export type KycDocumentType = (typeof kycDocumentTypes)[number];
export type KycCaseStatus =
  'approved' | 'draft' | 'pending_review' | 'rejected';
export type KycDocumentStatus =
  'approved' | 'pending_review' | 'rejected' | 'upload_pending' | 'uploaded';

export type KycDocument = {
  createdAt: string;
  id: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  status: KycDocumentStatus;
  type: KycDocumentType;
  updatedAt: string;
  uploadedAt: string | null;
};

export type StoredKycDocument = KycDocument & {
  caseId: string;
  checksumSha256: string | null;
  storageKey: string;
  uploadExpiresAt: Date;
  userId: string;
};

export type KycCase = {
  createdAt: string;
  documents: KycDocument[];
  id: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  status: KycCaseStatus;
  submittedAt: string | null;
  updatedAt: string;
  userId: string;
};

export type ReviewKycCase = KycCase & {
  user: { email: string; id: string; name: string };
};

export type UploadIntent = {
  document: KycDocument;
  expiresAt: string;
  headers: Record<string, string>;
  uploadUrl: string;
};

export type VerifiedStoredObject = {
  checksumSha256: string;
  mimeType: string;
  sizeBytes: number;
};
