import { getCurrentUser } from '@/lib/auth'
import UserProfile from './UserProfile'

export default async function UserProfileWrapper() {
    const user = await getCurrentUser()
    return <UserProfile user={user} />
}
