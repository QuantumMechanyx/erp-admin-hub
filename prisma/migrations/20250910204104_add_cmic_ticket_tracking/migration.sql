-- AlterTable
ALTER TABLE "public"."issues" ADD COLUMN     "cmicTicketClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cmicTicketNumber" TEXT,
ADD COLUMN     "cmicTicketOpened" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."cmic_notes" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cmic_notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."cmic_notes" ADD CONSTRAINT "cmic_notes_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
