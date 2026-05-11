/*
  Warnings:

  - A unique constraint covering the columns `[noteNumber,businessId]` on the table `CreditNote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone,businessId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[noteNumber,businessId]` on the table `DebitNote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku,businessId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[billNumber,businessId]` on the table `PurchaseBill` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderNumber,businessId]` on the table `PurchaseOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceNumber,businessId]` on the table `SaleInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderNumber,businessId]` on the table `SalesOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mobile,businessId]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `CreditNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `DebitNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `PurchaseBill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `PurchaseBillItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `PurchaseOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `SaleInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `SaleInvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `SalesOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `SalesOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `StockAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `StockBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `purchasebill` DROP FOREIGN KEY `PurchaseBill_supplierId_fkey`;

-- DropIndex
DROP INDEX `CreditNote_noteNumber_key` ON `creditnote`;

-- DropIndex
DROP INDEX `Customer_phone_key` ON `customer`;

-- DropIndex
DROP INDEX `DebitNote_noteNumber_key` ON `debitnote`;

-- DropIndex
DROP INDEX `Product_sku_key` ON `product`;

-- DropIndex
DROP INDEX `PurchaseBill_billNumber_key` ON `purchasebill`;

-- DropIndex
DROP INDEX `PurchaseBill_supplierId_fkey` ON `purchasebill`;

-- DropIndex
DROP INDEX `PurchaseOrder_orderNumber_key` ON `purchaseorder`;

-- DropIndex
DROP INDEX `SaleInvoice_invoiceNumber_key` ON `saleinvoice`;

-- DropIndex
DROP INDEX `SalesOrder_orderNumber_key` ON `salesorder`;

-- DropIndex
DROP INDEX `Supplier_mobile_key` ON `supplier`;

-- AlterTable
ALTER TABLE `creditnote` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `debitnote` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `expense` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `payment` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `businessId` VARCHAR(191) NOT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `manufacturer` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `purchasebill` ADD COLUMN `businessId` VARCHAR(191) NOT NULL,
    MODIFY `supplierId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `purchasebillitem` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `purchaseorder` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `purchaseorderitem` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `saleinvoice` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `saleinvoiceitem` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `salesorder` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `salesorderitem` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `stockadjustment` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `stockbatch` ADD COLUMN `businessId` VARCHAR(191) NOT NULL,
    ADD COLUMN `isMigrated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `mrp` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `purchasePrice` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `sellingPrice` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `supplierId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `warehouse` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CreditNote_noteNumber_businessId_key` ON `CreditNote`(`noteNumber`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `Customer_phone_businessId_key` ON `Customer`(`phone`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `DebitNote_noteNumber_businessId_key` ON `DebitNote`(`noteNumber`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_sku_businessId_key` ON `Product`(`sku`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `PurchaseBill_billNumber_businessId_key` ON `PurchaseBill`(`billNumber`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `PurchaseOrder_orderNumber_businessId_key` ON `PurchaseOrder`(`orderNumber`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `SaleInvoice_invoiceNumber_businessId_key` ON `SaleInvoice`(`invoiceNumber`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `SalesOrder_orderNumber_businessId_key` ON `SalesOrder`(`orderNumber`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `Supplier_mobile_businessId_key` ON `Supplier`(`mobile`, `businessId`);

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockBatch` ADD CONSTRAINT `StockBatch_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockBatch` ADD CONSTRAINT `StockBatch_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoice` ADD CONSTRAINT `SaleInvoice_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoiceItem` ADD CONSTRAINT `SaleInvoiceItem_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseBill` ADD CONSTRAINT `PurchaseBill_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseBill` ADD CONSTRAINT `PurchaseBill_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseBillItem` ADD CONSTRAINT `PurchaseBillItem_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Warehouse` ADD CONSTRAINT `Warehouse_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustment` ADD CONSTRAINT `StockAdjustment_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrder` ADD CONSTRAINT `PurchaseOrder_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrderItem` ADD CONSTRAINT `PurchaseOrderItem_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalesOrder` ADD CONSTRAINT `SalesOrder_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalesOrderItem` ADD CONSTRAINT `SalesOrderItem_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditNote` ADD CONSTRAINT `CreditNote_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DebitNote` ADD CONSTRAINT `DebitNote_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
