-- =====================================================================
-- Insurance Policy & Claim Management System — Demo Dummy Data (Part 3)
-- Quotes, Policies, Premium Payments, Claims, Histories & Documents
-- =====================================================================
--
-- Safe to run : YES (`INSERT IGNORE`, explicit IDs). Import AFTER the
--               schema exists (first app boot), then restart the app.
-- Order       : quotes -> policies -> premium_payments
--               -> claims -> claim_status_histories -> claim_documents
--
-- Numbers     : computed with the same formulas as the app's calculators
--   basePremium     = coverageAmount x baseRiskRate
--   taxable         = basePremium + processingFee
--   gstAmount       = 18% of taxable
--   annualPremium   = taxable + gstAmount
--   ANNUAL total    = annualPremium
--   ONE_TIME total  = (annualPremium x duration) - duration discount
--   discount rates  : 2yr=2%, 3yr=5%, 5yr=8%, 7yr=10%, 10yr=12%, ...
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- quotes
-- Columns: id, customer_id, plan_id, plan_version, pricing_rule_id,
--          coverage, duration, premium_type, risk_rate, processing_fee,
--          gst, premium, total, status, created_at, expires_at
-- Note: `gst` stores the GST AMOUNT (not the percentage).
-- ---------------------------------------------------------------------
INSERT IGNORE INTO quotes
    (id, customer_id, plan_id, plan_version, pricing_rule_id, coverage, duration,
     premium_type, risk_rate, processing_fee, gst, premium, total, status, created_at, expires_at)
VALUES
    (1, 1, 1, 1, 1, 1000000.00, 1, 'ANNUAL',  0.0040, 250.00, 765.00, 5015.00, 5015.00, 'USED',    '2026-07-01 10:00:00', '2026-07-01 10:30:00'),
    (2, 2, 3, 1, 3,  500000.00, 1, 'ANNUAL',  0.0200, 400.00, 1872.00, 12272.00, 12272.00, 'USED', '2026-06-15 11:00:00', '2026-06-15 11:30:00'),
    (3, 3, 4, 1, 4, 2000000.00, 10, 'ONE_TIME', 0.0015, 200.00, 576.00, 3776.00, 33229.00, 'CREATED', '2026-07-25 09:00:00', '2026-08-24 09:00:00'),
    (4, 1, 1, 1, 1,  500000.00, 1, 'ANNUAL',  0.0040, 250.00, 405.00, 2655.00, 2655.00, 'CREATED', '2026-07-02 09:30:00', '2026-08-01 09:30:00');

-- ---------------------------------------------------------------------
-- policies
-- Columns: id, policy_number, customer_id, plan_id, selected_coverage,
--          premium_type, policy_duration, premium_rate_used,
--          processing_fee_used, gst_used, calculated_premium, plan_version,
--          pricing_rule_id, quote_id, purchase_date, start_date, end_date,
--          policy_status, total_premium_paid, created_date, updated_date,
--          version
-- ---------------------------------------------------------------------
INSERT IGNORE INTO policies
    (id, policy_number, customer_id, plan_id, selected_coverage, premium_type,
     policy_duration, premium_rate_used, processing_fee_used, gst_used,
     calculated_premium, plan_version, pricing_rule_id, quote_id, purchase_date,
     start_date, end_date, policy_status, total_premium_paid, created_date, updated_date, version)
VALUES
    (1, 'POL-3F7K9Q2X', 1, 1, 1000000.00, 'ANNUAL',  1, 0.0040, 250.00, 765.00, 5015.00, 1, 1, 1,    '2026-07-01 10:05:00', '2026-07-01', '2027-06-30', 'ACTIVE',          5015.00,  '2026-07-01 10:05:00', '2026-07-01 10:05:00', 0),
    (2, 'POL-8H2M5T9W', 2, 3,  500000.00, 'ANNUAL',  1, 0.0200, 400.00, 1872.00, 12272.00, 1, 3, 2,  '2026-06-15 11:05:00', '2026-06-15', '2027-06-14', 'ACTIVE',          12272.00, '2026-06-15 11:05:00', '2026-06-15 11:05:00', 0),
    (3, 'POL-1A4C7E9B', 1, 1,  500000.00, 'ANNUAL',  1, 0.0040, 250.00, 405.00, 2655.00, 1, 1, 4,    '2026-07-02 09:35:00', '2026-07-02', '2027-07-01', 'PENDING_PAYMENT', 0.00,    '2026-07-02 09:35:00', '2026-07-02 09:35:00', 0),
    (4, 'POL-5D6R8P0L', 3, 4, 1000000.00, 'ONE_TIME', 10, 0.0015, 200.00, 306.00, 17653.00, 1, 4, NULL, '2025-06-01 12:00:00', '2025-06-01', '2035-05-31', 'CANCELLED',       17653.00, '2025-06-01 12:00:00', '2025-06-01 12:00:00', 0);

