-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_quotationId_fkey";

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "quotationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
