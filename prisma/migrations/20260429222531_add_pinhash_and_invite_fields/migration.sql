-- AlterTable
ALTER TABLE "household_members" ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "invitedBy" TEXT,
ADD COLUMN     "pinHash" TEXT;
