'use client'

import { useEffect, useState } from 'react'

export default function AccessRequestPrintView({ req, items }: { req: any, items: any[] }) {
    const hrItems = items.filter((i: any) => i.section_name === 'HR Prerequisites')
    const pmItems = items.filter((i: any) => i.section_name === 'Person Master Data')
    const mbItems = items.filter((i: any) => i.section_name === 'Shared Mailboxes')
    const softwareItems = items.filter((i: any) => i.section_name === 'Enterprise Applications & Software' || i.section_name === 'Software / Application Access')
    const folderItems = items.filter((i: any) => i.section_name === 'File Systems & Communications' || i.section_name === 'Folder / Distribution / Special Access' || i.section_name === 'File Systems & Folders')
    const dlItems = items.filter((i: any) => i.section_name === 'Distribution Lists')
    const roleItems = items.filter((i: any) => i.section_name === 'Software Roles & Ownership')
    const dateItems = items.filter((i: any) => i.section_name === 'Process Control Dates')

    // Helper to find specific field value
    const getVal = (arr: any[], name: string) => arr.find(i => i.field_name === name)?.value || ''

    return (
        <div className="hidden print:block w-full text-black bg-white p-8 font-sans">
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end relative">
                {/* Watermark based on status */}
                <div className="absolute top-0 right-1/3 opacity-10 pointer-events-none transform -rotate-12 translate-y-12 text-8xl font-black uppercase text-gray-500">
                    {req.status}
                </div>

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold uppercase tracking-wider">IT Access Request Form</h1>
                    <p className="text-sm text-gray-600 mt-1">Digital Snapshot Record</p>
                </div>
                <div className="text-right text-sm relative z-10">
                    <div><strong>Request ID:</strong> {req.id.split('-')[0]}...</div>
                    <div><strong>Status:</strong> {req.status}</div>
                    <div><strong>Date Submitted:</strong> {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : 'Draft'}</div>
                </div>
            </div>

            {/* HR Block */}
            <div className="mb-6">
                <div className="bg-gray-200 p-2 font-bold mb-2 uppercase text-xs">1A. HR – General Prerequisites</div>
                <table className="w-full text-xs border-collapse border border-gray-400">
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Date of Process Start</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(hrItems, 'Date of Process Start')}</td>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Employee Entry Date</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(hrItems, 'Employee Entry Date')}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Type of Hire</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(hrItems, 'Type of Hire')}</td>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Entry Type</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(hrItems, 'Entry Type')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Person Master Block */}
            <div className="mb-6">
                <div className="bg-gray-200 p-2 font-bold mb-2 uppercase text-xs">1B. Person Master Data</div>
                <table className="w-full text-xs border-collapse border border-gray-400">
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Name</td>
                            <td className="border border-gray-400 p-1.5 w-1/4 font-medium">{getVal(pmItems, 'First Name')} {getVal(pmItems, 'Last Name')}</td>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Requested By</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{req.Creator?.Name || '-'}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Entry Date</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(pmItems, 'Entry Date')}</td>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Manager</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(pmItems, 'Manager')}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Contract Status</td>
                            <td className="border border-gray-400 p-1.5 w-1/4 uppercase">{getVal(pmItems, 'Contract Status')}</td>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Contract Duration</td>
                            <td className="border border-gray-400 p-1.5 w-1/4 uppercase">{getVal(pmItems, 'Contract Duration')}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Department</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(pmItems, 'Department')}</td>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Job Title</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(pmItems, 'Job Title')}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Cost Centre</td>
                            <td className="border border-gray-400 p-1.5 w-1/4 font-mono">{getVal(pmItems, 'Cost Centre')}</td>
                            <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Person ID / Short Name</td>
                            <td className="border border-gray-400 p-1.5 w-1/4">{getVal(pmItems, 'Person ID')} / {getVal(pmItems, 'Short Name')}</td>
                        </tr>
                        {getVal(pmItems, 'Sales Rep Address') && (
                            <tr>
                                <td className="border border-gray-400 p-1.5 font-bold w-1/4 bg-gray-50">Sales Rep Address</td>
                                <td colSpan={3} className="border border-gray-400 p-1.5">{getVal(pmItems, 'Sales Rep Address')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Shared Mailboxes Block */}
            <div className="mb-8">
                <div className="bg-gray-200 p-2 font-bold mb-2 uppercase text-xs">1C. Shared Mailboxes</div>
                <table className="w-full text-xs border-collapse border border-gray-400">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="border border-gray-400 p-1.5 w-1/3">Mailbox Address</th>
                            <th className="border border-gray-400 p-1.5 w-1/3">Access Type</th>
                            <th className="border border-gray-400 p-1.5 w-1/3">Justification</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mbItems.length === 0 ? (
                            <tr><td colSpan={3} className="border border-gray-400 p-1.5 text-center text-gray-500 italic">None requested</td></tr>
                        ) : (
                            mbItems.map((mb: any) => (
                                <tr key={mb.id}>
                                    <td className="border border-gray-400 p-1.5 font-semibold font-mono">{mb.field_name}</td>
                                    <td className="border border-gray-400 p-1.5">{mb.field_type}</td>
                                    <td className="border border-gray-400 p-1.5 text-gray-700">{mb.justification || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Block 2 */}
            <div className="mb-8">
                <div className="bg-gray-200 p-2 font-bold mb-4 uppercase">2. Software / Application Access</div>
                <table className="w-full text-sm border-collapse border border-gray-400">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="border border-gray-400 p-2 w-1/3">Application</th>
                            <th className="border border-gray-400 p-2 w-2/3">Justification / Role Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {softwareItems.length === 0 ? (
                            <tr><td colSpan={2} className="border border-gray-400 p-2 text-center text-gray-500 italic">None requested</td></tr>
                        ) : (
                            softwareItems.map(item => {
                                // Split justification if it contains our custom format "Role: X | Note: Y"
                                const parts = item.justification.split(' | ')
                                return (
                                    <tr key={item.id}>
                                        <td className="border border-gray-400 p-2 font-mono text-xs font-semibold">☑ {item.field_name}</td>
                                        <td className="border border-gray-400 p-2 space-y-1">
                                            {parts.map((p: string, idx: number) => (
                                                <div key={idx} className="text-xs">{p}</div>
                                            ))}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Block 3 */}
            <div className="mb-8">
                <div className="bg-gray-200 p-2 font-bold mb-4 uppercase text-xs">3. Folder / Server Access</div>
                <table className="w-full text-xs border-collapse border border-gray-400">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="border border-gray-400 p-2 w-1/3">Access Type</th>
                            <th className="border border-gray-400 p-2 w-2/3">Path / Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {folderItems.length === 0 ? (
                            <tr><td colSpan={2} className="border border-gray-400 p-2 text-center text-gray-500 italic">None requested</td></tr>
                        ) : (
                            folderItems.map(item => {
                                const parts = item.justification ? item.justification.split(' | ') : []
                                return (
                                    <tr key={item.id}>
                                        <td className="border border-gray-400 p-2 font-mono font-semibold">☑ {item.field_name}</td>
                                        <td className="border border-gray-400 p-2 space-y-1">
                                            {parts.map((p: string, idx: number) => (
                                                <div key={idx}>{p}</div>
                                            ))}
                                            {parts.length === 0 && <div>Requested</div>}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Block 4 */}
            <div className="mb-8">
                <div className="bg-gray-200 p-2 font-bold mb-4 uppercase text-xs">4. Public / Personal Distribution Lists</div>
                <table className="w-full text-xs border-collapse border border-gray-400">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="border border-gray-400 p-2 w-full">Distribution List Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dlItems.length === 0 ? (
                            <tr><td className="border border-gray-400 p-2 text-center text-gray-500 italic">None requested</td></tr>
                        ) : (
                            dlItems.map(item => (
                                <tr key={item.id}>
                                    <td className="border border-gray-400 p-2 font-mono font-semibold">
                                        ☑ {item.field_type === 'text' ? `${item.value}` : item.field_name}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Block 5 */}
            {roleItems.length > 0 && (
                <div className="mb-8">
                    <div className="bg-amber-100 p-2 font-bold mb-4 text-amber-900 uppercase text-xs border border-amber-200">5. Software Access – Role / Owner Based</div>
                    <table className="w-full text-xs border-collapse border border-gray-400">
                        <tbody>
                            {roleItems.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="border border-gray-400 p-2 font-semibold w-1/3 bg-gray-50">{item.field_name}</td>
                                    <td className="border border-gray-400 p-2">{item.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Block 6 */}
            {dateItems.length > 0 && (
                <div className="mb-8">
                    <div className="bg-slate-200 p-2 font-bold mb-4 text-slate-900 uppercase text-xs border border-slate-300">6. Process Control / Dates</div>
                    <table className="w-full text-xs border-collapse border border-gray-400">
                        <tbody>
                            {dateItems.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="border border-gray-400 p-2 font-semibold w-1/3 bg-gray-50">{item.field_name}</td>
                                    <td className="border border-gray-400 p-2">{item.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Approvals (Footer) */}
            <div className="mt-12 pt-4 border-t-2 border-gray-300">
                <div className="bg-gray-200 p-2 font-bold mb-4 uppercase text-xs">7. IT Authorization Record</div>
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="border border-gray-400 p-4 rounded bg-gray-50 relative">
                        <div className="font-bold mb-2">Manager Approval</div>
                        <div className="flex gap-2 text-xs mb-1">
                            <span className="text-gray-500 w-16">Approved By:</span>
                            <span className="font-medium border-b border-gray-300 flex-1">{req.approved_at ? (req.Logs.find((l: any) => l.new_status === 'Approved')?.User?.Name || 'System') : ''}</span>
                        </div>
                        <div className="flex gap-2 text-xs mb-1">
                            <span className="text-gray-500 w-16">Date:</span>
                            <span className="font-medium border-b border-gray-300 flex-1">{req.approved_at ? new Date(req.approved_at).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <span className="text-gray-500 w-16">Signature:</span>
                            <span className="font-medium border-b border-gray-300 flex-1 italic text-blue-800 tracking-wider" style={{ fontFamily: 'cursive' }}>
                                {req.approved_at ? 'Electronically Signed' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="border border-gray-400 p-4 rounded bg-gray-50 relative">
                        <div className="font-bold mb-2">IT Execution (Provisioned)</div>
                        <div className="flex gap-2 text-xs mb-1">
                            <span className="text-gray-500 w-16">Executed By:</span>
                            <span className="font-medium border-b border-gray-300 flex-1">{req.finalized_at && req.status === 'Completed' ? (req.Logs.find((l: any) => l.new_status === 'Completed')?.User?.Name || 'System') : ''}</span>
                        </div>
                        <div className="flex gap-2 text-xs mb-1">
                            <span className="text-gray-500 w-16">Date:</span>
                            <span className="font-medium border-b border-gray-300 flex-1">{req.finalized_at && req.status === 'Completed' ? new Date(req.finalized_at).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <span className="text-gray-500 w-16">Signature:</span>
                            <span className="font-medium border-b border-gray-300 flex-1 italic text-blue-800 tracking-wider" style={{ fontFamily: 'cursive' }}>
                                {req.finalized_at && req.status === 'Completed' ? 'Electronically Signed' : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-8 text-center text-xs text-gray-400">
                    Generated automatically from Asset Manager System. Do not sign physically. Electronic approvals are logged in the database audit trail.
                </div>
            </div>
        </div>
    )
}
