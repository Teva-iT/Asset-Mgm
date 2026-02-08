export default function AssetsLoading() {
    return (
        <div className="container">
            <div className="header mb-8">
                <div>
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="flex gap-4">
                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="card mb-6 p-6 flex gap-4">
                <div className="h-10 flex-grow bg-gray-100 rounded animate-pulse"></div>
                <div className="h-10 w-40 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-10 w-40 bg-gray-100 rounded animate-pulse"></div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="h-12 bg-gray-50 border-b border-gray-100"></div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 border-b border-gray-50 flex items-center px-6 gap-4">
                        <div className="h-6 w-20 bg-gray-100 rounded animate-pulse"></div>
                        <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
                        <div className="h-6 w-24 bg-gray-100 rounded animate-pulse"></div>
                        <div className="h-6 flex-grow bg-gray-100 rounded animate-pulse"></div>
                    </div>
                ))}
            </div>
        </div>
    )
}
