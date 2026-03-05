import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hash } from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { data: user, error: fetchError } = await supabase.from('User').select('*').ilike('Username', 'admin').maybeSingle();

        const newHash = await hash("2244", 10)

        if (!user) {
            // Create user
            const { error: insertError } = await supabase.from('User').insert({
                UserID: crypto.randomUUID(),
                Username: 'admin',
                Email: 'admin@teva',
                Password: newHash,
                Role: 'Admin',
                UpdatedAt: new Date().toISOString()
            })
            if (insertError) {
                return NextResponse.json({ error: 'failed to create admin account!', details: insertError })
            }
            return NextResponse.json({ success: true, message: 'Admin account created successfully with password 2244!' })
        }

        const { error: updateError } = await supabase.from('User').update({ Password: newHash }).eq('UserID', user.UserID)

        if (updateError) {
            return NextResponse.json({ error: 'failed to update password', details: updateError })
        }

        return NextResponse.json({ success: true, message: 'Password reset to 2244' })
    } catch (e: any) {
        return NextResponse.json({ error: String(e.message || e) })
    }
}
