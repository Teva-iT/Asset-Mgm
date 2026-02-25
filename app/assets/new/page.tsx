import Link from 'next/link'
import AssetForm from '@/components/AssetForm'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { supabase } from '@/lib/supabase'

async function getCurrentUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return null

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        const { payload } = await jwtVerify(token, secret)

        if (typeof payload.userId === 'string') {
            const { data: user } = await supabase
                .from("User")
                .select("UserID, Username, Role")
                .eq("UserID", payload.userId)
                .maybeSingle();

            if (user) {
                return { name: user.Username, role: user.Role, id: user.UserID }
            }
        }
    } catch (e) {
        console.error('Failed to fetch user for asset form', e)
    }
    return null
}

async function getAdmins() {
    try {
        const { data: admins } = await supabase
            .from("User")
            .select("UserID, Username")
            .eq("Role", "ADMIN");

        return (admins || []).map(a => ({ id: a.UserID, name: a.Username }))
    } catch (e) {
        return []
    }
}

export default async function NewAssetPage() {
    const currentUser = await getCurrentUser()
    const admins = await getAdmins()

    return (
        <div className="container">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }}>Create & Assign Asset</h1>
                </div>
                <Link href="/assets" className="btn btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                    Back
                </Link>
            </div>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <AssetForm currentUser={currentUser || undefined} admins={admins} />
            </div>
        </div>
    )
}
