# Asset Management -- Local Supabase Setup via GitHub Codespaces

## Background

Docker could not run properly inside the company network due to proxy
restrictions. To proceed with development, the project was moved to
GitHub and GitHub Codespaces was used to run Docker and Supabase in a
controlled cloud environment.

------------------------------------------------------------------------

## Step 1 -- Clean Git History and Remove Secrets

The `.env` file originally contained sensitive credentials including:

-   Supabase keys
-   Active Directory service account credentials

Actions taken:

1.  Removed `.env` from the repository
2.  Rewrote Git history using an orphan branch
3.  Created a clean baseline commit
4.  Force-pushed the clean repository to GitHub

Result:

-   Repository contains no secrets
-   History is clean
-   Baseline commit: `clean baseline without secrets`

------------------------------------------------------------------------

## Step 2 -- Create Supabase Migration

Migration file created:

    supabase/migrations/20260225_init.sql

This migration includes:

-   Schema creation
-   Table definitions
-   Indexes
-   Row Level Security policies
-   Grants
-   Default privileges

This file represents the full database structure.

------------------------------------------------------------------------

## Step 3 -- Run Supabase in GitHub Codespaces

Inside Codespaces:

1.  Supabase CLI was initialized
2.  Docker containers were started
3.  Supabase services ran successfully

Database accessible via:

    http://127.0.0.1:54323

------------------------------------------------------------------------

## Step 4 -- Execute Migration in Company Environment

After cloning the clean repository locally, the migration was executed
directly inside the running Postgres container:

    docker exec -i supabase_db_Asset-Mgm psql -U postgres -d postgres < supabase/migrations/20260225_init.sql

Result:

-   All tables created
-   Indexes created
-   Policies created
-   Grants applied
-   Database fully reconstructed

Verified in Supabase Studio.

------------------------------------------------------------------------

## Step 5 -- Restore Environment Variables

Because `.env` was removed, a new local file was created:

    .env.local

This file contains:

-   Supabase URL
-   Supabase anon key
-   Supabase service role key
-   Active Directory configuration (LDAP URL, Base DN, Username,
    Password)

Important:

`.env.local` is excluded from Git via `.gitignore`.

------------------------------------------------------------------------

## Current State

-   Supabase running inside Docker
-   Database fully created from migration
-   No secrets stored in Git
-   Environment variables restored locally
-   Application connected to Supabase and Active Directory

System is now:

-   Secure
-   Reproducible
-   Migration-driven
-   Git-clean
