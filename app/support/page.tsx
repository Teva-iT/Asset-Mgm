import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Support - Asset Manager',
    description: 'IT Support & Contact Information',
}

export default function SupportPage() {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-6">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">IT Support & Contact</h1>
                <p className="text-gray-500 text-lg">
                    For technical issues, system access, or asset-related support, please contact IT.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Main Contact Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            IT Administrator
                        </h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Contact Person</p>
                            <p className="text-xl font-bold text-gray-900">Mahan Zartoshti</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-blue-50 p-2 rounded-lg text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Email</p>
                                    <a href="mailto:mahan.zadeghi@tevapharma.ch" className="text-blue-600 hover:text-blue-800 transition-colors">mahan.zadeghi@tevapharma.ch</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Microsoft Teams</p>
                                    <p className="text-gray-600">Available via internal Teams<br /><span className="text-xs text-gray-400">(search: Mahan Zartoshti)</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Info & Scope */}
                <div className="space-y-8">
                    {/* Working Hours */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            Working Hours
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Monday – Friday</span>
                                <span className="font-medium text-gray-900">08:00 – 17:00 (CET)</span>
                            </div>
                            <p className="text-xs text-gray-400 pt-2 border-t border-gray-50 mt-3">
                                Requests outside working hours will be handled on the next business day.
                            </p>
                        </div>
                    </div>

                    {/* Scope */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            You can contact IT for:
                        </h3>
                        <ul className="space-y-2">
                            {[
                                "Access issues (login, permissions)",
                                "Asset assignment or return issues",
                                "Incorrect data in the system",
                                "System errors or unexpected behavior",
                                "General IT-related questions"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Urgent */}
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <h4 className="text-red-800 font-semibold text-sm mb-1 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            Urgent Issues
                        </h4>
                        <p className="text-xs text-red-600 leading-relaxed">
                            For critical system outages during working hours, please contact IT via phone or Teams immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
