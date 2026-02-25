import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { identifier, code, newPassword } = await request.json()

        if (!identifier || !code || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Find user
        const { data: user, error: userError } = await supabase
            .from("User")
            .select("*")
            .or(`Username.ilike.${identifier},Email.ilike.${identifier}`)
            .limit(1)
            .maybeSingle();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify Code
        if (user.ResetCode !== code) {
            return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 })
        }

        // Verify Expiry
        if (!user.ResetCodeExpiry || new Date() > new Date(user.ResetCodeExpiry)) {
            return NextResponse.json({ error: 'Reset code has expired' }, { status: 400 })
        }

        // Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const { error: updateError } = await supabase.from("User").update({
            Password: hashedPassword,
            ResetCode: null,
            ResetCodeExpiry: null
        }).eq("UserID", user.UserID);

        if (updateError) throw updateError;

        return NextResponse.json({ message: 'Password reset successfully' })

    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
