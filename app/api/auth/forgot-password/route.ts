import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

// Helper to log code for simulation
function logCode(email: string, code: string) {
    const timestamp = new Date().toISOString()
    const message = `[EMAIL SIMULATION] To: ${email} | Code: ${code}`
    console.log(message)

    try {
        const logPath = path.join(process.cwd(), 'server_debug.log')
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`)
    } catch (e) {
        console.error('Failed to write to log file', e)
    }
}

export async function POST(request: Request) {
    try {
        const { identifier } = await request.json() // Can be username or email

        if (!identifier) {
            return NextResponse.json({ error: 'Username or Email is required' }, { status: 400 })
        }

        // Find user by Username OR Email
        const { data: user, error: userError } = await supabase
            .from("User")
            .select("*")
            .or(`Username.ilike.${identifier},Email.ilike.${identifier}`)
            .limit(1)
            .maybeSingle();

        if (userError || !user) {
            // Security: Don't reveal if user exists or not, but for internal app it's often OK.
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

        // Save to DB
        const { error: updateError } = await supabase.from("User").update({
            ResetCode: code,
            ResetCodeExpiry: expiry
        }).eq("UserID", user.UserID);

        if (updateError) throw updateError;

        // "Send" Email (Simulate)
        logCode(user.Email || user.Username, code)

        return NextResponse.json({
            message: 'Reset code sent',
            debug: 'Check server console for code'
        })

    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
