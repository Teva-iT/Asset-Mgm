


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Asset" (
    "AssetID" "text" NOT NULL,
    "AssetType" "text",
    "AssetName" "text",
    "Brand" "text",
    "Model" "text",
    "SerialNumber" "text",
    "DeviceTag" "text",
    "Status" "text",
    "PurchaseDate" timestamp(3) without time zone,
    "Notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "Condition" "text",
    "Location" "text",
    "OperationalState" "text",
    "OwnershipType" "text",
    "Quantity" integer DEFAULT 1,
    "AssetTag" "text",
    "ModelID" "text",
    "ProcurementItemID" "text",
    "StorageLocationID" "text",
    "WarrantyExpiryDate" timestamp without time zone,
    "SupportContractEnd" timestamp without time zone,
    "VendorName" "text",
    "VendorContact" "text",
    "PurchasePrice" numeric(10,2)
);


ALTER TABLE "public"."Asset" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssetModel" (
    "ModelID" "text" NOT NULL,
    "Name" "text" NOT NULL,
    "ModelNumber" "text",
    "Category" "text" NOT NULL,
    "ManufacturerID" "text" NOT NULL,
    "Description" "text",
    "ImageURL" "text",
    "EOLDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "Series" "text"
);


ALTER TABLE "public"."AssetModel" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssetPhoto" (
    "PhotoID" "text" NOT NULL,
    "AssetID" "text" NOT NULL,
    "URL" "text" NOT NULL,
    "Category" "text" DEFAULT 'General'::"text" NOT NULL,
    "UploadedBy" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."AssetPhoto" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssetRequest" (
    "RequestID" "text" NOT NULL,
    "FirstName" "text" NOT NULL,
    "LastName" "text" NOT NULL,
    "Email" "text" NOT NULL,
    "RequestType" "text" NOT NULL,
    "RequestedDate" timestamp(3) without time zone NOT NULL,
    "Notes" "text",
    "Status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."AssetRequest" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssetStatus" (
    "Name" "text" NOT NULL,
    "Color" "text",
    "Description" "text"
);


ALTER TABLE "public"."AssetStatus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssetType" (
    "TypeID" "text" NOT NULL,
    "Name" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "OwnershipType" "text" DEFAULT 'Individual'::"text" NOT NULL
);


ALTER TABLE "public"."AssetType" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Assignment" (
    "AssignmentID" "text" NOT NULL,
    "AssetID" "text" NOT NULL,
    "EmployeeID" "text" NOT NULL,
    "AssignedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ExpectedReturnDate" timestamp(3) without time zone,
    "ActualReturnDate" timestamp(3) without time zone,
    "Status" "text" NOT NULL,
    "Notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "AssignedByUserID" "text"
);


ALTER TABLE "public"."Assignment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AuditLog" (
    "LogID" "text" NOT NULL,
    "AssetID" "text" NOT NULL,
    "Action" "text" NOT NULL,
    "Details" "text",
    "UserID" "text",
    "Timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."AuditLog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Employee" (
    "EmployeeID" "text" NOT NULL,
    "FirstName" "text" NOT NULL,
    "LastName" "text" NOT NULL,
    "Email" "text" NOT NULL,
    "Department" "text" NOT NULL,
    "StartDate" timestamp(3) without time zone NOT NULL,
    "EndDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "Status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "Slug" "text"
);


