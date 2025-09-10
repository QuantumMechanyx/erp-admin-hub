-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."issues" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."Status" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notes" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT,
    "minutes" TEXT,
    "actionItems" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meeting_items" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "discussionNotes" TEXT,
    "actionItems" TEXT,

    CONSTRAINT "meeting_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_drafts" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_issues" (
    "id" TEXT NOT NULL,
    "emailDraftId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,

    CONSTRAINT "email_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_issues_emailDraftId_issueId_key" ON "public"."email_issues"("emailDraftId", "issueId");

-- AddForeignKey
ALTER TABLE "public"."notes" ADD CONSTRAINT "notes_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_items" ADD CONSTRAINT "meeting_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_items" ADD CONSTRAINT "meeting_items_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_issues" ADD CONSTRAINT "email_issues_emailDraftId_fkey" FOREIGN KEY ("emailDraftId") REFERENCES "public"."email_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_issues" ADD CONSTRAINT "email_issues_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
