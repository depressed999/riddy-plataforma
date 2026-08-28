import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema';

export const kycCaseStatusEnum = pgEnum('kyc_case_status', [
  'draft',
  'pending_review',
  'approved',
  'rejected',
]);

export const kycDocumentTypeEnum = pgEnum('kyc_document_type', [
  'drivers_license_front',
  'drivers_license_back',
  'selfie',
  'proof_of_address',
]);

export const kycDocumentStatusEnum = pgEnum('kyc_document_status', [
  'upload_pending',
  'uploaded',
  'pending_review',
  'approved',
  'rejected',
]);

export const kycAuditEventEnum = pgEnum('kyc_audit_event', [
  'case_created',
  'upload_prepared',
  'upload_completed',
  'document_viewed',
  'document_deleted',
  'case_submitted',
  'case_approved',
  'case_rejected',
]);

export const kycCases = pgTable(
  'kyc_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: kycCaseStatusEnum('status').default('draft').notNull(),
    rejectionReason: text('rejection_reason'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: uuid('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('kyc_cases_user_id_unique').on(table.userId),
    index('kyc_cases_status_idx').on(table.status),
    index('kyc_cases_submitted_at_idx').on(table.submittedAt),
  ],
);

export const kycDocuments = pgTable(
  'kyc_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => kycCases.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: kycDocumentTypeEnum('type').notNull(),
    status: kycDocumentStatusEnum('status').default('upload_pending').notNull(),
    storageKey: text('storage_key').notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    checksumSha256: varchar('checksum_sha256', { length: 64 }),
    uploadExpiresAt: timestamp('upload_expires_at', {
      withTimezone: true,
    }).notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('kyc_documents_case_type_unique').on(table.caseId, table.type),
    uniqueIndex('kyc_documents_storage_key_unique').on(table.storageKey),
    index('kyc_documents_user_id_idx').on(table.userId),
    index('kyc_documents_status_idx').on(table.status),
  ],
);

export const kycAuditEvents = pgTable(
  'kyc_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => kycCases.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id').references(() => kycDocuments.id, {
      onDelete: 'set null',
    }),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    event: kycAuditEventEnum('event').notNull(),
    metadata: jsonb('metadata')
      .$type<Record<string, string | number | boolean | null>>()
      .default({})
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('kyc_audit_events_case_id_idx').on(table.caseId),
    index('kyc_audit_events_created_at_idx').on(table.createdAt),
  ],
);

export const kycCasesRelations = relations(kycCases, ({ many, one }) => ({
  documents: many(kycDocuments),
  user: one(users, {
    fields: [kycCases.userId],
    references: [users.id],
  }),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  case: one(kycCases, {
    fields: [kycDocuments.caseId],
    references: [kycCases.id],
  }),
  user: one(users, {
    fields: [kycDocuments.userId],
    references: [users.id],
  }),
}));

export type KycCaseSelect = typeof kycCases.$inferSelect;
export type KycDocumentSelect = typeof kycDocuments.$inferSelect;
