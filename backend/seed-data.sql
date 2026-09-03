-- =====================================================================
-- CORRECTED seed data for Local Service Finder
-- Fixes vs. your original script:
--   1. Password hash now genuinely matches "password123" (verified with
--      BCrypt - your old hash was well-formed but did NOT match that
--      password, which is why every seeded login was failing).
--   2. bookings columns fixed to match the actual entity/schema:
--        scheduled_time -> scheduled_at
--        total_amount   -> estimated_amount
--        address         -> job_address (new column, added for the
--                             "get directions" feature)
--      Your original INSERT would have failed with an "Unknown column"
--      error against the real table Hibernate creates.
--   3. Added job_latitude / job_longitude to the sample booking so the
--      "Get Directions" button on the provider dashboard has real
--      coordinates to use immediately.
--
-- Run this AFTER starting the backend at least once (so Hibernate has
-- created all tables from the entities), then re-run it any time you
-- want to reset to a clean demo state.
-- =====================================================================

USE local_service_finder;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payments;
TRUNCATE TABLE bookings;
TRUNCATE TABLE availability_slots;
TRUNCATE TABLE service_providers;
TRUNCATE TABLE users;
TRUNCATE TABLE service_categories;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Service Categories
INSERT INTO service_categories (id, name) VALUES
(1, 'Electrician'),
(2, 'Plumber'),
(3, 'AC & Appliance Repair'),
(4, 'House Cleaning'),
(5, 'Painter & Decorator'),
(6, 'Carpenter');

-- 2. Users
-- Password for EVERY seeded account below is: password123
-- This hash was generated with BCrypt (strength 10, same as Spring's
-- default BCryptPasswordEncoder) and verified to match "password123".
INSERT INTO users (id, full_name, email, phone, password, role, created_at) VALUES
-- Customers
(1, 'Customer Test', 'customer@test.com', '9876543201', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'CUSTOMER', NOW()),
(2, 'Wardha Resident', 'wardha.cust@test.com', '9876543202', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'CUSTOMER', NOW()),

-- Providers (IDs 101 to 108)
(101, 'Anurag Electricals & Maintenance', 'anurag.wardha@test.com', '9325145073', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(102, 'Santosh Pipe & Sanitary Works', 'santosh.wardha@test.com', '9822100001', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(103, 'Sai Cool Care AC & Refrigerator', 'saicool.wardha@test.com', '9822100002', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(104, 'Swachh Wardha Deep Cleaning', 'swachh.wardha@test.com', '9822100003', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(105, 'Omkar Woodworks & Furniture Repair', 'omkar.wardha@test.com', '9822100004', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(106, 'Kisan Home Painting Solutions', 'kisan.wardha@test.com', '9822100005', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(107, 'Shree Ganesh Wiring & Inverter Care', 'shreeganesh@test.com', '9822100006', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(108, 'Gurukripa Sump & Tank Cleaning', 'gurukripa.wardha@test.com', '9822100007', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW());

-- 3. Service Providers (linked to users 101-108)
INSERT INTO service_providers (id, user_id, category_id, bio, hourly_rate, upi_vpa, available, rating, total_reviews, latitude, longitude, address) VALUES
(1, 101, 1, 'Wiring repair, fan installation, MCB breaker replacement in Wardha', 200.00, '9325145073@axl', 1, 4.9, 28, 20.72410, 78.57520, 'Ramnagar, Wardha'),
(2, 102, 2, 'Expert leakage fixing, bathroom fittings, motor installation', 180.00, '9325145073@axl', 1, 4.8, 19, 20.74120, 78.59910, 'Near Shivaji Chowk, Wardha'),
(3, 103, 3, 'Split/Window AC gas charging, compressor repair, fridge care', 350.00, '9325145073@axl', 1, 4.7, 34, 20.73280, 78.58410, 'Bajaj Chowk, Wardha'),
(4, 104, 4, 'Full villa sanitation, bathroom acid wash, sofa scrubbing', 250.00, '9325145073@axl', 1, 4.9, 15, 20.75110, 78.56840, 'Arvi Naka, Wardha'),
(5, 105, 6, 'Door latch replacement, modular kitchen hinge fixing', 220.00, '9325145073@axl', 1, 4.6, 22, 20.73800, 78.58900, 'Bachelor Road, Wardha'),
(6, 106, 5, 'Interior emulsion, exterior weatherproof paint, wall putty', 300.00, '9325145073@axl', 1, 4.8, 11, 20.71800, 78.56200, 'Nalwadi, Wardha'),
(7, 107, 1, 'House wiring, earth grounding check, LED panel installation', 190.00, '9325145073@axl', 1, 4.9, 41, 20.71250, 78.60100, 'Sevagram Road, Wardha'),
(8, 108, 4, 'High-pressure mechanized water tank sanitization with UV treatment', 280.00, '9325145073@axl', 1, 4.7, 9, 20.70900, 78.55300, 'Borgaon Road, Wardha');

-- 4. Weekly Availability (Mon-Sat, 9am-6pm, for every provider)
INSERT INTO availability_slots (provider_id, day_of_week, start_time, end_time)
SELECT p.id, d.day, '09:00:00', '18:00:00'
FROM service_providers p
CROSS JOIN (
    SELECT 'MONDAY' AS day UNION ALL
    SELECT 'TUESDAY' UNION ALL
    SELECT 'WEDNESDAY' UNION ALL
    SELECT 'THURSDAY' UNION ALL
    SELECT 'FRIDAY' UNION ALL
    SELECT 'SATURDAY'
) d;

-- 5. Pre-created CONFIRMED booking for direct Payment / Directions / Tracking testing
-- Columns match the Booking entity exactly: scheduled_at, estimated_hours,
-- estimated_amount, job_address, job_latitude, job_longitude.
INSERT INTO bookings
    (id, customer_id, provider_id, status, scheduled_at, estimated_hours, estimated_amount,
     notes, job_address, job_latitude, job_longitude, created_at)
VALUES
    (1, 1, 1, 'CONFIRMED', NOW(), 2, 400.00,
     'Urgent fan and switch repair', 'Civil Lines, Wardha', 20.7280, 78.6020, NOW());

-- 6. Safety net: make sure transaction_ref stays nullable
-- (Payment.transactionRef has no `nullable = false`, so this is just a
-- defensive fix in case an older schema version has it locked NOT NULL.)
ALTER TABLE payments MODIFY transaction_ref VARCHAR(255) NULL;

-- 7. Auto-provisioning trigger: any NEW user registered with role=PROVIDER
-- straight into MySQL (outside the app) gets a default provider profile too.
-- NOTE: registering through the app itself does NOT go through this trigger -
-- AuthService.java already creates the ServiceProvider row in Java. This
-- trigger only matters if you insert PROVIDER users directly via SQL.
DROP TRIGGER IF EXISTS after_user_provider_insert;

DELIMITER $$
CREATE TRIGGER after_user_provider_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.role = 'PROVIDER' THEN
        INSERT INTO service_providers (
            user_id, category_id, bio, hourly_rate, upi_vpa, available, rating, total_reviews, latitude, longitude, address
        ) VALUES (
            NEW.id, 1, 'Verified Service Specialist in Wardha', 200.00,
            CONCAT(IFNULL(NEW.phone, '9325145073'), '@axl'), 1, 5.0, 0, 20.7241, 78.5752, 'Wardha, Maharashtra'
        );
    END IF;
END$$
DELIMITER ;
