-- Seed data for ReturnClip demo
-- Run after migrations to set up a demo merchant + sample case

-- 1. Insert demo merchant
INSERT INTO merchants (id, name, shopify_domain, policy) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Refined Concept',
  NULL,
  '{
    "id": "policy_furniture",
    "merchantName": "Refined Concept",
    "returnWindowDays": 30,
    "conditionRequirements": [
      {"category": "damage", "maxAllowedScore": 10, "description": "No scratches, dents, or tears"},
      {"category": "wear", "maxAllowedScore": 15, "description": "Minimal signs of use"},
      {"category": "cleanliness", "maxAllowedScore": 5, "description": "No stains or odors"},
      {"category": "completeness", "maxAllowedScore": 0, "description": "All parts and hardware included"}
    ],
    "restockingFeeThreshold": 85,
    "restockingFeePercent": 20,
    "allowExchange": true,
    "allowStoreCredit": true,
    "storeCreditBonus": 0.1,
    "requiresPhotos": true,
    "requiresVideo": false,
    "shippingPaidBy": "merchant",
    "processingDays": 5
  }'::jsonb
);

-- 2. Insert a complete demo return case (already executed)
INSERT INTO return_cases (id, merchant_id, order_id, order_number, item_id, reason, notes, status, order_data) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'order_12345',
  '#RC-2026-12345',
  'item_001',
  'changed_mind',
  'Changed my mind about the color',
  'executed',
  '{
    "id": "order_12345",
    "orderNumber": "#RC-2026-12345",
    "customerName": "Alex Johnson",
    "customerEmail": "customer@example.com",
    "totalPrice": 378.00,
    "currency": "CAD"
  }'::jsonb
);

-- 3. Insert evidence for the demo case
INSERT INTO evidence_assets (case_id, cloudinary_public_id, secure_url, type) VALUES
  ('00000000-0000-0000-0000-000000000002', 'demo/return_photo_1', 'https://res.cloudinary.com/demo/image/upload/sample.jpg', 'photo'),
  ('00000000-0000-0000-0000-000000000002', 'demo/return_photo_2', 'https://res.cloudinary.com/demo/image/upload/sample2.jpg', 'photo');

-- 4. Insert decision for the demo case
INSERT INTO decisions (case_id, assessment, refund_decision, model_version) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '{"overallQualityScore": 95, "confidence": 0.94}'::jsonb,
  '{"decision": "full_refund", "refundAmount": 299.00, "originalAmount": 299.00, "explanation": "Item in excellent condition."}'::jsonb,
  'gemini-2.0-flash'
);

-- 5. Insert execution for the demo case
INSERT INTO executions (case_id, selected_option_id, idempotency_key, status, provider, amount, currency) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'opt_1',
  'demo_seed_001',
  'completed',
  'manual',
  299.00,
  'CAD'
);

-- 6. Insert audit trail
INSERT INTO audit_logs (case_id, action, payload) VALUES
  ('00000000-0000-0000-0000-000000000002', 'created', '{"reason": "changed_mind"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'evidence_submitted', '{"count": 2}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'assessed', '{"qualityScore": 95}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'decided', '{"decision": "full_refund"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'executed', '{"amount": 299.00, "provider": "manual"}'::jsonb);
