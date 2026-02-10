import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { identifier, code, newPassword } = await request.json()

        if (!identifier || !code || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { Username: { equals: identifier, mode: 'insensitive' } },
                    { Email: { equals: identifier, mode: 'insensitive' } }
                ]
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify Code
        if (user.ResetCode !== code) {
            return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 })
        }

        // Verify Expiry
        if (!user.ResetCodeExpiry || new Date() > user.ResetCodeExpiry) {
            return NextResponse.json({ error: 'Reset code has expired' }, { status: 400 })
        }

        // Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { UserID: user.UserID },
            data: {
                Password: hashedPassword,
                ResetCode: null,
                ResetCodeExpiry: null
            }
        })

        return NextResponse.json({ message: 'Password reset successfully' })

    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
