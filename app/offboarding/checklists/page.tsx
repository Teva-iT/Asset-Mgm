
import { getCurrentUser } from '@/lib/auth'
import ChecklistTable from '@/components/offboarding/ChecklistTable'

export default async function OffboardingChecklistsPage() {
    const user = await getCurrentUser()
    const userRole = user?.role || 'VIEWER'

    return <ChecklistTable userRole={userRole} />
}
