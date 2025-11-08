# Parko Database Schema Documentation

This document provides comprehensive documentation for the Parko PostgreSQL database schema implemented in Supabase.

## Table of Contents
- [Overview](#overview)
- [Schema Structure (5NF)](#schema-structure-5nf)
- [Setup Instructions](#setup-instructions)
- [Tables](#tables)
- [Triggers and Functions](#triggers-and-functions)
- [Sample Queries](#sample-queries)
- [Storage Buckets](#storage-buckets)

---

## Overview

The Parko database follows **Fifth Normal Form (5NF)** principles to ensure:
- **No data redundancy** – Each piece of information is stored exactly once
- **Data integrity** – Relationships are maintained through foreign keys
- **Scalability** – Easy to extend with new features
- **Performance** – Optimized with strategic indexes

The schema supports:
- User authentication and role management (drivers, owners, managers)
- Driver document verification and profile tracking
- Parking space and slot management
- Booking system with OTP-based entry/exit verification
- Payment processing with usage-based billing
- Real-time slot availability tracking
- Analytics for revenue and usage tracking
- Multi-manager support with invite system

---

## Schema Structure (5NF)

```
users (auth, roles)
├── driver_profiles (verification, documents)
├── parking_spaces (locations, ownership)
│   ├── parking_slots (individual slots, rates)
│   │   ├── bookings (reservations, OTPs)
│   │   │   └── payments (transactions, billing)
│   │   └── slot_availability (real-time tracking)
│   ├── space_managers (multi-manager access)
│   └── analytics_logs (daily revenue, usage)
```

---

## Setup Instructions

### 1. Prerequisites
- Supabase project created ([supabase.com](https://supabase.com))
- Supabase CLI installed (optional, for local development)
- PostgreSQL 14+ compatible environment

### 2. Execute the Schema

#### Option A: Supabase Dashboard
1. Log in to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `scheme.sql`
5. Click **Run** to execute

#### Option B: Supabase CLI
```bash
# Navigate to project directory
cd client

# Run the migration
supabase db reset

# Or execute the schema file directly
psql $DATABASE_URL -f superbase/scheme.sql
```

### 3. Verify Installation
Run this query to check all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- users
- driver_profiles
- parking_spaces
- parking_slots
- bookings
- payments
- slot_availability
- analytics_logs
- space_managers

### 4. Create Storage Bucket
For driver document uploads, create a storage bucket:
1. Go to **Storage** in Supabase dashboard
2. Create new bucket named: `driver-docs`
3. Set to **Private** (requires authentication)
4. Add policy to allow authenticated users to upload/view their documents

---

## Tables

### `users`
**Purpose:** Base authentication and user role management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `phone` | VARCHAR(20) | | Contact number |
| `full_name` | VARCHAR(255) | NOT NULL | User's full name |
| `user_type` | VARCHAR(20) | NOT NULL | 'driver', 'owner', or 'manager' |
| `created_at` | TIMESTAMP | DEFAULT NOW | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW | Last update time |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account status |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_type` on `user_type`

**Sample Row:**
```sql
INSERT INTO users (email, password_hash, full_name, phone, user_type)
VALUES ('john.doe@example.com', '$2a$10$...', 'John Doe', '+1555000111', 'driver');
```

---

### `driver_profiles`
**Purpose:** Driver verification status and document tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `profile_id` | UUID | PRIMARY KEY | Profile identifier |
| `user_id` | UUID | UNIQUE, FK → users | Reference to user |
| `license_number` | VARCHAR(50) | UNIQUE | Extracted license number |
| `license_image_url` | VARCHAR(500) | | Supabase storage URL |
| `plate_number` | VARCHAR(20) | | Vehicle plate number |
| `plate_image_url` | VARCHAR(500) | | Supabase storage URL |
| `pan_card_number` | VARCHAR(20) | | PAN card number |
| `pan_card_image_url` | VARCHAR(500) | | Supabase storage URL |
| `profile_completion_percentage` | INT | DEFAULT 0 | Auto-calculated (0-100) |
| `verification_status` | VARCHAR(20) | DEFAULT 'pending' | 'pending', 'verified', 'rejected' |
| `can_book` | BOOLEAN | DEFAULT FALSE | Booking permission flag |

**Indexes:**
- `idx_driver_verification` on `verification_status`

**Triggers:**
- `trg_profile_completion` – Auto-calculates completion percentage (25% per field)
- Automatically sets `can_book = TRUE` when 100% complete and verified

---

### `parking_spaces`
**Purpose:** Physical parking locations owned by users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `space_id` | UUID | PRIMARY KEY | Space identifier |
| `owner_id` | UUID | FK → users | Space owner |
| `space_name` | VARCHAR(255) | NOT NULL | Display name |
| `address` | TEXT | NOT NULL | Full address |
| `latitude` | NUMERIC(10,8) | NOT NULL | GPS latitude |
| `longitude` | NUMERIC(11,8) | NOT NULL | GPS longitude |
| `total_slots` | INT | NOT NULL | Number of parking slots |
| `created_at` | TIMESTAMP | DEFAULT NOW | Creation time |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status |

**Indexes:**
- `idx_spaces_location` on `(latitude, longitude)` – Geospatial queries
- `idx_spaces_owner` on `owner_id`

**Sample Row:**
```sql
INSERT INTO parking_spaces (owner_id, space_name, address, latitude, longitude, total_slots)
VALUES ('...', 'Downtown Parking', '123 Main St', 40.7128, -74.0060, 50);
```

---

### `parking_slots`
**Purpose:** Individual parking slots within a space

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `slot_id` | UUID | PRIMARY KEY | Slot identifier |
| `space_id` | UUID | FK → parking_spaces | Parent space |
| `slot_number` | VARCHAR(20) | NOT NULL | Display number (e.g., "A-12") |
| `slot_type` | VARCHAR(20) | NOT NULL | 'compact', 'standard', 'large', 'handicap', 'electric' |
| `hourly_rate` | NUMERIC(10,2) | NOT NULL | Price per hour |
| `is_available` | BOOLEAN | DEFAULT TRUE | Current availability |

**Constraints:**
- UNIQUE (`space_id`, `slot_number`) – No duplicate slot numbers within a space

**Indexes:**
- `idx_slots_availability` on `is_available`
- `idx_slots_type` on `slot_type`

---

### `bookings`
**Purpose:** Parking reservations with OTP verification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `booking_id` | UUID | PRIMARY KEY | Booking identifier |
| `driver_id` | UUID | FK → users | Booking driver |
| `slot_id` | UUID | FK → parking_slots | Reserved slot |
| `space_id` | UUID | FK → parking_spaces | Parent space |
| `start_time` | TIMESTAMP | NOT NULL | Scheduled start |
| `end_time` | TIMESTAMP | NOT NULL | Scheduled end |
| `booking_status` | VARCHAR(20) | DEFAULT 'pending' | 'pending', 'confirmed', 'active', 'completed', 'cancelled' |
| `estimated_amount` | NUMERIC(10,2) | NOT NULL | Initial estimate |
| `final_amount` | NUMERIC(10,2) | | Actual charged amount |
| `booking_created_at` | TIMESTAMP | DEFAULT NOW | Creation time |
| `otp_entry` | VARCHAR(6) | | Auto-generated entry OTP |
| `otp_exit` | VARCHAR(6) | | Auto-generated exit OTP |
| `qr_code_url` | VARCHAR(500) | | Auto-generated QR code |
| `actual_entry_time` | TIMESTAMP | | Verified entry time |
| `actual_exit_time` | TIMESTAMP | | Verified exit time |
| `otp_entry_verified` | BOOLEAN | DEFAULT FALSE | Entry verification flag |
| `otp_exit_verified` | BOOLEAN | DEFAULT FALSE | Exit verification flag |

**Indexes:**
- `idx_bookings_driver` on `driver_id`
- `idx_bookings_slot_time` on `(slot_id, start_time, end_time)`
- `idx_bookings_status` on `booking_status`

**Triggers:**
- `trg_generate_otps` – Auto-generates 6-digit entry/exit OTPs and QR code URL
- `trg_slot_booking` – Marks slot as unavailable on booking
- `trg_calculate_bill` – Calculates final bill when exit OTP is verified
- `trg_release_slot` – Releases slot when booking completes

---

### `payments`
**Purpose:** Payment transactions and billing records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `payment_id` | UUID | PRIMARY KEY | Payment identifier |
| `booking_id` | UUID | UNIQUE, FK → bookings | Associated booking |
| `estimated_amount` | NUMERIC(10,2) | NOT NULL | Initial estimate |
| `final_amount` | NUMERIC(10,2) | | Actual billed amount |
| `actual_hours_used` | NUMERIC(10,2) | | Calculated usage |
| `payment_method` | VARCHAR(20) | NOT NULL | 'card', 'upi', 'wallet', 'netbanking' |
| `payment_status` | VARCHAR(20) | DEFAULT 'pending' | 'pending', 'completed', 'failed', 'refunded' |
| `transaction_id` | VARCHAR(100) | UNIQUE | Gateway transaction ID |
| `payment_date` | TIMESTAMP | DEFAULT NOW | Payment time |
| `receipt_url` | VARCHAR(500) | | Receipt/invoice URL |

**Indexes:**
- `idx_payments_transaction` on `transaction_id`
- `idx_payments_status` on `payment_status`

**Triggers:**
- `trg_analytics_payment` – Updates daily analytics when payment completes

---

### `slot_availability`
**Purpose:** Real-time slot availability tracking (optional, for fine-grained control)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `availability_id` | UUID | PRIMARY KEY | Record identifier |
| `slot_id` | UUID | FK → parking_slots | Tracked slot |
| `date` | DATE | NOT NULL | Calendar date |
| `time_slot` | TIME | NOT NULL | Hourly time slot |
| `is_occupied` | BOOLEAN | DEFAULT FALSE | Occupation status |
| `occupied_until` | TIMESTAMP | | Expected release time |

**Constraints:**
- UNIQUE (`slot_id`, `date`, `time_slot`)

**Indexes:**
- `idx_availability_occupied` on `(is_occupied, occupied_until)`

---

### `analytics_logs`
**Purpose:** Daily aggregated analytics for owners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `log_id` | UUID | PRIMARY KEY | Log identifier |
| `space_id` | UUID | FK → parking_spaces | Tracked space |
| `date` | DATE | NOT NULL | Analytics date |
| `total_bookings` | INT | DEFAULT 0 | Number of bookings |
| `total_revenue` | NUMERIC(10,2) | DEFAULT 0 | Total earnings |
| `occupied_hours` | NUMERIC(10,2) | DEFAULT 0 | Total usage hours |

**Constraints:**
- UNIQUE (`space_id`, `date`)

**Indexes:**
- `idx_analytics_date` on `date`

---

### `space_managers`
**Purpose:** Multi-manager access control with invite system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `manager_id` | UUID | PRIMARY KEY | Manager record ID |
| `space_id` | UUID | FK → parking_spaces | Managed space |
| `user_id` | UUID | FK → users | Manager user |
| `assigned_by` | UUID | FK → users | Inviting owner |
| `invite_token` | VARCHAR(100) | UNIQUE | Invitation token |
| `invite_status` | VARCHAR(20) | DEFAULT 'pending' | 'pending', 'accepted', 'expired' |
| `assigned_at` | TIMESTAMP | DEFAULT NOW | Assignment time |

**Constraints:**
- UNIQUE (`space_id`, `user_id`)

**Indexes:**
- `idx_managers_invite` on `invite_token`

---

## Triggers and Functions

### 1. Profile Completion Trigger
**Function:** `calculate_profile_completion()`  
**Trigger:** `trg_profile_completion`  
**Fires:** BEFORE INSERT OR UPDATE on `driver_profiles`

**Purpose:** Automatically calculates profile completion percentage based on filled fields.

**Logic:**
- License number: +25%
- License image: +25%
- Plate number: +25%
- PAN card number: +25%
- Sets `can_book = TRUE` when 100% complete AND verified

**Example:**
```sql
-- When driver uploads license and plate images
UPDATE driver_profiles 
SET license_image_url = 'https://...', plate_image_url = 'https://...'
WHERE user_id = '...';

-- Trigger automatically updates profile_completion_percentage to 50%
```

---

### 2. OTP Generation Trigger
**Function:** `generate_booking_otps()`  
**Trigger:** `trg_generate_otps`  
**Fires:** BEFORE INSERT on `bookings`

**Purpose:** Generates 6-digit entry and exit OTPs plus QR code URL for new bookings.

**Logic:**
- `otp_entry`: Random 6-digit number (000000-999999)
- `otp_exit`: Random 6-digit number (000000-999999)
- `qr_code_url`: URL to QR code generator with embedded OTPs and booking ID

**Example Output:**
```
otp_entry: "742819"
otp_exit: "358421"
qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ENTRY:742819|EXIT:358421|BOOKING:uuid..."
```

---

### 3. Slot Booking Trigger
**Function:** `update_slot_on_booking()`  
**Trigger:** `trg_slot_booking`  
**Fires:** AFTER INSERT on `bookings`

**Purpose:** Marks a slot as unavailable when a booking is created.

**Logic:**
```sql
UPDATE parking_slots 
SET is_available = FALSE 
WHERE slot_id = NEW.slot_id;
```

---

### 4. Analytics Update Trigger
**Function:** `update_analytics_on_payment()`  
**Trigger:** `trg_analytics_payment`  
**Fires:** AFTER UPDATE on `payments`

**Purpose:** Updates daily analytics when a payment status changes to 'completed'.

**Logic:**
- Finds the associated space and date from the booking
- Increments `total_bookings` by 1
- Adds payment amount to `total_revenue`
- Uses UPSERT (INSERT...ON CONFLICT) to handle first-time entries

---

### 5. Slot Release Trigger
**Function:** `release_slot_after_booking()`  
**Trigger:** `trg_release_slot`  
**Fires:** AFTER UPDATE on `bookings`

**Purpose:** Releases a slot (marks as available) when booking status changes to 'completed'.

**Logic:**
```sql
IF NEW.booking_status = 'completed' AND OLD.booking_status != 'completed' THEN
  UPDATE parking_slots 
  SET is_available = TRUE 
  WHERE slot_id = NEW.slot_id;
END IF;
```

---

### 6. Final Bill Calculation Trigger
**Function:** `calculate_final_bill()`  
**Trigger:** `trg_calculate_bill`  
**Fires:** BEFORE UPDATE on `bookings`

**Purpose:** Calculates final bill when exit OTP is verified.

**Logic:**
1. Checks if `otp_exit_verified` changed from FALSE to TRUE
2. Retrieves the hourly rate from `parking_slots`
3. Calculates hours used: `(actual_exit_time - actual_entry_time) / 3600`
4. Calculates `final_amount = hours_used * hourly_rate`
5. Updates `final_amount` and `actual_hours_used` in `payments` table
6. Sets `booking_status = 'completed'`

**Example:**
```sql
-- Driver enters and exits
UPDATE bookings 
SET actual_entry_time = '2025-11-07 10:00:00',
    actual_exit_time = '2025-11-07 12:30:00',
    otp_exit_verified = TRUE
WHERE booking_id = '...';

-- Trigger calculates: 2.5 hours * $5/hour = $12.50
```

---

## Sample Queries

### User Registration
```sql
-- Create a new driver account
INSERT INTO users (email, password_hash, full_name, phone, user_type)
VALUES ('driver@example.com', '$2a$10$hashed...', 'Jane Smith', '+1555123456', 'driver')
RETURNING user_id;

-- Create driver profile
INSERT INTO driver_profiles (user_id)
VALUES ('user_id_from_above');
```

### Find Nearby Parking Spaces
```sql
-- Find spaces within ~5km radius (simplified, use PostGIS for production)
SELECT space_id, space_name, address, 
       (
         6371 * acos(
           cos(radians(40.7128)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians(-74.0060)) + 
           sin(radians(40.7128)) * sin(radians(latitude))
         )
       ) AS distance_km
FROM parking_spaces
WHERE is_active = TRUE
HAVING distance_km < 5
ORDER BY distance_km;
```

### Get Available Slots for a Space
```sql
SELECT slot_id, slot_number, slot_type, hourly_rate
FROM parking_slots
WHERE space_id = 'space_uuid_here'
  AND is_available = TRUE
ORDER BY slot_number;
```

### Create a Booking
```sql
INSERT INTO bookings (driver_id, slot_id, space_id, start_time, end_time, estimated_amount)
VALUES (
  'driver_uuid',
  'slot_uuid',
  'space_uuid',
  NOW() + INTERVAL '10 minutes',
  NOW() + INTERVAL '2 hours 10 minutes',
  10.00  -- 2 hours * $5/hour
)
RETURNING booking_id, otp_entry, otp_exit, qr_code_url;
```

### Verify Entry OTP
```sql
UPDATE bookings
SET otp_entry_verified = TRUE,
    actual_entry_time = NOW(),
    booking_status = 'active'
WHERE booking_id = 'booking_uuid'
  AND otp_entry = '742819'
  AND otp_entry_verified = FALSE;
```

### Verify Exit OTP (triggers final billing)
```sql
UPDATE bookings
SET otp_exit_verified = TRUE,
    actual_exit_time = NOW()
WHERE booking_id = 'booking_uuid'
  AND otp_exit = '358421'
  AND otp_exit_verified = FALSE;
-- Trigger automatically calculates final bill
```

### Get Driver Profile Status
```sql
SELECT 
  u.email, u.full_name,
  dp.profile_completion_percentage,
  dp.verification_status,
  dp.can_book
FROM users u
JOIN driver_profiles dp ON u.user_id = dp.user_id
WHERE u.user_id = 'user_uuid';
```

### Owner Analytics Dashboard
```sql
SELECT date, total_bookings, total_revenue, occupied_hours
FROM analytics_logs
WHERE space_id = 'space_uuid'
  AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### Manager Invite Flow
```sql
-- Owner creates invite
INSERT INTO space_managers (space_id, user_id, assigned_by, invite_token)
VALUES ('space_uuid', 'manager_user_uuid', 'owner_user_uuid', 'unique_token_123')
RETURNING invite_token;

-- Manager accepts invite
UPDATE space_managers
SET invite_status = 'accepted'
WHERE invite_token = 'unique_token_123'
  AND invite_status = 'pending';
```

---

## Storage Buckets

### `driver-docs` Bucket
**Purpose:** Store driver verification documents (license, plate, PAN images)

**Policies Required:**
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'driver-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**File Structure:**
```
driver-docs/
  └── {user_id}/
       ├── license.jpg
       ├── plate.jpg
       └── pan.jpg
```

---

## Maintenance & Best Practices

### Indexes
All critical indexes are already created. Monitor query performance with:
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Vacuum and Analyze
Run periodically to maintain performance:
```sql
VACUUM ANALYZE users;
VACUUM ANALYZE bookings;
VACUUM ANALYZE payments;
```

### Backup
Supabase provides automatic daily backups. For manual backup:
```bash
pg_dump $DATABASE_URL > parko_backup_$(date +%Y%m%d).sql
```

### Security
- Never expose `SUPABASE_SERVICE_ROLE_KEY` on client side
- Use Row Level Security (RLS) policies for client access
- Rotate JWT secrets periodically
- Audit `users` table for suspicious activity

---

**Last Updated:** November 7, 2025  
**Schema Version:** 1.0  
**Compatibility:** PostgreSQL 14+, Supabase
