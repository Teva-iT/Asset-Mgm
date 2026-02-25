import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Define public paths that don't require authentication
    const publicPaths = ['/login', '/api/login', '/api/upload', '/logo.jpg', '/logo.JPG', '/vercel.svg', '/next.svg']

    // Check if the path is public or a static file (images, etc.)
    if (
        publicPaths.some(p => path.startsWith(p)) ||
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.startsWith('/uploads') // Allow public uploads access
    ) {
        return NextResponse.next()
    }

    const token = request.cookies.get('auth_token')?.value

    if (!token) {
        // Redirect to login if no token
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        await jwtVerify(token, secret)
        return NextResponse.next()
    } catch (error) {
        // Redirect to login if token is invalid
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api/routes and /_next/ (internal)
         * 2. /fonts, /images, /favicon.ico (static files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.jpg|.*\\.png|.*\\.svg).*)',
    ],
}
