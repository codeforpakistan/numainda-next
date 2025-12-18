-- First, add the column as nullable
ALTER TABLE "document_uploads" ADD COLUMN "file_url" text;

-- Set a default value for existing records
UPDATE "document_uploads" SET "file_url" = '/uploads/default.pdf' WHERE "file_url" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "document_uploads" ALTER COLUMN "file_url" SET NOT NULL;