import Link from 'next/link'

interface Assignment {
    AssignmentID: string
    Asset: { AssetName: string, SerialNumber: string | null }
    Employee: { FirstName: string, LastName: string }
    AssignedDate: Date
}

export default function RecentActivityList({ assignments }: { assignments: Assignment[] }) {
    if (assignments.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p>No data yet. Your asset activity will appear here once assignments are created.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {assignments.map((assignment) => (
                <div key={assignment.AssignmentID} className="flex flex-wrap items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {assignment.Employee.FirstName[0]}{assignment.Employee.LastName[0]}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                Assigned <span className="font-bold">{assignment.Asset.AssetName}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                                to {assignment.Employee.FirstName} {assignment.Employee.LastName}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">
                            {new Date(assignment.AssignedDate).toLocaleDateString()}
                        </p>
                        <Link href={`/assets/${(assignment as any).AssetID}`} className="text-xs text-blue-600 hover:underline">
                            View Asset
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}
