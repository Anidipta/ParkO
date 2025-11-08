-- Migration: Driver Documents & QR Code Storage
-- This updates the schema to store driver documents and QR codes

-- 1. Remove vehicle fields from bookings (now in driver_profiles)
ALTER TABLE bookings DROP COLUMN IF EXISTS license_plate;
ALTER TABLE bookings DROP COLUMN IF EXISTS vehicle_image_url;

-- 2. Add QR code base64 storage to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT;

-- 3. Update the QR code generation trigger to also save base64
CREATE OR REPLACE FUNCTION generate_booking_otps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.otp_entry := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    NEW.otp_exit := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    NEW.qr_code_url := 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' || 
                       'ENTRY:' || NEW.otp_entry || '|EXIT:' || NEW.otp_exit || '|BOOKING:' || NEW.booking_id;
    -- QR code base64 will be set by the API after generation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger
DROP TRIGGER IF EXISTS trg_generate_otps ON bookings;
CREATE TRIGGER trg_generate_otps
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION generate_booking_otps();

COMMENT ON COLUMN bookings.qr_code_base64 IS 'Base64 encoded QR code image for entry/exit OTPs';
COMMENT ON COLUMN driver_profiles.license_number IS 'Driver license number collected during signup';
COMMENT ON COLUMN driver_profiles.plate_number IS 'Vehicle plate number collected during signup';
COMMENT ON COLUMN driver_profiles.pan_card_number IS 'PAN card number collected during signup';
