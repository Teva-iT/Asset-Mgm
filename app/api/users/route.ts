import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        const { data: users, error } = await supabase.from("User").select("*").order("Username", { ascending: true });

        if (error) throw error;

        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, password, role, email } = body

        if (!username || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        const { data: newUser, error: insertError } = await supabase.from("User").insert({
            UserID: crypto.randomUUID(),
            Username: username,
            Password: hashedPassword,
            Role: role,
            Email: email || null,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString()
        }).select("UserID, Username, Role, Email, CreatedAt, UpdatedAt").single();

        if (insertError) {
            if (insertError.code === '23505') {
                return NextResponse.json({ error: 'Username or Email already in use' }, { status: 409 })
            }
            throw insertError;
        }

        return NextResponse.json(newUser, { status: 201 })

    } catch (error: any) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 })
    }
}