ALTER TABLE "public"."Employee" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."License" (
    "LicenseID" "text" NOT NULL,
    "ProductName" "text" NOT NULL,
    "VendorName" "text",
    "LicenseKey" "text",
    "LicenseType" "text" DEFAULT 'Per Seat'::"text",
    "TotalSeats" integer,
    "ExpiryDate" timestamp without time zone,
    "PurchaseDate" timestamp without time zone,
    "CostPerYear" numeric(10,2),
    "Notes" "text",
    "Status" "text" DEFAULT 'Active'::"text",
    "createdAt" timestamp without time zone DEFAULT "now"(),
    "updatedAt" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."License" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."LicenseAssignment" (
    "AssignmentID" "text" NOT NULL,
    "LicenseID" "text" NOT NULL,
    "EmployeeID" "text",
    "AssetID" "text",
    "AssignedDate" timestamp without time zone DEFAULT "now"(),
    "Notes" "text"
);


ALTER TABLE "public"."LicenseAssignment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Manufacturer" (
    "ManufacturerID" "text" NOT NULL,
    "Name" "text" NOT NULL,
    "Website" "text",
    "SupportEmail" "text",
    "SupportPhone" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Manufacturer" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ModelRelationship" (
    "RelationshipID" "text" NOT NULL,
    "ParentModelID" "text" NOT NULL,
    "ChildModelID" "text" NOT NULL,
    "Type" "text" NOT NULL
);


ALTER TABLE "public"."ModelRelationship" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."OffboardingAudit" (
    "AuditID" "text" NOT NULL,
    "ChecklistID" "text" NOT NULL,
    "Action" "text" NOT NULL,
    "UserID" "text",
    "Timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "IPAddress" "text"
);


ALTER TABLE "public"."OffboardingAudit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."OffboardingChecklist" (
    "ChecklistID" "text" NOT NULL,
    "EmployeeID" "text" NOT NULL,
    "ExitDate" timestamp(3) without time zone NOT NULL,
    "Status" "text" DEFAULT 'Draft'::"text" NOT NULL,
    "Language" "text" DEFAULT 'DE'::"text" NOT NULL,
    "CreatedBy" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ChecklistData" "jsonb"
);


ALTER TABLE "public"."OffboardingChecklist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."OffboardingToken" (
    "TokenID" "text" NOT NULL,
    "ChecklistID" "text" NOT NULL,
    "Token" "text" NOT NULL,
    "ExpiresAt" timestamp(3) without time zone NOT NULL,
    "Used" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."OffboardingToken" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ProcurementItem" (
    "ItemID" "text" NOT NULL,
    "RequestID" "text" NOT NULL,
    "ModelID" "text" NOT NULL,
    "Quantity" integer NOT NULL,
    "UnitPrice" numeric(65,30)
);


ALTER TABLE "public"."ProcurementItem" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ProcurementRequest" (
    "RequestID" "text" NOT NULL,
    "RequesterUserID" "text" NOT NULL,
    "Status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "VendorID" "text",
    "CostCenter" "text",
    "TotalCost" numeric(65,30),
    "Currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "Notes" "text",
    "OrderDate" timestamp(3) without time zone,
    "ExpectedDate" timestamp(3) without time zone,
    "ReceivedDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ProcurementRequest" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ScanHistory" (
    "ScanID" "text" NOT NULL,
    "ScannedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "Outcome" "text" NOT NULL,
    "Method" "text" NOT NULL,
    "Query" "text",
    "CalculatedStatus" "text",
    "AssetID" "text",
    "ScannedByUserID" "text"
);


ALTER TABLE "public"."ScanHistory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."StorageLocation" (
    "LocationID" "text" NOT NULL,
    "Name" "text" NOT NULL,
    "Description" "text",
    "ParentLocationID" "text",
    "cachedPath" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."StorageLocation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "UserID" "text" NOT NULL,
    "Username" "text" NOT NULL,
    "Password" "text" NOT NULL,
    "Role" "text" DEFAULT 'VIEWER'::"text" NOT NULL,
    "CreatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "UpdatedAt" timestamp(3) without time zone NOT NULL,
    "Email" "text",
    "ResetCode" "text",
    "ResetCodeExpiry" timestamp(3) without time zone
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Vendor" (
    "VendorID" "text" NOT NULL,
    "Name" "text" NOT NULL,
    "ContactName" "text",
    "Email" "text",
    "Phone" "text",
    "Address" "text",
    "Website" "text",
    "ContractStart" timestamp(3) without time zone,
    "ContractEnd" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Vendor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_ModelVendors" (
    "A" "text" NOT NULL,
    "B" "text" NOT NULL
);


