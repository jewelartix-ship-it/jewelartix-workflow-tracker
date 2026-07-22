CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"date" text NOT NULL,
	"sr" text NOT NULL,
	"lot" text NOT NULL,
	"file_name" text NOT NULL,
	"cad_done" boolean DEFAULT false NOT NULL,
	"preview_sent" boolean DEFAULT false NOT NULL,
	"cad_confirm" boolean DEFAULT false NOT NULL,
	"stl_send" boolean DEFAULT false NOT NULL,
	"render_req" boolean DEFAULT false NOT NULL,
	"render_photos" boolean DEFAULT false NOT NULL,
	"render_videos" boolean DEFAULT false NOT NULL,
	"drive_link" text,
	"note" text,
	"reason" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'EMPLOYEE' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_task_idx" ON "audit_log" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_category_idx" ON "tasks" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_sr_idx" ON "tasks" USING btree ("sr");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_lot_idx" ON "tasks" USING btree ("lot");