import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const diagnostics: any = {}

        // 0. Manual Migration: Add missing columns if they don't exist
        try {
            // Try adding to "user" (lower) which we confirmed exists or "User"
            const tableName = 'user' // Based on previous diagnostics

            await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "Email" TEXT;`)
            await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "ResetCode" TEXT;`)
            await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "ResetCodeExpiry" TIMESTAMP(3);`)

            // Attempt to add unique constraint safely
            try {
                await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_Email_key" ON "${tableName}"("Email");`)
            } catch (e) { console.log('Index creation ignored', e) }

            diagnostics.migration = 'Attempted to add columns to ' + tableName
        } catch (e: any) {
            diagnostics.migrationError = e.message
        }

        // 1. Find a user to test on
        const user = await prisma.user.findFirst()
        if (!user) {
            return NextResponse.json({ error: 'No users found to test update' })
        }
        diagnostics.testUser = { id: user.UserID, username: user.Username, role: user.Role }

        // 2. Attempt Dummy Update (Email update)
        try {
            const updated = await prisma.user.update({
                where: { UserID: user.UserID },
                data: {
                    Role: user.Role,
                    Email: 'test-debug-' + Math.random().toString(36).substring(7) + '@example.com'
                }
            })
            diagnostics.updateSuccess = true
            diagnostics.updatedUser = updated
        } catch (e: any) {
            diagnostics.updateError = e.message
            diagnostics.updateErrorCode = e.code
            diagnostics.updateErrorMeta = e.meta
        }

        return NextResponse.json(diagnostics)
    } catch (error: any) {
        return NextResponse.json({ error: 'Fatal error in debug endpoint', details: error.message }, { status: 500 })
    }
}
