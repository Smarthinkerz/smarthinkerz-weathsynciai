CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "company_id" integer,
  "action" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" text,
  "metadata" jsonb,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_company_id_idx" ON "audit_logs" ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at" DESC);
