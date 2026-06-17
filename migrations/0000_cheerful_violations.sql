CREATE TABLE "adaptive_ai_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"preferred_agents" text[],
	"query_patterns" jsonb,
	"industry_focus" text[],
	"region_focus" text[],
	"risk_preference" text DEFAULT 'moderate',
	"communication_style" text DEFAULT 'balanced',
	"total_interactions" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "adaptive_ai_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "affiliate_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"company_id" integer,
	"code" text NOT NULL,
	"campaign_name" text NOT NULL,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"commission_rate" integer DEFAULT 10,
	"total_earnings" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"company_id" integer,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text NOT NULL,
	"permissions" text[],
	"rate_limit" integer DEFAULT 1000,
	"usage_count" integer DEFAULT 0,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"type" text DEFAULT 'location' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "budget_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_id" integer NOT NULL,
	"name" text NOT NULL,
	"allocated_amount" integer NOT NULL,
	"spent_amount" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT '#3B82F6',
	"icon" text DEFAULT '💰',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"total_amount" integer NOT NULL,
	"period" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"categories" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"country" text NOT NULL,
	"city" text NOT NULL,
	"address" text,
	"industry" text,
	"description" text,
	"logo" text,
	"website" text,
	"contact_email" text,
	"contact_phone" text,
	"is_premium" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"issuing_authority" text NOT NULL,
	"issue_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"certificate_url" text,
	"verification_id" text,
	"verification_status" text DEFAULT 'pending',
	"verified_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "chatbot_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"visitor_name" text,
	"visitor_email" text,
	"message" text NOT NULL,
	"response" text NOT NULL,
	"matched_preset_id" integer,
	"satisfaction" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chatbot_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'general',
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reviewer_id" integer,
	"company_id" integer,
	"project_name" text NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"outcome" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"client_phone" text,
	"service_type" text,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"budget" text,
	"timeline" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"company_response" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[],
	"upvotes" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "community_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"upvotes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"password" text NOT NULL,
	"business_license" text,
	"tax_id" text,
	"website" text,
	"logo" text,
	"profile_video" text,
	"verification_status" text DEFAULT 'pending',
	"verified_at" timestamp,
	"founded_year" integer,
	"employee_count" integer,
	"headquarters" text,
	"primary_contact" text NOT NULL,
	"primary_contact_email" text NOT NULL,
	"primary_contact_phone" text,
	"industries" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"average_rating" integer,
	"total_reviews" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"subscription_tier" text DEFAULT 'free',
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"pending_subscription_tier" text,
	"pending_subscription_id" text,
	"monthly_opportunity_limit" integer DEFAULT 5,
	"current_month_opportunities" integer DEFAULT 0,
	"last_opportunity_reset_date" timestamp,
	"service_limit" integer DEFAULT 3,
	"monthly_report_limit" integer DEFAULT 1,
	"current_month_reports" integer DEFAULT 0,
	"last_report_reset_date" timestamp,
	"daily_ai_email_limit" integer DEFAULT 2,
	"current_day_ai_emails" integer DEFAULT 0,
	"last_ai_email_reset_date" timestamp,
	"is_premium" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "company_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"visitor_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"badge_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"awarded_date" timestamp DEFAULT now(),
	"expiry_date" timestamp,
	"verification_id" text,
	"badge_url" text,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	CONSTRAINT "company_badges_verification_id_unique" UNIQUE("verification_id")
);
--> statement-breakpoint
CREATE TABLE "company_case_studies" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"client_name" text,
	"industry" text,
	"project_duration" text,
	"budget" integer,
	"results" text NOT NULL,
	"technologies" text[],
	"challenges" text,
	"solution" text NOT NULL,
	"testimonial" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"published_at" timestamp,
	"attachments" jsonb,
	"metrics" jsonb
);
--> statement-breakpoint
CREATE TABLE "company_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"credential_type" text NOT NULL,
	"title" text NOT NULL,
	"issuing_organization" text NOT NULL,
	"issue_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"credential_id" text,
	"verification_url" text,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"document_url" text,
	"verified_at" timestamp,
	"verified_by" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "company_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"permissions" text[],
	"invited_by" integer,
	"joined_at" timestamp DEFAULT now(),
	"last_active" timestamp,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "company_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"service_id" integer,
	"verified_purchase" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "company_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"service_type" text NOT NULL,
	"pricing_model" text NOT NULL,
	"price_amount" integer DEFAULT 0,
	"price_unit" text,
	"lead_time" text,
	"availability" text,
	"features" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "compliance_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"findings" jsonb,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"generated_by" text DEFAULT 'ai',
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "conversation_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"agent_type" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "directories" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"display_name" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"industry" text NOT NULL,
	"website" text,
	"location" text NOT NULL,
	"phone" text,
	"public_email" text,
	"featured_highlight" boolean DEFAULT true,
	"show_contact_info" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"search_vector" text,
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"latitude" text,
	"longitude" text,
	CONSTRAINT "directories_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "employee_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"employee_name" text NOT NULL,
	"employee_role" text NOT NULL,
	"skills" text[],
	"license_type" text,
	"license_number" text,
	"issuing_authority" text,
	"document_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "endorsements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endorser_id" integer NOT NULL,
	"skill" text NOT NULL,
	"message" text,
	"rating" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"actionable" boolean DEFAULT true,
	"priority" text DEFAULT 'medium' NOT NULL,
	"category" text,
	"amount" integer,
	"metadata" jsonb,
	"dismissed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" integer NOT NULL,
	"team_type" text NOT NULL,
	"industry" text,
	"monthly_budget" bigint,
	"goals" jsonb DEFAULT '[]'::jsonb,
	"settings" jsonb DEFAULT '{"currency":"USD","timezone":"UTC","notifications":true,"shareLevel":"basic"}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fraud_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"user_id" integer,
	"alert_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"indicators" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "funding_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"provider" text NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"sector" text NOT NULL,
	"eligibility_criteria" jsonb NOT NULL,
	"application_deadline" timestamp,
	"region" text,
	"country" text DEFAULT 'Global' NOT NULL,
	"application_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_synced" timestamp,
	"requirement_score" integer,
	"match_score" integer
);
--> statement-breakpoint
CREATE TABLE "installed_plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"company_id" integer,
	"plugin_id" integer NOT NULL,
	"config" jsonb,
	"is_active" boolean DEFAULT true,
	"installed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investment_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"profile_id" integer NOT NULL,
	"risk_profile" text NOT NULL,
	"recommended_allocation" jsonb NOT NULL,
	"specific_investments" jsonb NOT NULL,
	"market_opportunities" jsonb NOT NULL,
	"portfolio_optimization" jsonb NOT NULL,
	"monthly_investment_plan" jsonb NOT NULL,
	"ai_insights" jsonb NOT NULL,
	"next_steps" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"track_id" integer NOT NULL,
	"current_module" integer DEFAULT 0,
	"completed_modules" jsonb,
	"quiz_scores" jsonb,
	"progress" integer DEFAULT 0,
	"certificate_earned" boolean DEFAULT false,
	"certificate_date" timestamp,
	"started_at" timestamp DEFAULT now(),
	"last_activity_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "learning_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"required_tier" text DEFAULT 'free' NOT NULL,
	"modules" jsonb NOT NULL,
	"estimated_hours" integer DEFAULT 1,
	"certification_name" text,
	"is_active" boolean DEFAULT true,
	"enrollment_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"title" text NOT NULL,
	"industry" text,
	"regions" jsonb DEFAULT '[]'::jsonb,
	"timeframe" text DEFAULT '12months',
	"report_data" jsonb,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketplace_plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"author" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"icon" text,
	"required_tier" text DEFAULT 'free' NOT NULL,
	"is_active" boolean DEFAULT true,
	"install_count" integer DEFAULT 0,
	"rating" integer,
	"config_schema" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "marketplace_plugins_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"company_id" integer,
	"type" text DEFAULT 'system' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"earnings" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"user_id" integer,
	"external_id" text,
	"source" text,
	"url" text,
	"location" text,
	"company" text,
	"last_synced" timestamp,
	"client_email" text,
	"client_submitted" boolean DEFAULT false,
	"match_score" integer,
	"latitude" text,
	"longitude" text
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"item_type" text NOT NULL,
	"file_url" text,
	"external_url" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"project_url" text,
	"repository_url" text,
	"technologies" text[],
	"start_date" timestamp,
	"end_date" timestamp,
	"verification_status" text DEFAULT 'pending',
	"verified_at" timestamp,
	"demo_url" text,
	"screenshots" text[],
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "reference_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"work_history_id" integer,
	"referent_name" text NOT NULL,
	"referent_position" text NOT NULL,
	"referent_email" text NOT NULL,
	"referent_phone" text,
	"relationship_type" text NOT NULL,
	"verification_status" text DEFAULT 'pending',
	"verified_at" timestamp,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"target_amount" integer NOT NULL,
	"current_amount" integer DEFAULT 0 NOT NULL,
	"target_date" timestamp,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"category" text NOT NULL,
	"auto_save_amount" integer DEFAULT 0,
	"auto_save_frequency" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smart_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"creator_id" integer,
	"counterparty_id" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"terms" jsonb NOT NULL,
	"validation_rules" jsonb NOT NULL,
	"execution_conditions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"last_executed_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "strategy_briefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"title" text NOT NULL,
	"executive_summary" text NOT NULL,
	"market_analysis" jsonb,
	"recommendations" jsonb,
	"risk_assessment" jsonb,
	"financial_projections" jsonb,
	"timeline" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_financial_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text NOT NULL,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"metrics" jsonb,
	"is_read" boolean DEFAULT false,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_financial_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"metric_type" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD',
	"category" text,
	"description" text,
	"is_recurring" boolean DEFAULT false,
	"frequency" text,
	"recorded_at" timestamp DEFAULT now(),
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"joined_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "threat_simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"company_id" integer,
	"scenario_name" text NOT NULL,
	"scenario_type" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"results" jsonb,
	"risk_score" integer,
	"recommendations" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"budget_id" integer,
	"category_id" integer,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"type" text NOT NULL,
	"tags" jsonb,
	"recurring" boolean DEFAULT false,
	"recurring_pattern" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_investment_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"risk_tolerance" text NOT NULL,
	"investment_horizon" integer NOT NULL,
	"monthly_investment_capacity" integer NOT NULL,
	"current_age" integer NOT NULL,
	"retirement_age" integer DEFAULT 65 NOT NULL,
	"total_assets" integer DEFAULT 0 NOT NULL,
	"monthly_income" integer NOT NULL,
	"has_emergency_fund" boolean DEFAULT false NOT NULL,
	"investment_experience" text NOT NULL,
	"investment_goals" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_portfolio_holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"shares" integer NOT NULL,
	"average_cost" integer NOT NULL,
	"current_value" integer,
	"last_updated" timestamp DEFAULT now(),
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"skills" text[] NOT NULL,
	"assets" text[] NOT NULL,
	"linkedin_profile" text,
	"linkedin_verified" boolean DEFAULT false,
	"skills_verified" boolean DEFAULT false,
	"trial_started_at" integer,
	"is_premium" boolean DEFAULT false,
	"subscription_tier" text DEFAULT 'free',
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"pending_subscription_tier" text,
	"pending_subscription_id" text,
	"preferred_language" text DEFAULT 'en',
	"preferred_currency" text DEFAULT 'USD',
	"preferred_region" text,
	"latitude" text,
	"longitude" text,
	"avatar_url" text,
	"bio" text,
	"phone" text,
	"password_reset_token" text,
	"password_reset_expiry" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"request_type" text NOT NULL,
	"target_id" integer NOT NULL,
	"submitted_by" integer NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"supporting_documents" jsonb
);
--> statement-breakpoint
CREATE TABLE "work_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_name" text NOT NULL,
	"position" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"description" text NOT NULL,
	"verification_status" text DEFAULT 'pending',
	"verified_at" timestamp,
	"verification_proof" text,
	"currently_working" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "adaptive_ai_profiles" ADD CONSTRAINT "adaptive_ai_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_interactions" ADD CONSTRAINT "chatbot_interactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_presets" ADD CONSTRAINT "chatbot_presets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_feedback" ADD CONSTRAINT "client_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_feedback" ADD CONSTRAINT "client_feedback_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_feedback" ADD CONSTRAINT "client_feedback_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_analytics" ADD CONSTRAINT "company_analytics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_reviews" ADD CONSTRAINT "company_reviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_reviews" ADD CONSTRAINT "company_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_reviews" ADD CONSTRAINT "company_reviews_service_id_company_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."company_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_services" ADD CONSTRAINT "company_services_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_history" ADD CONSTRAINT "conversation_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directories" ADD CONSTRAINT "directories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_verifications" ADD CONSTRAINT "employee_verifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorser_id_users_id_fk" FOREIGN KEY ("endorser_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_teams" ADD CONSTRAINT "financial_teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installed_plugins" ADD CONSTRAINT "installed_plugins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installed_plugins" ADD CONSTRAINT "installed_plugins_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installed_plugins" ADD CONSTRAINT "installed_plugins_plugin_id_marketplace_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."marketplace_plugins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_analyses" ADD CONSTRAINT "investment_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_analyses" ADD CONSTRAINT "investment_analyses_profile_id_user_investment_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_investment_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_track_id_learning_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."learning_tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_reports" ADD CONSTRAINT "market_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_checks" ADD CONSTRAINT "reference_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_checks" ADD CONSTRAINT "reference_checks_work_history_id_work_history_id_fk" FOREIGN KEY ("work_history_id") REFERENCES "public"."work_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_contracts" ADD CONSTRAINT "smart_contracts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_contracts" ADD CONSTRAINT "smart_contracts_counterparty_id_users_id_fk" FOREIGN KEY ("counterparty_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_briefs" ADD CONSTRAINT "strategy_briefs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_financial_insights" ADD CONSTRAINT "team_financial_insights_team_id_financial_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."financial_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_financial_metrics" ADD CONSTRAINT "team_financial_metrics_team_id_financial_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."financial_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_financial_metrics" ADD CONSTRAINT "team_financial_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_financial_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."financial_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threat_simulations" ADD CONSTRAINT "threat_simulations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threat_simulations" ADD CONSTRAINT "threat_simulations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_investment_profiles" ADD CONSTRAINT "user_investment_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_portfolio_holdings" ADD CONSTRAINT "user_portfolio_holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_history" ADD CONSTRAINT "work_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;