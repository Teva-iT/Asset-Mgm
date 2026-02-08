import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Public paths
    const publicPaths = ['/login', '/api/login', '/_next', '/favicon.ico']
    if (publicPaths.some(p => path.startsWith(p))) {
        return NextResponse.next()
    }

    // Check auth cookie
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
        if (path.startsWith('/api')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        await jwtVerify(token, secret)
        return NextResponse.next()
    } catch (err) {
        if (path.startsWith('/api')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
