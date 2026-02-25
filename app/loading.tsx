export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="relative w-12 h-12">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full opacity-50"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <span className="sr-only">Loading...</span>
        </div>
    )
}
