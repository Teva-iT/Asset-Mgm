import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import * as jose from 'jose'

// Point 5: Server-side auth guard — redirect to login if not ADMIN
export default async function ADGroupCompareLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    let role: string | null = null

    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
            const { payload } = await jose.jwtVerify(token, secret)
            role = (payload as any).role || null
        } catch { }
    }

    if (!token || role !== 'ADMIN') {
        redirect('/login?reason=unauthorized')
    }

    return <>{children}</>
}
