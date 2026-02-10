
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        // Use Raw SQL to bypass Prisma Schema mismatch issues
        // The table is verified to be "User" (TitleCase) in the database
        const users: any[] = await prisma.$queryRaw`
            SELECT * FROM "User" 
            ORDER BY "Username" ASC
        `

        // Ensure the response matches what frontend expects (PascalCase keys)
        // If the DB returns lowercase keys, we might need to map them, 
        // but based on "User" table name, columns might be TitleCase too.
        // We'll map just to be safe.
        const mappedUsers = users.map(u => ({
            UserID: u.UserID || u.userid,
            Username: u.Username || u.username,
            Role: u.Role || u.role,
            Email: u.Email || u.email,
            Status: u.Status || u.status || 'Active', // Default status if missing
            CreatedAt: u.CreatedAt || u.createdat,
            UpdatedAt: u.UpdatedAt || u.updatedat
        }))

        return NextResponse.json(mappedUsers)
    } catch (error) {
        console.error('Error fetching users:', error)
        // Try fallback to lowercase if TitleCase fails
        try {
            const usersLower: any[] = await prisma.$queryRaw`SELECT * FROM "user" ORDER BY username ASC`
            return NextResponse.json(usersLower)
        } catch (e) {
            console.error('Fallback fetch failed:', e)
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
        }
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, password, role, email } = body

        if (!username || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check availability (Username) - Raw SQL
        const existingUsername: any[] = await prisma.$queryRaw`
            SELECT "UserID" FROM "User" WHERE "Username" = ${username}
        `

        if (existingUsername.length > 0) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
        }

        // Check availability (Email) - Raw SQL
        if (email) {
            const existingEmail: any[] = await prisma.$queryRaw`
                SELECT "UserID" FROM "User" WHERE "Email" = ${email}
            `
            if (existingEmail.length > 0) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Insert User - Raw SQL
        // We let DB generate UUID if default is set, OR we generate it here?
        // Schema says: @default(dbgenerated("gen_random_uuid()"))
        // So we don't need to provide UserID.

        // Note: We need to handle potential null email

        const result: any[] = await prisma.$queryRaw`
            INSERT INTO "User" ("Username", "Password", "Role", "Email", "updatedAt", "createdAt")
            VALUES (${username}, ${hashedPassword}, ${role}, ${email || null}, NOW(), NOW())
            RETURNING "UserID", "Username", "Role", "Email", "createdAt"
        `

        if (!result || result.length === 0) {
            throw new Error('Insert failed to return data')
        }

        const newUser = result[0]

        return NextResponse.json({
            UserID: newUser.UserID || newUser.userid,
            Username: newUser.Username || newUser.username,
            Role: newUser.Role || newUser.role,
            Email: newUser.Email || newUser.email
        }, { status: 201 })

    } catch (error: any) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 })
    }
}
