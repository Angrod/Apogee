CREATE TYPE "public"."ad_status" AS ENUM('No Ads', 'Minimal', 'Has Ads');--> statement-breakpoint
CREATE TYPE "public"."catalog_status" AS ENUM('Active', 'Removed');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('Games', 'Education', 'Creative', 'Music', 'Reading');--> statement-breakpoint
CREATE TYPE "public"."cost_model" AS ENUM('Free', 'One-time purchase', 'Subscription');--> statement-breakpoint
CREATE TYPE "public"."install_status" AS ENUM('Not Installed', 'Pushed', 'Installed', 'Removed');--> statement-breakpoint
CREATE TYPE "public"."interest_tag" AS ENUM('Engineering', 'Baking/Food', 'Music', 'Drawing', 'Reading', 'Math', 'Science', 'Gaming', 'Language Learning');--> statement-breakpoint
CREATE TABLE "children" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"interests" "interest_tag"[] DEFAULT '{}' NOT NULL,
	"device_name" text NOT NULL,
	"screen_time_weekday" integer DEFAULT 0 NOT NULL,
	"screen_time_weekend" integer DEFAULT 0 NOT NULL,
	"apple_arcade" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "children_age_range" CHECK ("children"."age" between 1 and 17),
	CONSTRAINT "children_screen_time_weekday_range" CHECK ("children"."screen_time_weekday" between 0 and 1440),
	CONSTRAINT "children_screen_time_weekend_range" CHECK ("children"."screen_time_weekend" between 0 and 1440)
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"app_store_url" text NOT NULL,
	"category" "category" NOT NULL,
	"age_min" integer NOT NULL,
	"age_max" integer NOT NULL,
	"interest_tags" "interest_tag"[] DEFAULT '{}' NOT NULL,
	"cost_model" "cost_model" NOT NULL,
	"ad_status" "ad_status" NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"last_verified" date DEFAULT now() NOT NULL,
	"status" "catalog_status" DEFAULT 'Active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apps_age_range" CHECK ("apps"."age_min" between 0 and 17 and "apps"."age_max" between 0 and 17),
	CONSTRAINT "apps_age_order" CHECK ("apps"."age_min" <= "apps"."age_max")
);
--> statement-breakpoint
CREATE TABLE "child_app_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"app_id" integer NOT NULL,
	"status" "install_status" DEFAULT 'Not Installed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_app_status_child_id_app_id_unique" UNIQUE("child_id","app_id")
);
--> statement-breakpoint
ALTER TABLE "child_app_status" ADD CONSTRAINT "child_app_status_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_app_status" ADD CONSTRAINT "child_app_status_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "child_app_status_app_id_idx" ON "child_app_status" USING btree ("app_id");