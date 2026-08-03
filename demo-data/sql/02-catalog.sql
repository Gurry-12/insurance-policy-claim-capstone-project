-- =====================================================================
-- Insurance Policy & Claim Management System — Demo Dummy Data (Part 2)
-- Catalog: Insurance Products, Policy Plans, Durations, Coverage Options,
--          Pricing Rules & Pricing Audit Logs
-- =====================================================================
--
-- Safe to run : YES (`INSERT IGNORE`, explicit IDs). Import AFTER the
--               schema exists (first app boot), then restart the app.
-- Order       : products -> plans -> policy_plan_durations
--               -> coverage_options -> pricing_rules -> pricing_audit_logs
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- insurance_products
-- Columns: id, product_name, product_type, description, is_active,
--          created_date, updated_date
-- ---------------------------------------------------------------------
INSERT IGNORE INTO insurance_products
    (id, product_name, product_type, description, is_active, created_date, updated_date)
VALUES
    (1, 'Health Insurance',  'HEALTH',    'Comprehensive health insurance covering hospitalization, surgery and critical illness.', b'1', '2026-06-01 09:00:00', '2026-06-01 09:00:00'),
    (2, 'Motor Insurance',   'MOTOR',     'Vehicle insurance covering own damage, third-party liability and theft.',                 b'1', '2026-06-01 09:10:00', '2026-06-01 09:10:00'),
    (3, 'Life Insurance',    'LIFE',      'Life cover with term and savings options for long-term financial security.',             b'1', '2026-06-01 09:20:00', '2026-06-01 09:20:00'),
    (4, 'Travel Insurance',  'TRAVEL',    'Travel insurance covering medical emergencies, trip cancellation and lost baggage.',      b'1', '2026-06-01 09:30:00', '2026-06-01 09:30:00'),
    (5, 'General Insurance', 'INSURANCE', 'Flexible general insurance product for diversified asset and liability coverage.',      b'1', '2026-06-01 09:40:00', '2026-06-01 09:40:00');

-- ---------------------------------------------------------------------
-- policy_plans
-- Columns: id, product_id, plan_name, plan_version, supported_premium_type,
--          terms_conditions, is_active, created_date, updated_date
-- ---------------------------------------------------------------------
INSERT IGNORE INTO policy_plans
    (id, product_id, plan_name, plan_version, supported_premium_type, terms_conditions, is_active, created_date, updated_date)
VALUES
    (1, 1, 'Health Shield',        1, 'ANNUAL',   'Coverage is subject to hospitalisation in a network hospital. Waiting period of 30 days applies for pre-existing conditions. Claims must be filed within 30 days of discharge.', b'1', '2026-06-02 09:00:00', '2026-06-02 09:00:00'),
    (2, 1, 'Critical Care Plus',   1, 'ANNUAL',   'Lump-sum pay-out on diagnosis of a listed critical illness. Pre-existing conditions excluded for first 90 days. Medical evidence required with every claim.',                  b'1', '2026-06-02 09:10:00', '2026-06-02 09:10:00'),
    (3, 2, 'Drive Safe',           1, 'ANNUAL',   'Own damage cover plus third-party liability as per IRDAI norms. No-claim bonus up to 20% on renewal. Depreciation applies to plastic, rubber and fibre parts.',                b'1', '2026-06-02 09:20:00', '2026-06-02 09:20:00'),
    (4, 3, 'Life Protect',        1, 'ONE_TIME',  'Term life cover with maturity benefit. Sum assured payable on death or total permanent disability. Free-look cancellation within 15 days.',                                 b'1', '2026-06-02 09:30:00', '2026-06-02 09:30:00'),
    (5, 4, 'Trip Assure',         1, 'ONE_TIME',  'Covers trip cancellation, medical emergencies, and lost baggage for single-trip travel up to 180 days. Policy period equals trip dates.',                                     b'1', '2026-06-02 09:40:00', '2026-06-02 09:40:00'),
    (6, 5, 'Flexi Cover',         1, 'ONE_TIME',  'Modular general insurance with selectable coverage slabs and duration. Terms apply per the selected coverage option.',                                              b'1', '2026-06-02 09:50:00', '2026-06-02 09:50:00');

-- ---------------------------------------------------------------------
-- policy_plan_durations (ElementCollection join table)
-- Columns: plan_id, duration
-- ---------------------------------------------------------------------
INSERT IGNORE INTO policy_plan_durations (plan_id, duration) VALUES
    (1, 1), (1, 2), (1, 3), (1, 5),
    (2, 1), (2, 3), (2, 5),
    (3, 1), (3, 2), (3, 3),
    (4, 5), (4, 10), (4, 15), (4, 20),
    (5, 1), (5, 2), (5, 3),
    (6, 1), (6, 3), (6, 5), (6, 10);

