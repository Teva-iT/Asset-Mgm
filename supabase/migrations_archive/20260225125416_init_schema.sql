drop policy "Allow system to insert ad_sync_logs" on "public"."ad_sync_logs";

alter table "public"."LicenseAssignment" drop constraint "LicenseAssignment_AssetID_fkey";

alter table "public"."LicenseAssignment" drop constraint "LicenseAssignment_EmployeeID_fkey";

alter table "public"."LicenseAssignment" drop constraint "LicenseAssignment_LicenseID_fkey";

alter table "public"."ad_sync_logs" drop constraint "ad_sync_logs_executed_by_fkey";


  create table "public"."distribution_lists" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(255) not null,
    "description" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."License" alter column "LicenseType" drop not null;

alter table "public"."License" alter column "Status" drop not null;

alter table "public"."License" alter column "createdAt" drop not null;

alter table "public"."License" alter column "updatedAt" drop not null;

alter table "public"."LicenseAssignment" alter column "AssignedDate" drop not null;

alter table "public"."ad_sync_logs" alter column "created_at" drop not null;

alter table "public"."ad_sync_logs" alter column "groups_added" drop default;

CREATE UNIQUE INDEX distribution_lists_pkey ON public.distribution_lists USING btree (id);

alter table "public"."distribution_lists" add constraint "distribution_lists_pkey" PRIMARY KEY using index "distribution_lists_pkey";

alter table "public"."LicenseAssignment" add constraint "LicenseAssignment_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES public."Asset"("AssetID") not valid;

alter table "public"."LicenseAssignment" validate constraint "LicenseAssignment_AssetID_fkey";

alter table "public"."LicenseAssignment" add constraint "LicenseAssignment_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES public."Employee"("EmployeeID") not valid;

alter table "public"."LicenseAssignment" validate constraint "LicenseAssignment_EmployeeID_fkey";

alter table "public"."LicenseAssignment" add constraint "LicenseAssignment_LicenseID_fkey" FOREIGN KEY ("LicenseID") REFERENCES public."License"("LicenseID") not valid;

alter table "public"."LicenseAssignment" validate constraint "LicenseAssignment_LicenseID_fkey";

alter table "public"."ad_sync_logs" add constraint "ad_sync_logs_executed_by_fkey" FOREIGN KEY (executed_by) REFERENCES public."User"("UserID") not valid;

alter table "public"."ad_sync_logs" validate constraint "ad_sync_logs_executed_by_fkey";

grant delete on table "public"."distribution_lists" to "anon";

grant insert on table "public"."distribution_lists" to "anon";

grant references on table "public"."distribution_lists" to "anon";

grant select on table "public"."distribution_lists" to "anon";

grant trigger on table "public"."distribution_lists" to "anon";

grant truncate on table "public"."distribution_lists" to "anon";

grant update on table "public"."distribution_lists" to "anon";

grant delete on table "public"."distribution_lists" to "authenticated";

grant insert on table "public"."distribution_lists" to "authenticated";

grant references on table "public"."distribution_lists" to "authenticated";

grant select on table "public"."distribution_lists" to "authenticated";

grant trigger on table "public"."distribution_lists" to "authenticated";

grant truncate on table "public"."distribution_lists" to "authenticated";

grant update on table "public"."distribution_lists" to "authenticated";

grant delete on table "public"."distribution_lists" to "service_role";

grant insert on table "public"."distribution_lists" to "service_role";

grant references on table "public"."distribution_lists" to "service_role";

grant select on table "public"."distribution_lists" to "service_role";

grant trigger on table "public"."distribution_lists" to "service_role";

grant truncate on table "public"."distribution_lists" to "service_role";

grant update on table "public"."distribution_lists" to "service_role";


  create policy "insert"
  on "public"."ad_sync_logs"
  as permissive
  for insert
  to public
with check (true);



  create policy "read"
  on "public"."ad_sync_logs"
  as permissive
  for select
  to public
using (true);



