DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Booking' AND column_name = 'return_date')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Booking' AND column_name = 'returnDate') THEN
    ALTER TABLE "Booking" RENAME COLUMN "return_date" TO "returnDate";
  END IF;
END $$;
