import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { username, oldPassword, newPassword } = await request.json()

        if (!username || !oldPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Find user
        const { data: user, error: userError } = await supabase.from("User").select("*").eq("Username", username).limit(1).maybeSingle();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify Old Password
        const isValid = await bcrypt.compare(oldPassword, user.Password)
        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect old password' }, { status: 401 })
        }

        // Update to New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const { error: updateError } = await supabase.from("User").update({
            Password: hashedPassword
        }).eq("UserID", user.UserID);

        if (updateError) throw updateError;

        return NextResponse.json({ message: 'Password changed successfully' })

    } catch (error) {
        console.error('Change password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
