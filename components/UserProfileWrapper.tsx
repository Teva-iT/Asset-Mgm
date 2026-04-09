import { getCurrentUser } from '@/lib/auth'
import UserProfile from './UserProfile'

export default async function UserProfileWrapper({ user: initialUser }: {
    user?: Awaited<ReturnType<typeof getCurrentUser>>
}) {
    const user = initialUser ?? await getCurrentUser()
    return <UserProfile user={user} />
}
