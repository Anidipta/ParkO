-- Add vehicle information fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20),
ADD COLUMN IF NOT EXISTS vehicle_image_url VARCHAR(500);

-- Add index for license plate lookups
CREATE INDEX IF NOT EXISTS idx_bookings_license ON bookings(license_plate);

-- Comment on columns
COMMENT ON COLUMN bookings.license_plate IS 'Vehicle license/registration plate number';
COMMENT ON COLUMN bookings.vehicle_image_url IS 'Optional URL to vehicle image for verification';
