-- Migration: Change from individual slots to grouped slot types
-- This changes the parking_slots table to store slot type groups with counts

-- Drop the old parking_slots table and recreate with new structure
DROP TABLE IF EXISTS parking_slots CASCADE;

-- New table: slot_groups - stores slot types with counts
CREATE TABLE parking_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES parking_spaces(space_id) ON DELETE CASCADE,
    slot_type VARCHAR(20) CHECK (slot_type IN ('standard', 'near_gate', 'covered', 'women_only', 'disabled', 'ev_charging', 'premium', 'compact')) NOT NULL,
    slot_count INT NOT NULL DEFAULT 0, -- Total number of this type
    available_count INT NOT NULL DEFAULT 0, -- Currently available
    hourly_rate NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (space_id, slot_type) -- One record per slot type per space
);

CREATE INDEX idx_slots_space ON parking_slots(space_id);
CREATE INDEX idx_slots_type ON parking_slots(slot_type);
CREATE INDEX idx_slots_availability ON parking_slots(available_count);

-- Update bookings table to store which slot type was booked (not individual slot)
-- The slot_id in bookings now references the slot_type group

COMMENT ON COLUMN parking_slots.slot_count IS 'Total number of slots of this type';
COMMENT ON COLUMN parking_slots.available_count IS 'Number of available slots of this type';
COMMENT ON TABLE parking_slots IS 'Stores parking slot types with counts, not individual slots';

-- Trigger to ensure available_count doesn't exceed slot_count
CREATE OR REPLACE FUNCTION validate_slot_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.available_count > NEW.slot_count THEN
        NEW.available_count := NEW.slot_count;
    END IF;
    IF NEW.available_count < 0 THEN
        NEW.available_count := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_slot_counts
BEFORE INSERT OR UPDATE ON parking_slots
FOR EACH ROW EXECUTE FUNCTION validate_slot_counts();

-- Update booking trigger to decrement available_count
CREATE OR REPLACE FUNCTION update_slot_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement available count for the slot type
    UPDATE parking_slots 
    SET available_count = GREATEST(0, available_count - 1)
    WHERE slot_id = NEW.slot_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to increment available_count when booking completes
CREATE OR REPLACE FUNCTION release_slot_after_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_status = 'completed' AND OLD.booking_status != 'completed' THEN
        -- Increment available count
        UPDATE parking_slots 
        SET available_count = LEAST(slot_count, available_count + 1)
        WHERE slot_id = NEW.slot_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
