-- Older quotation flows incorrectly set bookings to Paid without receiving payment.
-- Only an existing invoice can justify retaining a booking payment status.
UPDATE "Booking" AS booking
SET "paymentStatus" = 'Not Due'
WHERE NOT EXISTS (
  SELECT 1 FROM "Invoice" AS invoice WHERE invoice."bookingId" = booking."id"
);
