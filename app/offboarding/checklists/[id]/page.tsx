
import ChecklistForm from '@/components/offboarding/ChecklistForm'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

async function getChecklist(id: string) {
    const { data: checklist } = await supabase
        .from("OffboardingChecklist")
        .select("*, Employee(*)")
        .eq("ChecklistID", id)
        .maybeSingle();

    return checklist
}

async function getEmployees() {
    const { data: employees } = await supabase
        .from("Employee")
        .select("EmployeeID, FirstName, LastName, Department")
        .order("LastName", { ascending: true });

    return employees || [];
}

export default async function EditChecklistPage({ params }: { params: { id: string } }) {
    // Fetch data sequentially to avoid Promise.all issues
    const checklist = await getChecklist(params.id)
    const employees = await getEmployees()

    if (!checklist) {
        notFound()
    }

    // Ensure JSON data is valid (it might be null/unknown from DB)
    // We pass it to the form which will handle defaults if keys are missing

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Offboarding Checklist</h1>
            <ChecklistForm
                initialData={checklist}
                employees={employees}
                isEditMode={true}
            />
        </div>
    )
}
