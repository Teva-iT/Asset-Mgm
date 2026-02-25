
import ChecklistForm from '@/components/offboarding/ChecklistForm'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { validateToken } from '@/lib/offboarding'

// Helper to fetch data safely on server
async function getChecklistFromToken(token: string) {
    const tokenRecord = await validateToken(token)

    if (!tokenRecord) return null

    const { data: checklist } = await supabase
        .from("OffboardingChecklist")
        .select("*, Employee(*)")
        .eq("ChecklistID", tokenRecord.ChecklistID)
        .maybeSingle();

    return checklist
}

interface PageProps {
    params: { token: string }
}

export default async function PublicChecklistPage({ params }: PageProps) {
    const checklist = await getChecklistFromToken(params.token)

    if (!checklist) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Link Expired</h1>
                    <p className="text-gray-600">This offboarding link is invalid or has expired. Please contact your administrator.</p>
                </div>
            </div>
        )
    }

    // Prepare employees array with just the single employee to satisfy prop requirements
    // (Though in public mode, dropdown is read-only anyway)
    const employees = [checklist.Employee]

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-gray-900">Offboarding Checklist</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Please review and complete the sections below regarding your hardware and access returns.
                    </p>
                </div>

                <ChecklistForm
                    initialData={checklist}
                    employees={employees}
                    isPublic={true}
                    token={params.token}
                />
            </div>
        </div>
    )
}
