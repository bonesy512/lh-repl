CREATE TABLE "analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"parcel_id" integer,
	"user_id" integer,
	"analysis" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"credits_used" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"acres" numeric NOT NULL,
	"price" integer,
	"details" jsonb,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"firebase_uid" text NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"subscription_status" text,
	"subscription_id" text,
	"subscription_plan" text,
	"additional_seats" integer DEFAULT 0,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;