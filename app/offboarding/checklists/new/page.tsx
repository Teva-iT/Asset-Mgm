import ChecklistForm from '@/components/offboarding/ChecklistForm'
import { supabase } from '@/lib/supabase'

async function getEmployees() {
    const { data: employees } = await supabase
        .from("Employee")
        .select("EmployeeID, FirstName, LastName, Department")
        .order("LastName", { ascending: true });

    return employees || [];
}

export default async function NewChecklistPage() {
    const employees = await getEmployees()

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">New Offboarding Checklist</h1>
            <ChecklistForm employees={employees} />
        </div>
    )
}