-- ---------------------------------------------------------------------
-- premium_payments
-- Columns: payment_id, policy_id, amount, payment_date, payment_mode,
--          transaction_reference, payment_status, created_date
-- NOTE: the @Id column is named `payment_id`.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO premium_payments
    (payment_id, policy_id, amount, payment_date, payment_mode, transaction_reference, payment_status, created_date)
VALUES
    (1, 1, 5015.00,  '2026-07-01 10:06:00', 'UPI',         'TXN-2026-HLTH-00001', 'SUCCESS', '2026-07-01 10:06:00'),
    (2, 2, 12272.00, '2026-06-15 11:06:00', 'CARD',        'TXN-2026-MOTR-00001', 'SUCCESS', '2026-06-15 11:06:00'),
    (3, 4, 17653.00, '2025-06-01 12:01:00', 'NET_BANKING', 'TXN-2025-LIFE-00001', 'SUCCESS', '2025-06-01 12:01:00'),
    (4, 3, 2655.00,  '2026-07-02 09:40:00', 'UPI',         'TXN-2026-HLTH-00002', 'PENDING', '2026-07-02 09:40:00');

-- ---------------------------------------------------------------------
-- claims
-- Columns: id, claim_number, claim_amount, claim_reason, incident_date,
--          claim_status, staff_remarks, admin_remarks, created_date,
--          updated_date, policy_id, assigned_staff_id, version
-- ---------------------------------------------------------------------
INSERT IGNORE INTO claims
    (id, claim_number, claim_amount, claim_reason, incident_date, claim_status,
     staff_remarks, admin_remarks, created_date, updated_date, policy_id, assigned_staff_id, version)
VALUES
    (1, 'CLM-9U2X4Y6Z', 25000.00, 'Hospitalization due to dengue fever',          '2026-07-05 14:30:00', 'APPROVED',             'Verified hospital documents. Claim is valid.',           'Approved. Settlement dispatched.',              '2026-07-05 14:35:00', '2026-07-08 15:00:00', 1, 5, 0),
    (2, 'CLM-7J3K5L8M', 120000.00, 'Front bumper damage in road accident',        '2026-07-18 09:15:00', 'UNDER_REVIEW',         'Survey report awaited from assessor.',                   NULL,                                           '2026-07-18 09:20:00', '2026-07-19 10:30:00', 2, 6, 0),
    (3, 'CLM-2N4P6Q9R', 75000.00, 'Emergency appendectomy surgery',                '2026-07-25 22:10:00', 'SUBMITTED',            NULL,                                                  NULL,                                           '2026-07-25 22:15:00', '2026-07-25 22:15:00', 1, NULL, 0);

-- ---------------------------------------------------------------------
-- claim_status_histories
-- Columns: id, previous_status, new_status, remarks, updated_by,
--          updated_date, claim_id
-- ---------------------------------------------------------------------
INSERT IGNORE INTO claim_status_histories
    (id, previous_status, new_status, remarks, updated_by, updated_date, claim_id)
VALUES
    (1, 'SUBMITTED',                'UNDER_REVIEW',           'Claim moved to review queue.',          'kavita.nair@insurance.com', '2026-07-06 10:00:00', 1),
    (2, 'UNDER_REVIEW',             'RECOMMENDED_FOR_APPROVAL', 'All documentation verified.',           'kavita.nair@insurance.com', '2026-07-07 11:30:00', 1),
    (3, 'RECOMMENDED_FOR_APPROVAL', 'APPROVED',               'Approved for settlement.',               'admin@insurance.com',      '2026-07-08 15:00:00', 1),
    (4, 'SUBMITTED',                'UNDER_REVIEW',           'Awaiting survey report from assessor.',  'sanjay.gupta@insurance.com', '2026-07-19 10:30:00', 2);

-- ---------------------------------------------------------------------
-- claim_documents
-- Columns: id, document_name, document_type, document_reference, public_id,
--          uploaded_date, claim_id
-- NOTE: references are illustrative placeholders (actual uploads go to
--       Cloudinary); do not rely on them being downloadable.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO claim_documents
    (id, document_name, document_type, document_reference, public_id, uploaded_date, claim_id)
VALUES
    (1, 'hospital_bill.pdf',     'application/pdf', 'https://res.cloudinary.com/demo/claims/hospital_bill.pdf',     'claims/CLM-9U2X4Y6Z/hospital_bill',     '2026-07-05 14:35:00', 1),
    (2, 'damage_photo.jpg',      'image/jpeg',      'https://res.cloudinary.com/demo/claims/damage_photo.jpg',      'claims/CLM-7J3K5L8M/damage_photo',      '2026-07-18 09:20:00', 2),
    (3, 'discharge_summary.pdf', 'application/pdf', 'https://res.cloudinary.com/demo/claims/discharge_summary.pdf', 'claims/CLM-2N4P6Q9R/discharge_summary', '2026-07-25 22:15:00', 3);

SET FOREIGN_KEY_CHECKS = 1;
