
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                UserID: true,
                Username: true,
                Role: true,
                CreatedAt: true,
            },
            orderBy: { CreatedAt: 'desc' }
        })
        console.log('GET /api/users found:', users.length, 'users')
        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, password, role } = body

        if (!username || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check availability
        const existing = await prisma.user.findUnique({
            where: { Username: username }
        })

        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                Username: username,
                Password: hashedPassword,
                Role: role,
            }
        })

        return NextResponse.json({
            UserID: user.UserID,
            Username: user.Username,
            Role: user.Role
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}
