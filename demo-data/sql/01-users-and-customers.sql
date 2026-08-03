-- =====================================================================
-- Insurance Policy & Claim Management System — Demo Dummy Data (Part 1)
-- Users, Customers, Staff Specialities, OTPs & Refresh Tokens
-- =====================================================================
--
-- Target DB   : insurance_db  (MySQL 8.x)
-- App defaults: ddl-auto=update, so run these AFTER the first app boot
--               (or after Hibernate has created the schema), then restart.
-- Safe to run : YES. All inserts use `INSERT IGNORE` and explicit IDs,
--               so re-running the script is harmless.
-- Passwords   : BCrypt hashes below match the plaintext passwords listed
--               in ../04-evaluator-demo.md  (Admin@123 / Customer@123 / Staff@123).
--
-- Import from the repo root:
--   mysql -u <user> -p insurance_db < demo-data/sql/01-users-and-customers.sql
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- users
-- Columns: id, full_name, email, password, mobile_number, is_active,
--          created_date, updated_date, role, token_version,
--          email_verified, phone_verified
-- NOTE: id=1 (admin@insurance.com / +919876543210) is also auto-seeded by
--       DataInitializer on app boot. INSERT IGNORE makes the two coexist.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO users
    (id, full_name, email, password, mobile_number, is_active,
     created_date, updated_date, role, token_version, email_verified, phone_verified)
VALUES
    (1, 'System Administrator', 'admin@insurance.com',   '$2a$10$8/4pnHN7zNawUE4RGXN.U.xVKC1P1hzmHPx3nRrZ71DcdNz7wltpK', '+919876543210', b'1', '2026-06-01 09:00:00', '2026-06-01 09:00:00', 'ROLE_ADMIN',            0, b'1', b'1'),
    (2, 'Rajesh Sharma',        'rajesh.sharma@example.com', '$2a$10$hIfuRYZ3QV5t1egIxoUbAecY0Gyjahbdlg7qOpnhoc2029T5ksZci', '+919811223344', b'1', '2026-06-10 10:30:00', '2026-06-10 10:30:00', 'ROLE_CUSTOMER',         0, b'1', b'1'),
    (3, 'Priya Verma',          'priya.verma@example.com',   '$2a$10$hIfuRYZ3QV5t1egIxoUbAecY0Gyjahbdlg7qOpnhoc2029T5ksZci', '+919822334455', b'1', '2026-06-11 11:00:00', '2026-06-11 11:00:00', 'ROLE_CUSTOMER',         0, b'1', b'1'),
    (4, 'Amit Patel',           'amit.patel@example.com',    '$2a$10$hIfuRYZ3QV5t1egIxoUbAecY0Gyjahbdlg7qOpnhoc2029T5ksZci', '+919833445566', b'1', '2026-06-12 12:15:00', '2026-06-12 12:15:00', 'ROLE_CUSTOMER',         0, b'1', b'1'),
    (5, 'Kavita Nair',          'kavita.nair@insurance.com', '$2a$10$YVyx0J8rwBk2llStCyKeHe5d6nEoTDZ2cXPaEDrxcNx1jcpgM6Xai', '+919844556677', b'1', '2026-06-05 09:45:00', '2026-06-05 09:45:00', 'ROLE_INTERNAL_STAFF',   0, b'1', b'1'),
    (6, 'Sanjay Gupta',         'sanjay.gupta@insurance.com', '$2a$10$YVyx0J8rwBk2llStCyKeHe5d6nEoTDZ2cXPaEDrxcNx1jcpgM6Xai', '+919855667788', b'1', '2026-06-06 10:05:00', '2026-06-06 10:05:00', 'ROLE_INTERNAL_STAFF',   0, b'1', b'1'),
    (7, 'Meena Iyer',           'meena.iyer@example.com',    '$2a$10$hIfuRYZ3QV5t1egIxoUbAecY0Gyjahbdlg7qOpnhoc2029T5ksZci', '+919866778899', b'0', '2026-07-20 14:00:00', '2026-07-20 14:00:00', 'ROLE_CUSTOMER',         0, b'0', b'0');

