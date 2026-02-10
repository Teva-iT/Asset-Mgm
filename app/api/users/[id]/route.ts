
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET: Fetch a single user
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        // Use Raw SQL to ensure we hit the correct "User" table
        const users: any[] = await prisma.$queryRaw`
            SELECT * FROM "User" WHERE "UserID" = ${params.id}
        `

        if (!users || users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const u = users[0]
        // Map to PascalCase matching frontend interface
        const user = {
            UserID: u.UserID || u.userid,
            Username: u.Username || u.username,
            Role: u.Role || u.role,
            Email: u.Email || u.email,
            Status: u.Status || u.status || 'Active',
            createdAt: u.CreatedAt || u.createdat, // Note frontend expects 'createdAt' (camel) or 'CreatedAt' (Pascal)? 
            // Previous findUnique selected 'createdAt' (lower c).
            updatedAt: u.UpdatedAt || u.updatedat
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
        }

        // Only update password if provided and not empty
        if (password && password.trim() !== '') {
            dataToUpdate.Password = await bcrypt.hash(password, 10)
        }

        // Check if username is taken by another user (Raw SQL)
        const usernameCheck: any[] = await prisma.$queryRaw`
            SELECT "UserID" FROM "User" 
            WHERE "Username" = ${username} AND "UserID" != ${params.id}
        `
        if (usernameCheck.length > 0) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
        }

        // Check if email is taken by another user (Raw SQL)
        if (email) {
            const emailCheck: any[] = await prisma.$queryRaw`
                SELECT "UserID" FROM "User" 
                WHERE "Email" = ${email} AND "UserID" != ${params.id}
            `
            if (emailCheck.length > 0) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
            }
        }

        // LAZY MIGRATION: Ensure columns exist (running this every time is not ideal but safe for now)
        try {
            const tableName = 'User' // Corrected to TitleCase based on findings
            await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "Email" TEXT;`)
            // Only add index if we are sure it doesn't exist, or just catch error
            try {
                await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_Email_key" ON "${tableName}"("Email");`)
            } catch (e) { }
        } catch (e) { console.log('Lazy migration ignored', e) }

        // Perform Update using Raw SQL to bypass stale Client Schema
        // We need to construct the SET clause dynamically
        const setClauses = []
        const paramsRaw = []
        let paramIdx = 1

        if (username) {
            setClauses.push(`"Username" = $${paramIdx++}`)
            paramsRaw.push(username)
        }
        if (password && password.trim() !== '') {
            setClauses.push(`"Password" = $${paramIdx++}`)
            paramsRaw.push(await bcrypt.hash(password, 10))
        }
        if (role) {
            setClauses.push(`"Role" = $${paramIdx++}`)
            paramsRaw.push(role)
        }
        if (email !== undefined) { // Allow null/empty
            setClauses.push(`"Email" = $${paramIdx++}`)
            paramsRaw.push(email)
        }

        // Always update UpdatedAt
        setClauses.push(`"UpdatedAt" = NOW()`)

        if (setClauses.length === 0) {
            return NextResponse.json({ message: 'No changes provided' })
        }

        // Add ID as last param
        paramsRaw.push(params.id)

        // Execute Update
        // Execute Update
        const query = `
            UPDATE "User" 
            SET ${setClauses.join(', ')} 
            WHERE "UserID" = $${paramIdx} 
            RETURNING "UserID", "Username", "Role", "Email", "CreatedAt", "UpdatedAt"
        `

        const updatedUsers: any = await prisma.$queryRawUnsafe(query, ...paramsRaw)

        if (!updatedUsers || updatedUsers.length === 0) {
            return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 })
        }

        return NextResponse.json(updatedUsers[0])

    } catch (error: any) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 })
    }
}

// DELETE: Delete user
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        // Raw SQL Delete
        const count = await prisma.$executeRaw`
            DELETE FROM "User" WHERE "UserID" = ${params.id}
        `
        // @ts-ignore
        if (count === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ message: 'User deleted' })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
