
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import EmployeeImportModal from './EmployeeImportModal'

interface EmployeeForExport {
    FirstName: string
    LastName: string
    Email: string
    Department: string
    Status: string
    StartDate: Date | string
    _count: { assignments: number }
}

export default function EmployeePageActions({ employees = [] }: { employees?: EmployeeForExport[] }) {
    const [isImportOpen, setIsImportOpen] = useState(false)
    const router = useRouter()

    const handleExport = () => {
        const dataToExport = employees.map(emp => ({
            'First Name': emp.FirstName,
            'Last Name': emp.LastName,
            'Email': emp.Email,
            'Department': emp.Department,
            'Status': emp.Status,
            'Start Date': new Date(emp.StartDate).toLocaleDateString(),
            'Assigned Assets': emp._count.assignments
        }))

        const worksheet = XLSX.utils.json_to_sheet(dataToExport)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Employees")
        XLSX.writeFile(workbook, "Employees_Export.xlsx")
    }

    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button
                onClick={handleExport}
                className="btn btn-outline"
                style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export to Excel
            </button>
            <button
                onClick={() => setIsImportOpen(true)}
                className="btn btn-outline"
                style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Import from Excel
            </button>
            <Link href="/employees/new" className="btn btn-primary">
                + Add Employee
            </Link>

            <EmployeeImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={() => {
                    setIsImportOpen(false)
                    router.refresh()
                }}
            />
        </div>
    )
}
