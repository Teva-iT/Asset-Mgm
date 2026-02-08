import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from './db'

import { cache } from 'react'

export const getCurrentUser = cache(async () => {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return null

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        const { payload } = await jwtVerify(token, secret)

        // Optional: Fetch full user from DB if we need updated fields (like username changed)
        // For now, payload has userId and role, but let's get the username
        const user = await prisma.user.findUnique({
            where: { UserID: payload.userId as string },
            select: { UserID: true, Username: true, Role: true }
        })

        if (!user) return null

        return {
            userId: user.UserID,
            username: user.Username,
            role: user.Role,
            initials: user.Username.substring(0, 2).toUpperCase()
        }
    } catch (error) {
        return null
    }
})
