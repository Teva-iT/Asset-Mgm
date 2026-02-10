import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { username, oldPassword, newPassword } = await request.json()

        if (!username || !oldPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { Username: username }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify Old Password
        const isValid = await bcrypt.compare(oldPassword, user.Password)
        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect old password' }, { status: 401 })
        }

        // Update to New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { UserID: user.UserID },
            data: { Password: hashedPassword }
        })

        return NextResponse.json({ message: 'Password changed successfully' })

    } catch (error) {
        console.error('Change password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
