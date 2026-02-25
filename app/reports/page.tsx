
import EnterpriseReport from '@/components/reports/EnterpriseReport'

export const dynamic = 'force-dynamic'

export default function ReportsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Enterprise Reports</h1>
                <p className="text-gray-500 mt-1">Real-time insights and risk analysis.</p>
            </div>

            <EnterpriseReport />
        </div>
    )
}