ALTER TABLE "public"."_ModelVendors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."access_request_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "access_request_id" "uuid" NOT NULL,
    "section_name" "text",
    "field_name" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "value" "text",
    "justification" "text",
    "external_process_flag" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."access_request_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."access_request_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "access_request_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."access_request_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."access_request_status_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "access_request_id" "uuid" NOT NULL,
    "changed_by" "text" NOT NULL,
    "old_status" "text",
    "new_status" "text" NOT NULL,
    "comments" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."access_request_status_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."access_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "text" NOT NULL,
    "created_by" "text" NOT NULL,
    "status" "text" DEFAULT 'Draft'::"text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "submitted_at" timestamp(3) without time zone,
    "approved_at" timestamp(3) without time zone,
    "finalized_at" timestamp(3) without time zone,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "onboarding_request_id" "uuid"
);


ALTER TABLE "public"."access_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_provisioning_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_dn" "text" NOT NULL,
    "group_dn" "text" NOT NULL,
    "executor_id" "text",
    "access_request_id" "uuid",
    "action_type" character varying(50) DEFAULT 'ADD_MEMBER'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'SUCCESS'::character varying NOT NULL,
    "details" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."ad_provisioning_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_sync_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "executed_by" "text",
    "from_user" "text" NOT NULL,
    "to_user" "text" NOT NULL,
    "to_user_dn" "text" NOT NULL,
    "groups_added" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "groups_removed" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "groups_failed" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "executor_name" "text",
    "result" "jsonb"
);


ALTER TABLE "public"."ad_sync_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."department" (
    "departmentid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "createdat" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedat" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."department" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."distribution_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."distribution_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hardware_additional_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "hardware_request_id" "uuid" NOT NULL,
    "item_description" "text" NOT NULL,
    "business_justification" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."hardware_additional_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hardware_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "onboarding_request_id" "uuid",
    "employee_id" "text" NOT NULL,
    "requested_by" character varying(255) NOT NULL,
    "request_type" character varying(50) DEFAULT 'Standard'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'Draft'::character varying NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."hardware_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hardware_standard_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "hardware_request_id" "uuid" NOT NULL,
    "item_category" character varying(100) NOT NULL,
    "item_name" character varying(255) NOT NULL,
    "is_requested" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."hardware_standard_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "employee_id" "text" NOT NULL,
    "requested_by" character varying(255) NOT NULL,
    "start_date" "date" NOT NULL,
    "status" character varying(50) DEFAULT 'Draft'::character varying NOT NULL,
    "include_access" boolean DEFAULT false NOT NULL,
    "include_hardware" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."onboarding_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."AssetModel"
    ADD CONSTRAINT "AssetModel_pkey" PRIMARY KEY ("ModelID");



ALTER TABLE ONLY "public"."AssetPhoto"
    ADD CONSTRAINT "AssetPhoto_pkey" PRIMARY KEY ("PhotoID");



ALTER TABLE ONLY "public"."AssetRequest"
    ADD CONSTRAINT "AssetRequest_pkey" PRIMARY KEY ("RequestID");



ALTER TABLE ONLY "public"."AssetStatus"
    ADD CONSTRAINT "AssetStatus_pkey" PRIMARY KEY ("Name");



ALTER TABLE ONLY "public"."AssetType"
    ADD CONSTRAINT "AssetType_pkey" PRIMARY KEY ("TypeID");



ALTER TABLE ONLY "public"."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY ("AssetID");



ALTER TABLE ONLY "public"."Assignment"
    ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY ("AssignmentID");



ALTER TABLE ONLY "public"."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("LogID");



