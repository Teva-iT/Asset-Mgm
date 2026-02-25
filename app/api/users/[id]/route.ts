import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// GET: Fetch a single user
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { data: user, error } = await supabase.from("User").select("*").eq("UserID", params.id).single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }
}

// PUT: Update user
export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json()
        let { username, password, role, email } = body

        // Validate
        if (!username || !role) {
            return NextResponse.json({ error: 'Username and Role are required' }, { status: 400 })
        }

        // Fix for unique constraint: Convert empty string email to null
        if (email === '') {
            email = null
        }

        const dataToUpdate: any = {
            Username: username,
            Role: role,
            Email: email || null,
            UpdatedAt: new Date().toISOString()
        }

        // Only update password if provided and not empty
        if (password && password.trim() !== '') {
            dataToUpdate.Password = await bcrypt.hash(password, 10)
        }

        // Execute Update
        const { error: updateError } = await supabase.from("User").update(dataToUpdate).eq("UserID", params.id);

        if (updateError) {
            if (updateError.code === '23505') {
                return NextResponse.json({ error: 'Username or Email already in use' }, { status: 409 })
            }
            throw updateError;
        }

        const { data: updatedUser } = await supabase.from("User").select("UserID, Username, Role, Email, CreatedAt, UpdatedAt").eq("UserID", params.id).single();

        return NextResponse.json(updatedUser)

    } catch (error: any) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 })
    }
}

// DELETE: Delete user
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { error } = await supabase.from("User").delete().eq("UserID", params.id);

        if (error) throw error;

        return NextResponse.json({ message: 'User deleted' })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
