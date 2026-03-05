import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { compare } from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    const { username, password } = await request.json()

    const { data: user, error } = await supabase
        .from("User")
        .select("*")
        .ilike("Username", username)
        .maybeSingle();

    if (error) return NextResponse.json({ step: 'db_query', error: error.message })
    if (!user) return NextResponse.json({ step: 'find_user', error: `No user found with username "${username}"` })

    const isValid = await compare(password, user.Password)
    return NextResponse.json({
        step: 'password_check',
        username: user.Username,
        role: user.Role,
        passwordMatchResult: isValid,
        storedHashPreview: user.Password?.substring(0, 10) + "..."
    })
}
