-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "travelDate" TIMESTAMP(3);
