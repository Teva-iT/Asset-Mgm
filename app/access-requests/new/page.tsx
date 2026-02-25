import AccessRequestForm from '@/components/AccessRequestForm'

export default function NewAccessRequestPage() {
    return (
        <div className="container mx-auto p-4 md:p-6 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Access Request</h1>
                <p className="text-gray-500 mt-1">Submit a formal request for IT systems, applications, and folder permissions.</p>
            </div>

            <AccessRequestForm />
        </div>
    )
}
