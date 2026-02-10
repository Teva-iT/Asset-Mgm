import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// Helper to log code for simulation
function logCode(email: string, code: string) {
    const timestamp = new Date().toISOString()
    const message = `[EMAIL SIMULATION] To: ${email} | Code: ${code}`
    console.log(message)

    try {
        const logPath = path.join(process.cwd(), 'server_debug.log')
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`)
    } catch (e) {
        console.error('Failed to write to log file', e)
    }
}

export async function POST(request: Request) {
    try {
        const { identifier } = await request.json() // Can be username or email

        if (!identifier) {
            return NextResponse.json({ error: 'Username or Email is required' }, { status: 400 })
        }

        // Find user by Username OR Email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { Username: { equals: identifier, mode: 'insensitive' } },
                    { Email: { equals: identifier, mode: 'insensitive' } }
                ]
            }
        })

        if (!user) {
            // Security: Don't reveal if user exists or not, but for internal app it's often OK.
            // Let's return generic success to avoid enumeration if desired, 
            // but for this specific request "it should send code", let's be explicit if it fails for now to help testing.
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        // Save to DB
        await prisma.user.update({
            where: { UserID: user.UserID },
            data: {
                ResetCode: code,
                ResetCodeExpiry: expiry
            }
        })

        // "Send" Email (Simulate)
        logCode(user.Email || user.Username, code)

        return NextResponse.json({
            message: 'Reset code sent',
            debug: 'Check server console for code'
        })

    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
