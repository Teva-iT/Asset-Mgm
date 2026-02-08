
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET: Fetch a single user
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await prisma.user.findUnique({
            where: { UserID: params.id },
            select: {
                UserID: true,
                Username: true,
                Role: true,
                createdAt: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }
}

// PUT: Update user
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()
        const { username, password, role } = body

        // Validate
        if (!username || !role) {
            return NextResponse.json({ error: 'Username and Role are required' }, { status: 400 })
        }

        const dataToUpdate: any = {
            Username: username,
            Role: role,
        }

        // Only update password if provided and not empty
        if (password && password.trim() !== '') {
            dataToUpdate.Password = await bcrypt.hash(password, 10)
        }

        // Check if username is taken by another user
        const existing = await prisma.user.findFirst({
            where: {
                Username: username,
                UserID: { not: params.id }
            }
        })

        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
        }

        const updatedUser = await prisma.user.update({
            where: { UserID: params.id },
            data: dataToUpdate,
            select: {
                UserID: true,
                Username: true,
                Role: true
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

// DELETE: Delete user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        // Prevent deleting the last admin? (Implementation choice: basic for now, can enhance)

        await prisma.user.delete({
            where: { UserID: params.id }
        })

        return NextResponse.json({ message: 'User deleted' })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
