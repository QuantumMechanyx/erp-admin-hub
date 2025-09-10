-- AlterTable
ALTER TABLE "public"."issues" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "resolutionPlan" TEXT,
ADD COLUMN     "roadblocks" TEXT,
ADD COLUMN     "usersInvolved" TEXT,
ADD COLUMN     "workPerformed" TEXT;

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
