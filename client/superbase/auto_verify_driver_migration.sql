-- Migration: Auto-verify drivers and remove vehicle fields from bookings
-- This migration:
-- 1. Updates the profile completion trigger to auto-verify drivers
-- 2. Removes license_plate and vehicle_image_url from bookings table (already in driver_profiles)
-- 3. Auto-verifies existing drivers who have all required documents

-- Step 1: Update the profile completion trigger to auto-verify
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := 
        (CASE WHEN NEW.license_number IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.license_image_url IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.plate_number IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.pan_card_number IS NOT NULL THEN 25 ELSE 0 END);
    
    -- Auto-verify and enable booking if all required fields are present
    IF NEW.license_number IS NOT NULL AND NEW.plate_number IS NOT NULL AND NEW.pan_card_number IS NOT NULL THEN
        NEW.verification_status := 'verified';
        NEW.can_book := TRUE;
        NEW.profile_completion_percentage := 100;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Remove vehicle-related columns from bookings table (if they exist)
-- These columns are now in driver_profiles table
ALTER TABLE bookings DROP COLUMN IF EXISTS license_plate;
ALTER TABLE bookings DROP COLUMN IF EXISTS vehicle_image_url;

-- Step 3: Auto-verify existing drivers who have all required documents
UPDATE driver_profiles
SET 
    verification_status = 'verified',
    can_book = TRUE,
    profile_completion_percentage = 100
WHERE 
    license_number IS NOT NULL 
    AND plate_number IS NOT NULL 
    AND pan_card_number IS NOT NULL
    AND verification_status != 'verified';

-- Verification: Show updated driver profiles
SELECT 
    user_id,
    license_number,
    plate_number,
    pan_card_number,
    verification_status,
    can_book,
    profile_completion_percentage
FROM driver_profiles
ORDER BY created_at DESC;

COMMENT ON FUNCTION calculate_profile_completion() IS 'Auto-verifies drivers when all required documents (license, plate, PAN) are provided';