-- ---------------------------------------------------------------------
-- coverage_options
-- Columns: id, plan_id, coverage_amount, label, display_order, is_active
-- ---------------------------------------------------------------------
INSERT IGNORE INTO coverage_options
    (id, plan_id, coverage_amount, label, display_order, is_active)
VALUES
    (1,  1,  500000.00, 'Base Cover',   1, b'1'),
    (2,  1, 1000000.00, 'Silver Cover', 2, b'1'),
    (3,  1, 2000000.00, 'Gold Cover',   3, b'1'),
    (4,  2, 1000000.00, 'Base Cover',   1, b'1'),
    (5,  2, 2000000.00, 'Silver Cover', 2, b'1'),
    (6,  2, 5000000.00, 'Gold Cover',   3, b'1'),
    (7,  3,  500000.00, 'Base Cover',   1, b'1'),
    (8,  3, 1000000.00, 'Silver Cover', 2, b'1'),
    (9,  3, 2000000.00, 'Gold Cover',   3, b'1'),
    (10, 4, 1000000.00, 'Base Cover',   1, b'1'),
    (11, 4, 2000000.00, 'Silver Cover', 2, b'1'),
    (12, 4, 5000000.00, 'Gold Cover',   3, b'1'),
    (13, 5,  100000.00, 'Base Cover',   1, b'1'),
    (14, 5,  250000.00, 'Silver Cover', 2, b'1'),
    (15, 5,  500000.00, 'Gold Cover',   3, b'1'),
    (16, 6,  500000.00, 'Base Cover',   1, b'1'),
    (17, 6, 1000000.00, 'Silver Cover', 2, b'1'),
    (18, 6, 2000000.00, 'Gold Cover',   3, b'1');

-- ---------------------------------------------------------------------
-- pricing_rules
-- Columns: id, plan_id, base_risk_rate, processing_fee, gst, remarks,
--          effective_from, effective_to, status, created_date
-- One ACTIVE rule per plan.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO pricing_rules
    (id, plan_id, base_risk_rate, processing_fee, gst, remarks, effective_from, effective_to, status, created_date)
VALUES
    (1, 1, 0.0040, 250.00, 18.00, 'Health Shield standard risk rate.',     '2026-06-02 09:00:00', NULL, 'ACTIVE',   '2026-06-02 09:00:00'),
    (2, 2, 0.0050, 300.00, 18.00, 'Critical Care Plus standard rate.',     '2026-06-02 09:10:00', NULL, 'ACTIVE',   '2026-06-02 09:10:00'),
    (3, 3, 0.0200, 400.00, 18.00, 'Drive Safe standard motor risk rate.',  '2026-06-02 09:20:00', NULL, 'ACTIVE',   '2026-06-02 09:20:00'),
    (4, 4, 0.0015, 200.00, 18.00, 'Life Protect term rate.',               '2026-06-02 09:30:00', NULL, 'ACTIVE',   '2026-06-02 09:30:00'),
    (5, 5, 0.0030, 150.00, 18.00, 'Trip Assure per-trip rate.',            '2026-06-02 09:40:00', NULL, 'ACTIVE',   '2026-06-02 09:40:00'),
    (6, 6, 0.0025, 200.00, 18.00, 'Flexi Cover standard rate.',            '2026-06-02 09:50:00', NULL, 'ACTIVE',   '2026-06-02 09:50:00');

-- ---------------------------------------------------------------------
-- pricing_audit_logs
-- Columns: id, pricing_rule_id, old_configuration, new_configuration,
--          remarks, changed_by, changed_at
-- ---------------------------------------------------------------------
INSERT IGNORE INTO pricing_audit_logs
    (id, pricing_rule_id, old_configuration, new_configuration, remarks, changed_by, changed_at)
VALUES
    (1, 1, NULL,
     '{"baseRiskRate":0.0040,"processingFee":250.00,"gst":18.00,"status":"ACTIVE"}',
     'Initial rule creation via catalog seed.', 'admin@insurance.com', '2026-06-02 09:00:00'),
    (2, 3, NULL,
     '{"baseRiskRate":0.0200,"processingFee":400.00,"gst":18.00,"status":"ACTIVE"}',
     'Initial rule creation via catalog seed.', 'admin@insurance.com', '2026-06-02 09:20:00');

SET FOREIGN_KEY_CHECKS = 1;
