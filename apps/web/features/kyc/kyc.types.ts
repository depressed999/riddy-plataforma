export type KycDocumentType =
  | 'drivers_license_back'
  | 'drivers_license_front'
  | 'proof_of_address'
  | 'selfie';

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

export type KycCase = {
  createdAt: string;
  documents: KycDocument[];
  id: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  status: 'approved' | 'draft' | 'pending_review' | 'rejected';
  submittedAt: string | null;
  updatedAt: string;
  userId: string;
};

export type ReviewKycCase = KycCase & {
  user: { email: string; id: string; name: string };
};

export type KycUploadIntent = {
  document: KycDocument;
  expiresAt: string;
  headers: Record<string, string>;
  uploadUrl: string;
};
