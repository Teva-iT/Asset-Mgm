import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const diagnostics: any = {}

        // 1. Find a user to test on
        const { data: user, error: fetchError } = await supabase.from("User").select("*").limit(1).maybeSingle();

        if (fetchError || !user) {
            return NextResponse.json({ error: 'No users found to test update' })
        }

        diagnostics.testUser = { id: user.UserID, username: user.Username, role: user.Role }

        // 2. Attempt Dummy Update (Email update)
        try {
            const { data: updated, error: updateError } = await supabase.from("User").update({
                Email: 'test-debug-' + Math.random().toString(36).substring(7) + '@example.com'
            }).eq("UserID", user.UserID).select().single();

            if (updateError) throw updateError;

            diagnostics.updateSuccess = true
            diagnostics.updatedUser = updated
        } catch (e: any) {
            diagnostics.updateError = e.message
            diagnostics.updateErrorCode = e.code
            diagnostics.updateErrorMeta = e.details
        }

        return NextResponse.json(diagnostics)
    } catch (error: any) {
        return NextResponse.json({ error: 'Fatal error in debug endpoint', details: error.message }, { status: 500 })
    }
}
