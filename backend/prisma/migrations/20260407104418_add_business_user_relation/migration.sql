-- AlterTable
ALTER TABLE `user` ADD COLUMN `businessId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `BusinessProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
