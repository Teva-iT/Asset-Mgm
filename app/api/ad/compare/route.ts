import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import * as jose from 'jose'
import { searchADUsers } from '@/lib/ad'

// --- Canonical username extraction ---
// Handles: jdoe | DOMAIN\jdoe | jdoe@corp.local → always "jdoe"
function canonicalize(username: string): string {
    let u = username.trim().toLowerCase()
    // Strip NetBIOS domain prefix: DOMAIN\user → user
    if (u.includes('\\')) u = u.split('\\').pop()!
    // Strip UPN suffix: user@domain.com → user
    if (u.includes('@')) u = u.split('@')[0]
    return u
}

// --- In-memory cache: NORMALIZED canonical username → { data, ts } ---
const adCache = new Map<string, { data: any; ts: number }>()
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

async function getCachedUser(username: string) {
    // Always normalize to canonical form before touching cache
    const key = canonicalize(username)
    const cached = adCache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data

    const results = await searchADUsers(username)
    const user = results.find(u => canonicalize(u.username) === key) || results[0] || null
    if (user) adCache.set(key, { data: user, ts: Date.now() })
    return user
}

function parseCN(dn: string): string {
    // "CN=VPN-Users,OU=Groups,DC=example,DC=com" → "VPN-Users"
    const match = dn.match(/^CN=([^,]+)/i)
    return match ? match[1] : dn
}

export async function POST(request: NextRequest) {
    try {
        // Auth check — ADMIN only
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value
        let currentUser: any = null
        if (token) {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
            try {
                const { payload } = await jose.jwtVerify(token, secret)
                currentUser = payload
            } catch { }
        }
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'IT_SUPPORT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { referenceUsername, targetUsername } = await request.json()
        if (!referenceUsername || !targetUsername) {
            return NextResponse.json({ error: 'Both referenceUsername and targetUsername are required' }, { status: 400 })
        }

        // Parallel AD fetch
        const [refUser, tgtUser] = await Promise.all([
            getCachedUser(referenceUsername),
            getCachedUser(targetUsername),
        ])

        if (!refUser) return NextResponse.json({ error: `User "${referenceUsername}" not found in AD` }, { status: 404 })
        if (!tgtUser) return NextResponse.json({ error: `User "${targetUsername}" not found in AD` }, { status: 404 })

        const refGroups: string[] = refUser.groups || []
        const tgtGroups: string[] = tgtUser.groups || []

        // Normalize DNs to lowercase for set comparison (AD is case-insensitive)
        const refSet = new Set(refGroups.map(g => g.toLowerCase()))
        const tgtSet = new Set(tgtGroups.map(g => g.toLowerCase()))

        const shared = refGroups.filter(g => tgtSet.has(g.toLowerCase()))
        const missingInTarget = refGroups.filter(g => !tgtSet.has(g.toLowerCase()))
        const extraInTarget = tgtGroups.filter(g => !refSet.has(g.toLowerCase()))

        return NextResponse.json({
            referenceUser: { username: refUser.username, displayName: refUser.displayName, dn: refUser.dn || refUser.username },
            targetUser: { username: tgtUser.username, displayName: tgtUser.displayName, dn: tgtUser.dn || tgtUser.username },
            referenceGroups: refGroups,
            targetGroups: tgtGroups,
            shared: shared.map(g => ({ dn: g, cn: parseCN(g) })),
            missingInTarget: missingInTarget.map(g => ({ dn: g, cn: parseCN(g) })),
            extraInTarget: extraInTarget.map(g => ({ dn: g, cn: parseCN(g) })),
        })
    } catch (error: any) {
        console.error('/api/ad/compare error:', error)
        return NextResponse.json({ error: error.message || 'Compare failed' }, { status: 500 })
    }
}
