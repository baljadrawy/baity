-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'CHILD');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'DUE', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillCategory" AS ENUM ('ELECTRICITY', 'WATER', 'TELECOM', 'INTERNET', 'SUBSCRIPTION', 'RENT', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurrencePeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('MANUALLY', 'DAILY', 'DYNAMIC_REGULAR', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('NO_ASSIGNMENT', 'WHO_LEAST_DID_IT_FIRST', 'RANDOM', 'IN_ALPHABETIC_ORDER', 'FIXED');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "WarrantyType" AS ENUM ('MANUFACTURER', 'STORE', 'EXTENDED', 'THIRD_PARTY', 'NONE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PURCHASE_INVOICE', 'WARRANTY_CARD', 'USER_MANUAL', 'RECEIPT', 'SERVICE_REPORT', 'PRODUCT_PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "ArchiveCategory" AS ENUM ('INVOICE', 'CONTRACT', 'INSURANCE', 'GOVERNMENT', 'MEDICAL', 'EDUCATION', 'PROPERTY', 'VEHICLE', 'OTHER');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('STARTED', 'SUBMITTED', 'APPROVED', 'PARTIAL', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('JOB_REWARD', 'BONUS', 'SPEND', 'SAVE_DEPOSIT', 'CHARITY', 'GIFT', 'TRANSFER', 'WEEKLY_ALLOWANCE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "telegramChatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "age" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "BillCategory" NOT NULL,
    "provider" TEXT,
    "accountNumber" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePeriod" "RecurrencePeriod",
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_payments" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "paidBy" TEXT,

    CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chores" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "periodType" "PeriodType" NOT NULL,
    "periodDays" INTEGER,
    "periodWeekDay" INTEGER,
    "periodMonthDay" INTEGER,
    "assignmentType" "AssignmentType" NOT NULL DEFAULT 'NO_ASSIGNMENT',
    "assignedMemberIds" TEXT[],
    "firstExecutionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueDate" TIMESTAMP(3),
    "lastExecutedAt" TIMESTAMP(3),
    "lastExecutedById" TEXT,
    "trackDateOnly" BOOLEAN NOT NULL DEFAULT false,
    "dueDateRollover" BOOLEAN NOT NULL DEFAULT true,
    "pointsReward" INTEGER NOT NULL DEFAULT 0,
    "notifyBeforeDays" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "chores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_executions" (
    "id" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "executedById" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chore_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_lists" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_items" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" TEXT,
    "unit" TEXT,
    "estimatedPrice" DECIMAL(10,2),
    "urgency" "Urgency" NOT NULL DEFAULT 'MEDIUM',
    "store" TEXT,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "addedById" TEXT NOT NULL,
    "checkedById" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appliances" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "category" TEXT,
    "location" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2),
    "store" TEXT,
    "storeOrderNumber" TEXT,
    "warrantyStart" TIMESTAMP(3),
    "warrantyEnd" TIMESTAMP(3),
    "warrantyMonths" INTEGER,
    "warrantyType" "WarrantyType" NOT NULL DEFAULT 'MANUFACTURER',
    "warrantyContact" TEXT,
    "warrantyNotes" TEXT,
    "warrantyNotifyDaysBefore" INTEGER NOT NULL DEFAULT 30,
    "imageUrl" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "appliances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_documents" (
    "id" TEXT NOT NULL,
    "applianceId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "ocrText" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranty_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "applianceId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "lastDoneAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "notifyBeforeDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneById" TEXT,
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "attachmentUrl" TEXT,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_archives" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "category" "ArchiveCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "ocrText" TEXT,
    "documentDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "notifyBeforeDays" INTEGER,
    "tags" TEXT[],
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "document_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_menu_items" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "iconEmoji" TEXT,
    "reward" DECIMAL(8,2) NOT NULL,
    "estimatedMinutes" INTEGER,
    "minAge" INTEGER NOT NULL DEFAULT 4,
    "maxAge" INTEGER,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableForIds" TEXT[],
    "weeklyLimit" INTEGER,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "job_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_instances" (
    "id" TEXT NOT NULL,
    "jobMenuItemId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'STARTED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "beforePhotoUrl" TEXT,
    "afterPhotoUrl" TEXT,
    "approvedAmount" DECIMAL(8,2),
    "parentNotes" TEXT,
    "bonusAmount" DECIMAL(8,2) NOT NULL DEFAULT 0,

    CONSTRAINT "job_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_wallets" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalSaved" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCharity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "spendPercent" INTEGER NOT NULL DEFAULT 50,
    "savePercent" INTEGER NOT NULL DEFAULT 30,
    "charityPercent" INTEGER NOT NULL DEFAULT 10,
    "surprisePercent" INTEGER NOT NULL DEFAULT 10,
    "weeklyEarningsLimit" DECIMAL(8,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "currentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(8,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "relatedJobId" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "household_members_householdId_idx" ON "household_members"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_userId_householdId_key" ON "household_members"("userId", "householdId");

-- CreateIndex
CREATE INDEX "bills_householdId_idx" ON "bills"("householdId");

-- CreateIndex
CREATE INDEX "bills_householdId_status_idx" ON "bills"("householdId", "status");

-- CreateIndex
CREATE INDEX "bills_householdId_dueDate_idx" ON "bills"("householdId", "dueDate");

-- CreateIndex
CREATE INDEX "bill_payments_billId_idx" ON "bill_payments"("billId");

-- CreateIndex
CREATE INDEX "chores_householdId_idx" ON "chores"("householdId");

-- CreateIndex
CREATE INDEX "chores_householdId_nextDueDate_idx" ON "chores"("householdId", "nextDueDate");

-- CreateIndex
CREATE INDEX "chores_householdId_isActive_idx" ON "chores"("householdId", "isActive");

-- CreateIndex
CREATE INDEX "chore_executions_choreId_idx" ON "chore_executions"("choreId");

-- CreateIndex
CREATE INDEX "chore_executions_choreId_executedAt_idx" ON "chore_executions"("choreId", "executedAt");

-- CreateIndex
CREATE INDEX "shopping_lists_householdId_idx" ON "shopping_lists"("householdId");

-- CreateIndex
CREATE INDEX "shopping_items_listId_idx" ON "shopping_items"("listId");

-- CreateIndex
CREATE INDEX "shopping_items_listId_isChecked_idx" ON "shopping_items"("listId", "isChecked");

-- CreateIndex
CREATE INDEX "appliances_householdId_idx" ON "appliances"("householdId");

-- CreateIndex
CREATE INDEX "appliances_householdId_isActive_idx" ON "appliances"("householdId", "isActive");

-- CreateIndex
CREATE INDEX "appliances_householdId_warrantyEnd_idx" ON "appliances"("householdId", "warrantyEnd");

-- CreateIndex
CREATE INDEX "warranty_documents_applianceId_idx" ON "warranty_documents"("applianceId");

-- CreateIndex
CREATE INDEX "warranty_documents_applianceId_type_idx" ON "warranty_documents"("applianceId", "type");

-- CreateIndex
CREATE INDEX "maintenance_schedules_applianceId_idx" ON "maintenance_schedules"("applianceId");

-- CreateIndex
CREATE INDEX "maintenance_logs_scheduleId_idx" ON "maintenance_logs"("scheduleId");

-- CreateIndex
CREATE INDEX "document_archives_householdId_idx" ON "document_archives"("householdId");

-- CreateIndex
CREATE INDEX "document_archives_householdId_category_idx" ON "document_archives"("householdId", "category");

-- CreateIndex
CREATE INDEX "document_archives_householdId_expiryDate_idx" ON "document_archives"("householdId", "expiryDate");

-- CreateIndex
CREATE INDEX "job_menu_items_householdId_idx" ON "job_menu_items"("householdId");

-- CreateIndex
CREATE INDEX "job_menu_items_householdId_isActive_idx" ON "job_menu_items"("householdId", "isActive");

-- CreateIndex
CREATE INDEX "job_instances_childId_idx" ON "job_instances"("childId");

-- CreateIndex
CREATE INDEX "job_instances_jobMenuItemId_idx" ON "job_instances"("jobMenuItemId");

-- CreateIndex
CREATE INDEX "job_instances_childId_status_idx" ON "job_instances"("childId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "child_wallets_memberId_key" ON "child_wallets"("memberId");

-- CreateIndex
CREATE INDEX "savings_goals_walletId_idx" ON "savings_goals"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_executions" ADD CONSTRAINT "chore_executions_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "chores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "shopping_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appliances" ADD CONSTRAINT "appliances_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_documents" ADD CONSTRAINT "warranty_documents_applianceId_fkey" FOREIGN KEY ("applianceId") REFERENCES "appliances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_applianceId_fkey" FOREIGN KEY ("applianceId") REFERENCES "appliances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "maintenance_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_archives" ADD CONSTRAINT "document_archives_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_menu_items" ADD CONSTRAINT "job_menu_items_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_instances" ADD CONSTRAINT "job_instances_jobMenuItemId_fkey" FOREIGN KEY ("jobMenuItemId") REFERENCES "job_menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_instances" ADD CONSTRAINT "job_instances_childId_fkey" FOREIGN KEY ("childId") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_wallets" ADD CONSTRAINT "child_wallets_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "child_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "child_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
