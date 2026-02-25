-- CreateTable: access_requests
CREATE TABLE "access_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" TEXT NOT NULL, -- Ties back to the Employee table ID
    "created_by" TEXT NOT NULL, -- Ties back to the User table ID
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: access_request_sections
CREATE TABLE "access_request_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "access_request_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "access_request_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: access_request_items
CREATE TABLE "access_request_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "access_request_id" UUID NOT NULL,
    "section_name" TEXT,
    "field_name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "value" TEXT,
    "justification" TEXT,
    "external_process_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "access_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: access_request_status_logs
CREATE TABLE "access_request_status_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "access_request_id" UUID NOT NULL,
    "changed_by" TEXT NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_request_status_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys
ALTER TABLE "access_requests" ADD CONSTRAINT "ar_employee_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("EmployeeID") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_requests" ADD CONSTRAINT "ar_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "access_request_sections" ADD CONSTRAINT "ars_request_fkey" FOREIGN KEY ("access_request_id") REFERENCES "access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_request_items" ADD CONSTRAINT "ari_request_fkey" FOREIGN KEY ("access_request_id") REFERENCES "access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_request_status_logs" ADD CONSTRAINT "arsl_request_fkey" FOREIGN KEY ("access_request_id") REFERENCES "access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_request_status_logs" ADD CONSTRAINT "arsl_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;
