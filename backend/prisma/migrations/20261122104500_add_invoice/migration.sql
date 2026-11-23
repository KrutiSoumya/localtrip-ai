CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "quotation_amount" INTEGER NOT NULL,
    "line_items" JSONB NOT NULL,
    "adjustments" JSONB NOT NULL DEFAULT '[]',
    "final_amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "public_token" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "payment_ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "Invoice"("invoice_number");
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");
CREATE UNIQUE INDEX "Invoice_public_token_key" ON "Invoice"("public_token");

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
