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
            console.log(`Middleware: Unauthorized access to API ${path} (No Token)`)
            return NextResponse.json({ message: 'Unauthorized: No Token' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        await jwtVerify(token, secret)
        return NextResponse.next()
    } catch (err: unknown) {
        if (path.startsWith('/api')) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.log(`Middleware: Unauthorized access to API ${path} (Invalid Token: ${errorMessage})`)
            return NextResponse.json({ message: `Unauthorized: Invalid Token (${errorMessage})` }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
