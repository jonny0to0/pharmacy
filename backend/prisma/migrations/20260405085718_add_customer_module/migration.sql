/*
  Warnings:

  - You are about to drop the column `gstin` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the column `mobile` on the `customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Customer_mobile_key` ON `customer`;

-- AlterTable
ALTER TABLE `customer` DROP COLUMN `gstin`,
    DROP COLUMN `mobile`,
    ADD COLUMN `customerType` ENUM('regular', 'wholesale') NOT NULL DEFAULT 'regular',
    ADD COLUMN `gst_number` VARCHAR(191) NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `phone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `HsnMaster` (
    `id` VARCHAR(191) NOT NULL,
    `hsnCode` VARCHAR(191) NOT NULL,
    `gstRate` DOUBLE NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HsnMaster_hsnCode_gstRate_key`(`hsnCode`, `gstRate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Customer_phone_key` ON `Customer`(`phone`);
