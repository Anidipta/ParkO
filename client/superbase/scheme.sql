-- PARKO DATABASE SCHEMA (5NF - PostgreSQL)

-- Base user authentication table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) CHECK (user_type IN ('driver', 'owner', 'manager')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- Driver verification and document storage
CREATE TABLE driver_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE,
    license_image_url VARCHAR(500),
    plate_number VARCHAR(20),
    plate_image_url VARCHAR(500),
    pan_card_number VARCHAR(20),
    pan_card_image_url VARCHAR(500),
    profile_completion_percentage INT DEFAULT 0,
    verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    can_book BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_driver_verification ON driver_profiles(verification_status);

-- Physical parking location details
CREATE TABLE parking_spaces (
    space_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    space_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    total_slots INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    hourly_rate NUMERIC(10,2) DEFAULT 0
);
CREATE INDEX idx_spaces_location ON parking_spaces(latitude, longitude);
CREATE INDEX idx_spaces_owner ON parking_spaces(owner_id);

-- Individual parking slots within each space
CREATE TABLE parking_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES parking_spaces(space_id) ON DELETE CASCADE,
    slot_number VARCHAR(20) NOT NULL,
    slot_type VARCHAR(20) CHECK (slot_type IN ('compact', 'standard', 'large', 'handicap', 'electric')) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE (space_id, slot_number)
);
CREATE INDEX idx_slots_availability ON parking_slots(is_available);
CREATE INDEX idx_slots_type ON parking_slots(slot_type);

-- Manager assignments with invite system
CREATE TABLE space_managers (
    manager_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES parking_spaces(space_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(user_id),
    invite_token VARCHAR(100) UNIQUE,
    invite_status VARCHAR(20) CHECK (invite_status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (space_id, user_id)
);
CREATE INDEX idx_managers_invite ON space_managers(invite_token);

-- Booking records with entry/exit OTP verification and time tracking
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES users(user_id),
    slot_id UUID NOT NULL REFERENCES parking_slots(slot_id),
    space_id UUID NOT NULL REFERENCES parking_spaces(space_id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    booking_status VARCHAR(20) CHECK (booking_status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
    estimated_amount NUMERIC(10, 2) NOT NULL,
    final_amount NUMERIC(10, 2),
    booking_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    otp_entry VARCHAR(6),
    otp_exit VARCHAR(6),
    qr_code_url VARCHAR(500),
    actual_entry_time TIMESTAMP,
    actual_exit_time TIMESTAMP,
    otp_entry_verified BOOLEAN DEFAULT FALSE,
    otp_exit_verified BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_bookings_driver ON bookings(driver_id);
CREATE INDEX idx_bookings_slot_time ON bookings(slot_id, start_time, end_time);
CREATE INDEX idx_bookings_status ON bookings(booking_status);

-- Payment transactions with actual usage-based billing
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(booking_id),
    estimated_amount NUMERIC(10, 2) NOT NULL,
    final_amount NUMERIC(10, 2),
    actual_hours_used NUMERIC(10, 2),
    payment_method VARCHAR(20) CHECK (payment_method IN ('card', 'upi', 'wallet', 'netbanking')) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_id VARCHAR(100) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receipt_url VARCHAR(500)
);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Real-time slot availability tracking
CREATE TABLE slot_availability (
    availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES parking_slots(slot_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    occupied_until TIMESTAMP,
    UNIQUE (slot_id, date, time_slot)
);
CREATE INDEX idx_availability_occupied ON slot_availability(is_occupied, occupied_until);

-- Daily analytics for revenue and usage tracking
CREATE TABLE analytics_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES parking_spaces(space_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_bookings INT DEFAULT 0,
    total_revenue NUMERIC(10, 2) DEFAULT 0,
    occupied_hours NUMERIC(10, 2) DEFAULT 0,
    UNIQUE (space_id, date)
);
CREATE INDEX idx_analytics_date ON analytics_logs(date);

-- Trigger to calculate profile completion percentage (25% per field)
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := 
        (CASE WHEN NEW.license_number IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.license_image_url IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.plate_number IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.pan_card_number IS NOT NULL THEN 25 ELSE 0 END);
    
    IF NEW.profile_completion_percentage = 100 AND NEW.verification_status = 'verified' THEN
        NEW.can_book := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profile_completion
BEFORE INSERT OR UPDATE ON driver_profiles
FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();

-- Trigger to generate entry and exit OTPs with QR code URL
CREATE OR REPLACE FUNCTION generate_booking_otps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.otp_entry := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    NEW.otp_exit := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    NEW.qr_code_url := 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' || 
                       'ENTRY:' || NEW.otp_entry || '|EXIT:' || NEW.otp_exit || '|BOOKING:' || NEW.booking_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_otps
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION generate_booking_otps();

-- Trigger to mark slot unavailable when booked
CREATE OR REPLACE FUNCTION update_slot_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE parking_slots SET is_available = FALSE WHERE slot_id = NEW.slot_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_slot_booking
AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION update_slot_on_booking();

-- Trigger to update analytics when payment completes
CREATE OR REPLACE FUNCTION update_analytics_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
        INSERT INTO analytics_logs (space_id, date, total_bookings, total_revenue)
        SELECT b.space_id, DATE(NEW.payment_date), 1, NEW.amount
        FROM bookings b WHERE b.booking_id = NEW.booking_id
        ON CONFLICT (space_id, date) DO UPDATE
        SET total_bookings = analytics_logs.total_bookings + 1,
            total_revenue = analytics_logs.total_revenue + EXCLUDED.total_revenue;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_analytics_payment
AFTER UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_analytics_on_payment();

-- Trigger to release slot when booking completes
CREATE OR REPLACE FUNCTION release_slot_after_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_status = 'completed' AND OLD.booking_status != 'completed' THEN
        UPDATE parking_slots SET is_available = TRUE WHERE slot_id = NEW.slot_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_release_slot
AFTER UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION release_slot_after_booking();

-- Trigger to calculate final bill when exit OTP is verified
CREATE OR REPLACE FUNCTION calculate_final_bill()
RETURNS TRIGGER AS $$
DECLARE
    hourly_rate NUMERIC(10, 2);
    hours_used NUMERIC(10, 2);
BEGIN
    IF NEW.otp_exit_verified = TRUE AND OLD.otp_exit_verified = FALSE AND NEW.actual_exit_time IS NOT NULL THEN
        SELECT ps.hourly_rate INTO hourly_rate
        FROM parking_slots ps WHERE ps.slot_id = NEW.slot_id;
        
        hours_used := EXTRACT(EPOCH FROM (NEW.actual_exit_time - NEW.actual_entry_time)) / 3600.0;
        
        NEW.final_amount := ROUND(hours_used * hourly_rate, 2);
        NEW.booking_status := 'completed';
        
        UPDATE payments 
        SET final_amount = NEW.final_amount, 
            actual_hours_used = hours_used
        WHERE booking_id = NEW.booking_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_bill
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION calculate_final_bill();

-- Trigger to record entry time when entry OTP is verified
CREATE OR REPLACE FUNCTION record_entry_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.otp_entry_verified = TRUE AND OLD.otp_entry_verified = FALSE THEN
        NEW.actual_entry_time := CURRENT_TIMESTAMP;
        NEW.booking_status := 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_record_entry
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION record_entry_time();