ALTER TABLE ONLY "public"."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY ("EmployeeID");



ALTER TABLE ONLY "public"."LicenseAssignment"
    ADD CONSTRAINT "LicenseAssignment_pkey" PRIMARY KEY ("AssignmentID");



ALTER TABLE ONLY "public"."License"
    ADD CONSTRAINT "License_pkey" PRIMARY KEY ("LicenseID");



ALTER TABLE ONLY "public"."Manufacturer"
    ADD CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("ManufacturerID");



ALTER TABLE ONLY "public"."ModelRelationship"
    ADD CONSTRAINT "ModelRelationship_pkey" PRIMARY KEY ("RelationshipID");



ALTER TABLE ONLY "public"."OffboardingAudit"
    ADD CONSTRAINT "OffboardingAudit_pkey" PRIMARY KEY ("AuditID");



ALTER TABLE ONLY "public"."OffboardingChecklist"
    ADD CONSTRAINT "OffboardingChecklist_pkey" PRIMARY KEY ("ChecklistID");



ALTER TABLE ONLY "public"."OffboardingToken"
    ADD CONSTRAINT "OffboardingToken_pkey" PRIMARY KEY ("TokenID");



ALTER TABLE ONLY "public"."ProcurementItem"
    ADD CONSTRAINT "ProcurementItem_pkey" PRIMARY KEY ("ItemID");



ALTER TABLE ONLY "public"."ProcurementRequest"
    ADD CONSTRAINT "ProcurementRequest_pkey" PRIMARY KEY ("RequestID");



ALTER TABLE ONLY "public"."ScanHistory"
    ADD CONSTRAINT "ScanHistory_pkey" PRIMARY KEY ("ScanID");



ALTER TABLE ONLY "public"."StorageLocation"
    ADD CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("LocationID");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("UserID");



ALTER TABLE ONLY "public"."Vendor"
    ADD CONSTRAINT "Vendor_pkey" PRIMARY KEY ("VendorID");



ALTER TABLE ONLY "public"."_ModelVendors"
    ADD CONSTRAINT "_ModelVendors_AB_pkey" PRIMARY KEY ("A", "B");



ALTER TABLE ONLY "public"."access_request_items"
    ADD CONSTRAINT "access_request_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."access_request_sections"
    ADD CONSTRAINT "access_request_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."access_request_status_logs"
    ADD CONSTRAINT "access_request_status_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_provisioning_logs"
    ADD CONSTRAINT "ad_provisioning_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_sync_logs"
    ADD CONSTRAINT "ad_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."department"
    ADD CONSTRAINT "department_pkey" PRIMARY KEY ("departmentid");



ALTER TABLE ONLY "public"."distribution_lists"
    ADD CONSTRAINT "distribution_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hardware_additional_items"
    ADD CONSTRAINT "hardware_additional_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hardware_requests"
    ADD CONSTRAINT "hardware_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hardware_standard_items"
    ADD CONSTRAINT "hardware_standard_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_requests"
    ADD CONSTRAINT "onboarding_requests_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "AssetType_Name_key" ON "public"."AssetType" USING "btree" ("Name");



CREATE UNIQUE INDEX "Asset_AssetTag_key" ON "public"."Asset" USING "btree" ("AssetTag");



CREATE UNIQUE INDEX "Asset_DeviceTag_key" ON "public"."Asset" USING "btree" ("DeviceTag");



CREATE UNIQUE INDEX "Asset_SerialNumber_key" ON "public"."Asset" USING "btree" ("SerialNumber");



CREATE UNIQUE INDEX "Employee_Email_key" ON "public"."Employee" USING "btree" ("Email");



CREATE UNIQUE INDEX "Employee_Slug_key" ON "public"."Employee" USING "btree" ("Slug");



CREATE UNIQUE INDEX "Manufacturer_Name_key" ON "public"."Manufacturer" USING "btree" ("Name");



