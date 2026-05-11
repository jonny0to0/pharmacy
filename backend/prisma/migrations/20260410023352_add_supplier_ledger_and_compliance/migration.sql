-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `dlExpiry` DATETIME(3) NULL,
    ADD COLUMN `drugLicenseNo` VARCHAR(191) NULL,
    ADD COLUMN `pan` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('PHARMA', 'NON_PHARMA') NOT NULL DEFAULT 'PHARMA';

-- CreateTable
CREATE TABLE `SupplierLedger` (
    `id` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `type` ENUM('PURCHASE', 'PAYMENT', 'RETURN', 'ADJUSTMENT') NOT NULL DEFAULT 'PURCHASE',
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `balance` DOUBLE NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `businessId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupplierLedger` ADD CONSTRAINT `SupplierLedger_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierLedger` ADD CONSTRAINT `SupplierLedger_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
