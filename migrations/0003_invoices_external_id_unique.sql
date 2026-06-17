-- F-1 hardening: guarantee no Tap charge can be consumed twice for subscription activation.
-- Idempotent: safe to run against environments where the constraint was already added
-- via direct ALTER TABLE.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_external_id_unique'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_external_id_unique UNIQUE (external_id);
  END IF;
END
$$;
