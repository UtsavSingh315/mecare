CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"is_completed" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"category" varchar(50),
	"priority" varchar(20) DEFAULT 'medium',
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "user_settings_user_id_idx";--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "key" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "value" jsonb;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "todos_user_id_idx" ON "todos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "todos_completed_idx" ON "todos" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "todos_category_idx" ON "todos" USING btree ("category");--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "theme";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "privacy_settings";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "data_retention_days";