CREATE UNIQUE INDEX "ModelRelationship_ParentModelID_ChildModelID_Type_key" ON "public"."ModelRelationship" USING "btree" ("ParentModelID", "ChildModelID", "Type");



CREATE UNIQUE INDEX "OffboardingToken_Token_key" ON "public"."OffboardingToken" USING "btree" ("Token");



CREATE UNIQUE INDEX "User_Email_key" ON "public"."User" USING "btree" ("Email");



CREATE UNIQUE INDEX "User_Username_key" ON "public"."User" USING "btree" ("Username");



CREATE UNIQUE INDEX "Vendor_Name_key" ON "public"."Vendor" USING "btree" ("Name");



CREATE INDEX "_ModelVendors_B_index" ON "public"."_ModelVendors" USING "btree" ("B");



ALTER TABLE ONLY "public"."AssetModel"
    ADD CONSTRAINT "AssetModel_ManufacturerID_fkey" FOREIGN KEY ("ManufacturerID") REFERENCES "public"."Manufacturer"("ManufacturerID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."AssetPhoto"
    ADD CONSTRAINT "AssetPhoto_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "public"."Asset"("AssetID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Asset"
    ADD CONSTRAINT "Asset_ModelID_fkey" FOREIGN KEY ("ModelID") REFERENCES "public"."AssetModel"("ModelID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Asset"
    ADD CONSTRAINT "Asset_ProcurementItemID_fkey" FOREIGN KEY ("ProcurementItemID") REFERENCES "public"."ProcurementItem"("ItemID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Asset"
    ADD CONSTRAINT "Asset_Status_fkey" FOREIGN KEY ("Status") REFERENCES "public"."AssetStatus"("Name") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Asset"
    ADD CONSTRAINT "Asset_StorageLocationID_fkey" FOREIGN KEY ("StorageLocationID") REFERENCES "public"."StorageLocation"("LocationID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Assignment"
    ADD CONSTRAINT "Assignment_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "public"."Asset"("AssetID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Assignment"
    ADD CONSTRAINT "Assignment_AssignedByUserID_fkey" FOREIGN KEY ("AssignedByUserID") REFERENCES "public"."User"("UserID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Assignment"
    ADD CONSTRAINT "Assignment_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "public"."Employee"("EmployeeID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."AuditLog"
    ADD CONSTRAINT "AuditLog_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "public"."Asset"("AssetID") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."AuditLog"
    ADD CONSTRAINT "AuditLog_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "public"."User"("UserID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."LicenseAssignment"
    ADD CONSTRAINT "LicenseAssignment_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "public"."Asset"("AssetID");



ALTER TABLE ONLY "public"."LicenseAssignment"
    ADD CONSTRAINT "LicenseAssignment_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "public"."Employee"("EmployeeID");



ALTER TABLE ONLY "public"."LicenseAssignment"
    ADD CONSTRAINT "LicenseAssignment_LicenseID_fkey" FOREIGN KEY ("LicenseID") REFERENCES "public"."License"("LicenseID");



ALTER TABLE ONLY "public"."ModelRelationship"
    ADD CONSTRAINT "ModelRelationship_ChildModelID_fkey" FOREIGN KEY ("ChildModelID") REFERENCES "public"."AssetModel"("ModelID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ModelRelationship"
    ADD CONSTRAINT "ModelRelationship_ParentModelID_fkey" FOREIGN KEY ("ParentModelID") REFERENCES "public"."AssetModel"("ModelID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."OffboardingAudit"
    ADD CONSTRAINT "OffboardingAudit_ChecklistID_fkey" FOREIGN KEY ("ChecklistID") REFERENCES "public"."OffboardingChecklist"("ChecklistID") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OffboardingAudit"
    ADD CONSTRAINT "OffboardingAudit_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "public"."User"("UserID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."OffboardingChecklist"
    ADD CONSTRAINT "OffboardingChecklist_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "public"."Employee"("EmployeeID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."OffboardingToken"
    ADD CONSTRAINT "OffboardingToken_ChecklistID_fkey" FOREIGN KEY ("ChecklistID") REFERENCES "public"."OffboardingChecklist"("ChecklistID") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ProcurementItem"
    ADD CONSTRAINT "ProcurementItem_RequestID_fkey" FOREIGN KEY ("RequestID") REFERENCES "public"."ProcurementRequest"("RequestID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ProcurementRequest"
    ADD CONSTRAINT "ProcurementRequest_VendorID_fkey" FOREIGN KEY ("VendorID") REFERENCES "public"."Vendor"("VendorID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ScanHistory"
    ADD CONSTRAINT "ScanHistory_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "public"."Asset"("AssetID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ScanHistory"
    ADD CONSTRAINT "ScanHistory_ScannedByUserID_fkey" FOREIGN KEY ("ScannedByUserID") REFERENCES "public"."User"("UserID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."StorageLocation"
    ADD CONSTRAINT "StorageLocation_ParentLocationID_fkey" FOREIGN KEY ("ParentLocationID") REFERENCES "public"."StorageLocation"("LocationID") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."_ModelVendors"
    ADD CONSTRAINT "_ModelVendors_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."AssetModel"("ModelID") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_ModelVendors"
    ADD CONSTRAINT "_ModelVendors_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Vendor"("VendorID") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_onboarding_request_id_fkey" FOREIGN KEY ("onboarding_request_id") REFERENCES "public"."onboarding_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ad_provisioning_logs"
    ADD CONSTRAINT "ad_provisioning_logs_access_request_id_fkey" FOREIGN KEY ("access_request_id") REFERENCES "public"."access_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ad_provisioning_logs"
    ADD CONSTRAINT "ad_provisioning_logs_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "public"."User"("UserID") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ad_sync_logs"
    ADD CONSTRAINT "ad_sync_logs_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "public"."User"("UserID");



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "ar_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("UserID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "ar_employee_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."Employee"("EmployeeID") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."access_request_items"
    ADD CONSTRAINT "ari_request_fkey" FOREIGN KEY ("access_request_id") REFERENCES "public"."access_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."access_request_sections"
    ADD CONSTRAINT "ars_request_fkey" FOREIGN KEY ("access_request_id") REFERENCES "public"."access_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."access_request_status_logs"
    ADD CONSTRAINT "arsl_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."User"("UserID") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."access_request_status_logs"
    ADD CONSTRAINT "arsl_request_fkey" FOREIGN KEY ("access_request_id") REFERENCES "public"."access_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hardware_additional_items"
    ADD CONSTRAINT "hardware_additional_items_hardware_request_id_fkey" FOREIGN KEY ("hardware_request_id") REFERENCES "public"."hardware_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hardware_requests"
    ADD CONSTRAINT "hardware_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."Employee"("EmployeeID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hardware_requests"
    ADD CONSTRAINT "hardware_requests_onboarding_request_id_fkey" FOREIGN KEY ("onboarding_request_id") REFERENCES "public"."onboarding_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hardware_standard_items"
    ADD CONSTRAINT "hardware_standard_items_hardware_request_id_fkey" FOREIGN KEY ("hardware_request_id") REFERENCES "public"."hardware_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_requests"
    ADD CONSTRAINT "onboarding_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."Employee"("EmployeeID") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated to insert AD provisioning logs" ON "public"."ad_provisioning_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow full access to authenticated users on hardware_additional" ON "public"."hardware_additional_items" USING (true);



CREATE POLICY "Allow full access to authenticated users on hardware_requests" ON "public"."hardware_requests" USING (true);



CREATE POLICY "Allow full access to authenticated users on hardware_standard_i" ON "public"."hardware_standard_items" USING (true);



CREATE POLICY "Allow full access to authenticated users on onboarding_requests" ON "public"."onboarding_requests" USING (true);



ALTER TABLE "public"."ad_provisioning_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_sync_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hardware_additional_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hardware_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hardware_standard_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert" ON "public"."ad_sync_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "insert_ad_sync_logs_service" ON "public"."ad_sync_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."onboarding_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read" ON "public"."ad_sync_logs" FOR SELECT USING (true);



CREATE POLICY "read_ad_sync_logs_admin_only" ON "public"."ad_sync_logs" FOR SELECT USING (("auth"."role"() = 'service_role'::"text"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."Asset" TO "anon";
GRANT ALL ON TABLE "public"."Asset" TO "authenticated";
GRANT ALL ON TABLE "public"."Asset" TO "service_role";



GRANT ALL ON TABLE "public"."AssetModel" TO "anon";
GRANT ALL ON TABLE "public"."AssetModel" TO "authenticated";
GRANT ALL ON TABLE "public"."AssetModel" TO "service_role";



GRANT ALL ON TABLE "public"."AssetPhoto" TO "anon";
GRANT ALL ON TABLE "public"."AssetPhoto" TO "authenticated";
GRANT ALL ON TABLE "public"."AssetPhoto" TO "service_role";



GRANT ALL ON TABLE "public"."AssetRequest" TO "anon";
GRANT ALL ON TABLE "public"."AssetRequest" TO "authenticated";
GRANT ALL ON TABLE "public"."AssetRequest" TO "service_role";



GRANT ALL ON TABLE "public"."AssetStatus" TO "anon";
GRANT ALL ON TABLE "public"."AssetStatus" TO "authenticated";
GRANT ALL ON TABLE "public"."AssetStatus" TO "service_role";



GRANT ALL ON TABLE "public"."AssetType" TO "anon";
GRANT ALL ON TABLE "public"."AssetType" TO "authenticated";
GRANT ALL ON TABLE "public"."AssetType" TO "service_role";



GRANT ALL ON TABLE "public"."Assignment" TO "anon";
GRANT ALL ON TABLE "public"."Assignment" TO "authenticated";
GRANT ALL ON TABLE "public"."Assignment" TO "service_role";



GRANT ALL ON TABLE "public"."AuditLog" TO "anon";
GRANT ALL ON TABLE "public"."AuditLog" TO "authenticated";
GRANT ALL ON TABLE "public"."AuditLog" TO "service_role";



GRANT ALL ON TABLE "public"."Employee" TO "anon";
GRANT ALL ON TABLE "public"."Employee" TO "authenticated";
GRANT ALL ON TABLE "public"."Employee" TO "service_role";



GRANT ALL ON TABLE "public"."License" TO "anon";
GRANT ALL ON TABLE "public"."License" TO "authenticated";
GRANT ALL ON TABLE "public"."License" TO "service_role";



GRANT ALL ON TABLE "public"."LicenseAssignment" TO "anon";
GRANT ALL ON TABLE "public"."LicenseAssignment" TO "authenticated";
GRANT ALL ON TABLE "public"."LicenseAssignment" TO "service_role";



GRANT ALL ON TABLE "public"."Manufacturer" TO "anon";
GRANT ALL ON TABLE "public"."Manufacturer" TO "authenticated";
GRANT ALL ON TABLE "public"."Manufacturer" TO "service_role";



GRANT ALL ON TABLE "public"."ModelRelationship" TO "anon";
GRANT ALL ON TABLE "public"."ModelRelationship" TO "authenticated";
GRANT ALL ON TABLE "public"."ModelRelationship" TO "service_role";



GRANT ALL ON TABLE "public"."OffboardingAudit" TO "anon";
GRANT ALL ON TABLE "public"."OffboardingAudit" TO "authenticated";
GRANT ALL ON TABLE "public"."OffboardingAudit" TO "service_role";



GRANT ALL ON TABLE "public"."OffboardingChecklist" TO "anon";
GRANT ALL ON TABLE "public"."OffboardingChecklist" TO "authenticated";
GRANT ALL ON TABLE "public"."OffboardingChecklist" TO "service_role";



GRANT ALL ON TABLE "public"."OffboardingToken" TO "anon";
GRANT ALL ON TABLE "public"."OffboardingToken" TO "authenticated";
GRANT ALL ON TABLE "public"."OffboardingToken" TO "service_role";



GRANT ALL ON TABLE "public"."ProcurementItem" TO "anon";
GRANT ALL ON TABLE "public"."ProcurementItem" TO "authenticated";
GRANT ALL ON TABLE "public"."ProcurementItem" TO "service_role";



GRANT ALL ON TABLE "public"."ProcurementRequest" TO "anon";
GRANT ALL ON TABLE "public"."ProcurementRequest" TO "authenticated";
GRANT ALL ON TABLE "public"."ProcurementRequest" TO "service_role";



GRANT ALL ON TABLE "public"."ScanHistory" TO "anon";
GRANT ALL ON TABLE "public"."ScanHistory" TO "authenticated";
GRANT ALL ON TABLE "public"."ScanHistory" TO "service_role";



GRANT ALL ON TABLE "public"."StorageLocation" TO "anon";
GRANT ALL ON TABLE "public"."StorageLocation" TO "authenticated";
GRANT ALL ON TABLE "public"."StorageLocation" TO "service_role";



GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";



GRANT ALL ON TABLE "public"."Vendor" TO "anon";
GRANT ALL ON TABLE "public"."Vendor" TO "authenticated";
GRANT ALL ON TABLE "public"."Vendor" TO "service_role";



GRANT ALL ON TABLE "public"."_ModelVendors" TO "anon";
GRANT ALL ON TABLE "public"."_ModelVendors" TO "authenticated";
GRANT ALL ON TABLE "public"."_ModelVendors" TO "service_role";



GRANT ALL ON TABLE "public"."access_request_items" TO "anon";
GRANT ALL ON TABLE "public"."access_request_items" TO "authenticated";
GRANT ALL ON TABLE "public"."access_request_items" TO "service_role";



GRANT ALL ON TABLE "public"."access_request_sections" TO "anon";
GRANT ALL ON TABLE "public"."access_request_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."access_request_sections" TO "service_role";



GRANT ALL ON TABLE "public"."access_request_status_logs" TO "anon";
GRANT ALL ON TABLE "public"."access_request_status_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."access_request_status_logs" TO "service_role";



GRANT ALL ON TABLE "public"."access_requests" TO "anon";
GRANT ALL ON TABLE "public"."access_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."access_requests" TO "service_role";



GRANT ALL ON TABLE "public"."ad_provisioning_logs" TO "anon";
GRANT ALL ON TABLE "public"."ad_provisioning_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_provisioning_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ad_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."ad_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."department" TO "anon";
GRANT ALL ON TABLE "public"."department" TO "authenticated";
GRANT ALL ON TABLE "public"."department" TO "service_role";



GRANT ALL ON TABLE "public"."distribution_lists" TO "anon";
GRANT ALL ON TABLE "public"."distribution_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."distribution_lists" TO "service_role";



GRANT ALL ON TABLE "public"."hardware_additional_items" TO "anon";
GRANT ALL ON TABLE "public"."hardware_additional_items" TO "authenticated";
GRANT ALL ON TABLE "public"."hardware_additional_items" TO "service_role";



GRANT ALL ON TABLE "public"."hardware_requests" TO "anon";
GRANT ALL ON TABLE "public"."hardware_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."hardware_requests" TO "service_role";



GRANT ALL ON TABLE "public"."hardware_standard_items" TO "anon";
GRANT ALL ON TABLE "public"."hardware_standard_items" TO "authenticated";
GRANT ALL ON TABLE "public"."hardware_standard_items" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_requests" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_requests" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