-- ---------------------------------------------------------------------
-- customers
-- Columns: id, user_id, date_of_birth, address, city, state, pin_code,
--          nominee_name, nominee_relation, created_date, updated_date
-- ---------------------------------------------------------------------
INSERT IGNORE INTO customers
    (id, user_id, date_of_birth, address, city, state, pin_code,
     nominee_name, nominee_relation, created_date, updated_date)
VALUES
    (1, 2, '1988-03-15', '42 MG Road, Andheri West', 'Mumbai',    'Maharashtra', '400001', 'Sunita Sharma', 'Spouse', '2026-06-10 10:35:00', '2026-06-10 10:35:00'),
    (2, 3, '1992-07-22', '18 Nehru Nagar',            'Bengaluru', 'Karnataka',   '560001', 'Arjun Verma',   'Brother', '2026-06-11 11:05:00', '2026-06-11 11:05:00'),
    (3, 4, '1985-11-02', '7 Ring Road, Maninagar',    'Ahmedabad', 'Gujarat',     '380001', 'Meera Patel',   'Wife',    '2026-06-12 12:20:00', '2026-06-12 12:20:00'),
    (4, 7, '1990-01-28', '33 Lake View Road',         'Chennai',   'Tamil Nadu',  '600001', 'Karthik Iyer',  'Spouse',  '2026-07-20 14:05:00', '2026-07-20 14:05:00');

-- ---------------------------------------------------------------------
-- staff_specialities
-- Columns: id, user_id, product_speciality
-- ---------------------------------------------------------------------
INSERT IGNORE INTO staff_specialities
    (id, user_id, product_speciality)
VALUES
    (1, 5, 'HEALTH'),
    (2, 6, 'MOTOR');

-- ---------------------------------------------------------------------
-- otp_verifications
-- Columns: id, user_id, email_otp, phone_otp, expires_at, used,
--          attempt_count, send_count, last_sent_at, created_at
-- Rows 1-2 are illustrative (their users are already active/verified).
-- Row 3 (user_id=7, OTP 555555) lets you exercise POST /auth/verify-otp
-- offline against the pending customer Meena Iyer.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO otp_verifications
    (id, user_id, email_otp, phone_otp, expires_at, used, attempt_count, send_count, last_sent_at, created_at)
VALUES
    (1, 2, '111111', '111111', '2026-12-31 23:59:59', b'0', 0, 1, '2026-06-10 10:30:00', '2026-06-10 10:30:00'),
    (2, 5, '222222', '222222', '2026-12-31 23:59:59', b'0', 0, 1, '2026-06-05 09:45:00', '2026-06-05 09:45:00'),
    (3, 7, '555555', '555555', '2026-12-31 23:59:59', b'0', 0, 1, '2026-07-20 14:00:00', '2026-07-20 14:00:00');

-- ---------------------------------------------------------------------
-- refresh_tokens
-- Columns: id, user_id, token_hash, jti, expires_at, revoked, replaced_by,
--          token_version, created_at
-- These two rows are ILLUSTRATIVE only (already revoked + expired). Active
-- sessions are created by the app on login and must NOT be inserted by hand.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO refresh_tokens
    (id, user_id, token_hash, jti, expires_at, revoked, replaced_by, token_version, created_at)
VALUES
    (1, 2, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '2026-07-15 10:00:00', b'1', NULL, 0, '2026-07-01 10:00:00'),
    (2, 5, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', '00000000-0000-0000-0000-000000000002', '2026-07-20 10:00:00', b'1', '00000000-0000-0000-0000-000000000003', 0, '2026-07-10 10:00:00');

SET FOREIGN_KEY_CHECKS = 1;
