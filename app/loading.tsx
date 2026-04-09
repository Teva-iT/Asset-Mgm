export default function GlobalLoading() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-24 rounded-xl border border-gray-200 bg-white" />
                ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
                <div className="h-10 rounded-lg bg-gray-100" />
                <div className="flex flex-wrap gap-3">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="h-10 w-40 rounded-lg bg-gray-100" />
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="h-12 border-b border-gray-200 bg-gray-50" />
                <div className="space-y-3 p-4">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="h-14 rounded-lg bg-gray-100" />
                    ))}
                </div>
            </div>
        </div>
    )
}
