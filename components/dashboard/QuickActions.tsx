import Link from 'next/link'

export default function QuickActions() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/assets/new" className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors group text-decoration-none">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Create & Assign Asset</h3>
                    <p className="text-sm text-gray-600">Add a new asset and assign it immediately.</p>
                </div>
            </Link>

            <Link href="/employees" className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors group text-decoration-none">
                <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Import Employees</h3>
                    <p className="text-sm text-gray-600">Bulk add employees via Excel/CSV.</p>
                </div>
            </Link>

            <Link href="/admin/users" className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors group text-decoration-none">
                <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-600">Create or edit system users.</p>
                </div>
            </Link>
        </div>
    )
}
