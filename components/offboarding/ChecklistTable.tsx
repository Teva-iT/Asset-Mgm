'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, FileText, Download, ExternalLink, MoreHorizontal, FileSpreadsheet, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

interface Employee {
    FirstName: string
    LastName: string
    Email: string
}

interface Checklist {
    ChecklistID: string
    ExitDate: string
    Status: string
    Language: string
    CreatedBy: string
    updatedAt: string
    Employee: Employee
}

interface ChecklistTableProps {
    userRole: string
}

export default function ChecklistTable({ userRole }: ChecklistTableProps) {
    const router = useRouter()
    const [checklists, setChecklists] = useState<Checklist[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const isAdmin = userRole === 'ADMIN'

    useEffect(() => {
        fetchChecklists()
    }, [page, search, statusFilter])

    const fetchChecklists = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: search,
                status: statusFilter === 'All' ? '' : statusFilter
            })
            const res = await fetch(`/api/offboarding?${params}`)
            if (res.ok) {
                const data = await res.json()
                setChecklists(data.data)
                setTotalPages(data.meta.pages)
            }
        } catch (error) {
            console.error('Failed to fetch checklists', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the checklist for ${name}? This action cannot be undone.`)) {
            return
        }

        try {
            const res = await fetch(`/api/offboarding/${id}`, { method: 'DELETE' })
            if (res.ok) {
                // Remove from state
                setChecklists(prev => prev.filter(c => c.ChecklistID !== id))
                alert('Checklist deleted.')
            } else {
                alert('Failed to delete checklist.')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred.')
        }
    }

    const exportExcel = () => {
        const data = checklists.map(c => ({
            Employee: `${c.Employee.FirstName} ${c.Employee.LastName}`,
            ExitDate: new Date(c.ExitDate).toLocaleDateString(),
            Status: c.Status,
            Language: c.Language,
            CreatedBy: c.CreatedBy || '-',
            LastUpdated: new Date(c.updatedAt).toLocaleDateString()
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Offboarding Checklists")
        XLSX.writeFile(wb, "offboarding_checklists.xlsx")
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Austritt Checkliste IT und HR
                    </h1>
                    <p className="text-gray-500 mt-1">
                        IT & HR Offboarding Checklist
                    </p>
                </div>
                <Link
                    href="/offboarding/checklists/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Checklist
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full md:max-w-md">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search employee..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-48">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="All">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exit Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Language
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created By
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Updated
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : checklists.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No checklists found.
                                </td>
                            </tr>
                        ) : (
                            checklists.map((checklist) => (
                                <tr key={checklist.ChecklistID} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="ml-0">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {checklist.Employee.FirstName} {checklist.Employee.LastName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {checklist.Employee.Email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {new Date(checklist.ExitDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${checklist.Status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                checklist.Status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                                                    checklist.Status === 'Sent' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                            {checklist.Status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {checklist.Language}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {checklist.CreatedBy || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(checklist.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/offboarding/checklists/${checklist.ChecklistID}`}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Open"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                            <button
                                                className="text-gray-600 hover:text-gray-900"
                                                title="Export PDF"
                                                onClick={() => window.print()} // Print just this row? No, usually opens preview. Revisit.
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="text-green-600 hover:text-green-900"
                                                title="Export Excel"
                                                onClick={exportExcel}
                                            >
                                                <FileSpreadsheet className="h-4 w-4" />
                                            </button>

                                            {isAdmin && (
                                                <button
                                                    className="text-red-600 hover:text-red-900 ml-2"
                                                    title="Delete"
                                                    onClick={() => handleDelete(checklist.ChecklistID, `${checklist.Employee.FirstName} ${checklist.Employee.LastName}`)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages || 1}</span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    )
}
