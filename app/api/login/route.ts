import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json()

        const { data: user, error } = await supabase.from("User").select("*").ilike("Username", username).maybeSingle();

        if (error || !user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isValid = await compare(password, user.Password)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Create JWT
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        const token = await new SignJWT({ userId: user.UserID, role: user.Role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret)

        const response = NextResponse.json({ success: true, role: user.Role })

        // Set cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
