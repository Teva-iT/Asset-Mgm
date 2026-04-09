import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { supabase } from './supabase'

import { cache } from 'react'

export const getCurrentUser = cache(async () => {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return null

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        const { payload } = await jwtVerify(token, secret)

        const payloadUsername = typeof payload.username === 'string' ? payload.username : null
        const payloadRole = typeof payload.role === 'string' ? payload.role : null
        const payloadInitials = typeof payload.initials === 'string' ? payload.initials : null

        // Fast path: use the JWT payload directly to avoid a DB hit on every navigation.
        if (payload.userId && payloadUsername && payloadRole) {
            return {
                userId: payload.userId as string,
                username: payloadUsername,
                role: payloadRole,
                initials: payloadInitials || payloadUsername.substring(0, 2).toUpperCase()
            }
        }

        // Fallback for older tokens that do not yet carry full profile fields.
        const { data: user } = await supabase
            .from("User")
            .select("UserID, Username, Role")
            .eq("UserID", payload.userId as string)
            .maybeSingle();

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
