CREATE TABLE IF NOT EXISTS "public"."ModelPhoto" (
    "PhotoID" "text" NOT NULL,
    "ModelID" "text" NOT NULL,
    "URL" "text" NOT NULL,
    "Category" "text" DEFAULT 'Reference'::"text" NOT NULL,
    "SortOrder" integer DEFAULT 0 NOT NULL,
    "UploadedBy" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."ModelPhoto" OWNER TO "postgres";

ALTER TABLE ONLY "public"."ModelPhoto"
    ADD CONSTRAINT "ModelPhoto_pkey" PRIMARY KEY ("PhotoID");

ALTER TABLE ONLY "public"."ModelPhoto"
    ADD CONSTRAINT "ModelPhoto_ModelID_fkey" FOREIGN KEY ("ModelID") REFERENCES "public"."AssetModel"("ModelID") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "idx_model_photo_model_id" ON "public"."ModelPhoto" ("ModelID");
CREATE INDEX IF NOT EXISTS "idx_model_photo_sort_order" ON "public"."ModelPhoto" ("ModelID", "SortOrder");

GRANT ALL ON TABLE "public"."ModelPhoto" TO "anon";
GRANT ALL ON TABLE "public"."ModelPhoto" TO "authenticated";
GRANT ALL ON TABLE "public"."ModelPhoto" TO "service_role";
