import { NextResponse } from 'next/server'
import { searchADUsers } from '@/lib/ad'
import { cookies } from 'next/headers'
import * as jose from 'jose'

export async function GET(request: Request) {
    try {
        // --- Auth Check ---
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value
        let currentUser: any = null

        if (token) {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
            try {
                const { payload } = await jose.jwtVerify(token, secret)
                currentUser = payload as any
            } catch (e) { }
        }

        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')

        if (!q || q.length < 2) {
            return NextResponse.json({ users: [] })
        }

        const users = await searchADUsers(q)

        return NextResponse.json({ users })
    } catch (error: any) {
        console.error('API /ad/users/search error:', error)
        return NextResponse.json({ error: error.message || 'Error searching AD' }, { status: 500 })
    }
}
