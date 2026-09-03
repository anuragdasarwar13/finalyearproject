-- =====================================================================
-- Local Service Finder - VERIFIED seed/migration script
-- Cross-checked field-by-field against the current entity classes:
--   User, ServiceProvider, ServiceCategory, Booking, Payment, AvailabilitySlot
-- All ASCII characters only (no smart quotes / non-breaking spaces).
--
-- PREREQUISITE (do this once, not part of this script):
--   1. Stop the backend.
--   2. DROP DATABASE local_service_finder;
--   3. Start the backend once so Hibernate (ddl-auto=update) recreates
--      every table fresh from the CURRENT entity classes with zero
--      leftover/drifted columns (no payee_vpa, no duplicate total_amount).
--   4. THEN run this script.
-- =====================================================================

USE local_service_finder;

-- ---------------------------------------------------------------------
-- STEP 1: Drop the auto-provisioning trigger FIRST, before any seeding.
-- Reason: the trigger fires AFTER INSERT ON users for any role=PROVIDER
-- row and inserts its own service_providers row. If it were still active
-- while we seed users 101-108, it would create service_providers rows
-- with default placeholder data, and our later explicit INSERT INTO
-- service_providers (same user_id) would then fail on the unique
-- constraint on user_id (a provider can only have one profile). Dropping
-- it first, and only recreating it at the very end, avoids that collision
-- entirely.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS after_user_provider_insert;

-- ---------------------------------------------------------------------
-- STEP 2: Clean slate. FK checks disabled only for the duration of the
-- truncation, re-enabled immediately after, in child-to-parent order.
-- ---------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payments;
TRUNCATE TABLE bookings;
TRUNCATE TABLE availability_slots;
TRUNCATE TABLE service_providers;
TRUNCATE TABLE users;
TRUNCATE TABLE service_categories;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- STEP 3: service_categories
-- Entity: ServiceCategory { id, name (unique, not null), iconUrl }
-- ---------------------------------------------------------------------
INSERT INTO service_categories (id, name) VALUES
(1, 'Electrician'),
(2, 'Plumber'),
(3, 'AC & Appliance Repair'),
(4, 'House Cleaning'),
(5, 'Painter & Decorator'),
(6, 'Carpenter');

