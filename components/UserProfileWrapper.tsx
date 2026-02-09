import { getCurrentUser } from '@/lib/auth'
import UserProfile from './UserProfile'

import { headers } from 'next/headers'

export default async function UserProfileWrapper() {
    // In Server Components, we can't use usePathname directly, but we can check headers or just rely on client component
    // Actually, simpler to just let UserProfile handle it or pass pathname. 
    // BUT since this is a server component, let's keep it simple. 
    // The previous NavBar change handles the nav links.
    // The Layout renders this wrapper. 
    // Let's modify the Layout to conditionally render this wrapper? No, layout is also server component.
    // Let's check headers for pathname hack or just make this wrapper a client component? 
    // Better: let's modifying UserProfile to hide if pathname is /login (it is client component)

    // WAIT: UserProfile is client component. Let's do it there.
    const user = await getCurrentUser()
    return <UserProfile user={user} />
}
