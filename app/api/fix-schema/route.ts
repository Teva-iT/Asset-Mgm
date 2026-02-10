import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const logs: string[] = []
    try {
        // 1. Find the table name (Case Insensitive)
        const tables: any[] = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name ILIKE 'user'
        `

        if (tables.length === 0) {
            return NextResponse.json({ error: 'User table not found in information_schema' })
        }

        const tableName = tables[0].table_name
        logs.push(`Found table: "${tableName}"`)

        // 2. Add Columns
        const columnsToAdd = [
            { name: 'Email', type: 'TEXT' },
            { name: 'ResetCode', type: 'TEXT' },
            { name: 'ResetCodeExpiry', type: 'TIMESTAMP(3)' }
        ]

        for (const col of columnsToAdd) {
            try {
                // Check if column exists first
                const cols: any[] = await prisma.$queryRaw`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = ${tableName} 
                    AND column_name = ${col.name}
                ` // Note: column_name check might be case sensitive depending on DB, but usually lowercase in info_schema if unquoted creation.
                // However, we want to add "Email" specifically if we are using Prisma casing.

                // We'll just try to add it with IF NOT EXISTS logic or catch error
                // Postrgres doesn't support IF NOT EXISTS in ALTER COLUMN standardly in all versions, 
                // but ADD COLUMN IF NOT EXISTS is supported in PG 9.6+

                // We quote the column name to match Prisma's likely expectation "Email"
                const query = `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};`
                await prisma.$executeRawUnsafe(query)
                logs.push(`Added valid column: ${col.name}`)
            } catch (e: any) {
                logs.push(`Failed to add ${col.name}: ${e.message}`)
            }
        }

        // 3. Add Unique Index for Email
        try {
            await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_Email_key" ON "${tableName}"("Email");`)
            logs.push('Verified unique index on Email')
        } catch (e: any) {
            logs.push(`Index error: ${e.message}`)
        }

        // 4. Verify Final Schema
        const finalCols: any[] = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = ${tableName}
        `
        logs.push(`Current Columns: ${finalCols.map(c => c.column_name).join(', ')}`)

        return NextResponse.json({ success: true, logs })

    } catch (error: any) {
        return NextResponse.json({ error: 'Fatal error', details: error.message, logs }, { status: 500 })
    }
}