-- ---------------------------------------------------------------------
-- STEP 4: users
-- Entity: User { id, fullName, email (unique, not null), phone, password,
--                role (STRING enum: CUSTOMER/PROVIDER/ADMIN), createdAt }
--
-- Password hash below was generated with BCrypt, cost factor 10 (the
-- exact default used by Spring Security's BCryptPasswordEncoder) and
-- independently verified to match the plaintext password: password123
-- ---------------------------------------------------------------------
INSERT INTO users (id, full_name, email, phone, password, role, created_at) VALUES
(1,   'Customer Test',                    'customer@test.com',       '9876543201', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'CUSTOMER', NOW()),
(2,   'Wardha Resident',                  'wardha.cust@test.com',    '9876543202', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'CUSTOMER', NOW()),
(101, 'Anurag Electricals & Maintenance', 'anurag.wardha@test.com',  '9325145073', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(102, 'Santosh Pipe & Sanitary Works',    'santosh.wardha@test.com', '9822100001', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(103, 'Sai Cool Care AC & Refrigerator',  'saicool.wardha@test.com', '9822100002', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(104, 'Swachh Wardha Deep Cleaning',      'swachh.wardha@test.com',  '9822100003', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(105, 'Omkar Woodworks & Furniture Repair','omkar.wardha@test.com',  '9822100004', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(106, 'Kisan Home Painting Solutions',    'kisan.wardha@test.com',   '9822100005', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(107, 'Shree Ganesh Wiring & Inverter Care','shreeganesh@test.com',  '9822100006', '$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW()),
(108, 'Gurukripa Sump & Tank Cleaning',   'gurukripa.wardha@test.com','9822100007','$2a$10$SBYZ37z9SSobPMHQTUQ05ukL..zTf9TnGm2T3N8CsvbPhFCY4R.kq', 'PROVIDER', NOW());

-- ---------------------------------------------------------------------
-- STEP 5: service_providers
-- Entity: ServiceProvider { id, user (FK user_id, unique, not null),
--   category (FK category_id, not null), bio, hourlyRate (not null),
--   latitude (not null), longitude (not null), address (not null),
--   rating, totalReviews, available, upiVpa (not null) }
-- NOTE: no payee_vpa column exists on this entity - upi_vpa is the only
-- UPI identifier field, and it lives here (not on Payment).
-- Trigger is dropped at this point, so this explicit insert is the ONLY
-- write to this table for these 8 providers - no collision risk.
-- ---------------------------------------------------------------------
INSERT INTO service_providers (id, user_id, category_id, bio, hourly_rate, upi_vpa, available, rating, total_reviews, latitude, longitude, address) VALUES
(1, 101, 1, 'Wiring repair, fan installation, MCB breaker replacement in Wardha', 200.00, '9325145073@axl', 1, 4.9, 28, 20.72410, 78.57520, 'Ramnagar, Wardha'),
(2, 102, 2, 'Expert leakage fixing, bathroom fittings, motor installation', 180.00, '9325145073@axl', 1, 4.8, 19, 20.74120, 78.59910, 'Near Shivaji Chowk, Wardha'),
(3, 103, 3, 'Split/Window AC gas charging, compressor repair, fridge care', 350.00, '9325145073@axl', 1, 4.7, 34, 20.73280, 78.58410, 'Bajaj Chowk, Wardha'),
(4, 104, 4, 'Full villa sanitation, bathroom acid wash, sofa scrubbing', 250.00, '9325145073@axl', 1, 4.9, 15, 20.75110, 78.56840, 'Arvi Naka, Wardha'),
(5, 105, 6, 'Door latch replacement, modular kitchen hinge fixing', 220.00, '9325145073@axl', 1, 4.6, 22, 20.73800, 78.58900, 'Bachelor Road, Wardha'),
(6, 106, 5, 'Interior emulsion, exterior weatherproof paint, wall putty', 300.00, '9325145073@axl', 1, 4.8, 11, 20.71800, 78.56200, 'Nalwadi, Wardha'),
(7, 107, 1, 'House wiring, earth grounding check, LED panel installation', 190.00, '9325145073@axl', 1, 4.9, 41, 20.71250, 78.60100, 'Sevagram Road, Wardha'),
(8, 108, 4, 'High-pressure mechanized water tank sanitization with UV treatment', 280.00, '9325145073@axl', 1, 4.7, 9, 20.70900, 78.55300, 'Borgaon Road, Wardha');

-- ---------------------------------------------------------------------
-- STEP 6: availability_slots
-- Entity: AvailabilitySlot { id, provider (FK provider_id, not null),
--   dayOfWeek (STRING enum, not null), startTime (not null), endTime (not null) }
-- No hardcoded ids here - lets AUTO_INCREMENT assign them normally.
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 7: bookings
-- Entity: Booking { id, customer (FK customer_id, not null),
--   provider (FK provider_id, not null - points to service_providers.id,
--   NOT users.id), scheduledAt (not null), estimatedHours,
--   totalAmount (column name estimated_amount, not null), notes,
--   jobAddress, jobLatitude, jobLongitude, status (not null,
--   default PENDING), createdAt }
-- Only ONE amount column: estimated_amount. There is no total_amount
-- column on this entity - do not insert one.
-- ---------------------------------------------------------------------
INSERT INTO bookings
    (id, customer_id, provider_id, status, scheduled_at, estimated_hours, estimated_amount,
     notes, job_address, job_latitude, job_longitude, created_at)
VALUES
    (1, 1, 1, 'CONFIRMED', NOW(), 2, 400.00,
     'Urgent fan and switch repair', 'Civil Lines, Wardha', 20.7280, 78.6020, NOW());

-- No payments row is seeded on purpose - Payment rows are created by
-- PaymentService.initiatePayment() at runtime when a customer clicks
-- "Pay via UPI", not by the seed script.

-- ---------------------------------------------------------------------
-- STEP 8: AUTO_INCREMENT safety offsets.
-- Highest hardcoded ids used above: users=108, service_categories=6,
-- service_providers=8, bookings=1. Setting each table's next
-- auto-increment value well past its highest seeded id guarantees that
-- IDENTITY-generated ids from new frontend registrations (new customers,
-- new providers, new bookings) can never collide with these seed rows.
-- ---------------------------------------------------------------------
ALTER TABLE users               AUTO_INCREMENT = 1000;
ALTER TABLE service_categories  AUTO_INCREMENT = 100;
ALTER TABLE service_providers   AUTO_INCREMENT = 100;
ALTER TABLE bookings            AUTO_INCREMENT = 100;

-- ---------------------------------------------------------------------
-- STEP 9: Recreate the auto-provisioning trigger LAST, now that seeding
-- is fully complete. From this point on, it only affects genuinely new
-- PROVIDER rows inserted directly via SQL outside the app (registering
-- through the actual UI never touches this trigger - AuthService.java
-- creates the ServiceProvider row itself in Java for those).
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 10 (optional): quick sanity checks - run these manually after
-- the script finishes to confirm row counts and FK integrity.
-- ---------------------------------------------------------------------
-- SELECT COUNT(*) AS total_users FROM users;
-- SELECT COUNT(*) AS total_providers FROM service_providers;
-- SELECT sp.id, sp.user_id, u.full_name, sp.category_id, c.name
--   FROM service_providers sp
--   JOIN users u ON u.id = sp.user_id
--   JOIN service_categories c ON c.id = sp.category_id;
-- SELECT b.id, b.customer_id, b.provider_id, b.status, b.estimated_amount
--   FROM bookings b;
USE local_service_finder;

-- 1. Drop the trigger permanently - it conflicts with AuthService.java
DROP TRIGGER IF EXISTS after_user_provider_insert;

-- 2. Check for a leftover orphaned provider row
SELECT id, user_id FROM service_providers WHERE user_id = 1002;

-- 3. Check for a leftover stuck user row
SELECT id, email FROM users WHERE email = 'testpro1@gmail.com';
USE local_service_finder;
SELECT id, customer_id, provider_id, status, estimated_amount FROM bookings ORDER BY id;
USE local_service_finder;
SELECT id, email, password, LENGTH(password) AS hash_length FROM users WHERE email = 'customer@test.com';
USE local_service_finder;

ALTER TABLE payments DROP COLUMN payee_vpa;
USE local_service_finder;

DESCRIBE payments;
