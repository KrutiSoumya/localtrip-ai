ALTER TABLE "Booking"
RENAME COLUMN "returnDate" TO "return_date";

ALTER TABLE "Booking"
ALTER COLUMN "paymentStatus" SET DEFAULT 'Not Due';

UPDATE "Booking"
SET "paymentStatus" = 'Not Due'
WHERE "paymentStatus" = 'Pending';

UPDATE "Booking"
SET "paymentStatus" = 'Invoice Sent'
WHERE "paymentStatus" = 'Partial';

UPDATE "Booking"
SET "paymentStatus" = 'Overdu'
WHERE "paymentStatus" = 'Failed';

