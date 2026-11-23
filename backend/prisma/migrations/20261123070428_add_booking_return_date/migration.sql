/*
  Warnings:

  - You are about to drop the column `invoiceSentAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceStatus` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "invoiceSentAt",
DROP COLUMN "invoiceStatus";
