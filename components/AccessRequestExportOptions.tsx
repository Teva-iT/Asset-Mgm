'use client'

import * as XLSX from 'xlsx'

export default function AccessRequestExportOptions({ req, items }: { req: any, items: any[] }) {

    const handlePrintPDF = () => {
        window.print()
    }

    const handleExportExcel = () => {
        const hrItems = items.filter((i: any) => i.section_name === 'HR Prerequisites')
        const pmItems = items.filter((i: any) => i.section_name === 'Person Master Data')
        const mbItems = items.filter((i: any) => i.section_name === 'Shared Mailboxes')
        const softwareItems = items.filter((i: any) => i.section_name === 'Enterprise Applications & Software' || i.section_name === 'Software / Application Access')
        const folderItems = items.filter((i: any) => i.section_name === 'File Systems & Communications' || i.section_name === 'Folder / Distribution / Special Access' || i.section_name === 'File Systems & Folders')
        const dlItems = items.filter((i: any) => i.section_name === 'Distribution Lists')
        const roleItems = items.filter((i: any) => i.section_name === 'Software Roles & Ownership')
        const dateItems = items.filter((i: any) => i.section_name === 'Process Control Dates')

        const excelData = [
            // Block 1: Built-in context
            { Section: 'General Request Data', Field: 'Requested By', Values: req.Creator?.Name || '' },
            { Section: 'General Request Data', Field: 'Request Status', Values: req.status },
            { Section: '', Field: '', Values: '' }, // Spacer

            // Block 1A: HR Prerequisites
            ...hrItems.map(item => ({
                Section: 'HR Prerequisites',
                Field: item.field_name,
                Values: item.value
            })),
            { Section: '', Field: '', Values: '' }, // Spacer

            // Block 1B: Person Master Data
            ...pmItems.map(item => ({
                Section: 'Person Master Data',
                Field: item.field_name,
                Values: item.value
            })),
            { Section: '', Field: '', Values: '' }, // Spacer

            // Block 1C: Shared Mailboxes
            ...mbItems.map((item: any) => ({
                Section: 'Shared Mailboxes',
                Field: item.field_name,
                Values: `${item.field_type} ${item.justification ? '- ' + item.justification : ''}`
            })),
            { Section: '', Field: '', Values: '' }, // Spacer

            // Block 2
            ...softwareItems.map(item => ({
                Section: 'Software Data',
                Field: item.field_name,
                Values: item.justification || 'Requested'
            })),
            { Section: '', Field: '', Values: '' }, // Spacer

            // Block 3
            ...folderItems.map((item: any) => ({
                Section: 'Folder/Special Access',
                Field: item.field_name,
                Values: item.justification || 'Requested'
            })),
            { Section: '', Field: '', Values: '' }, // Spacer

            // Block 4
            ...dlItems.map((item: any) => ({
                Section: 'Distribution Lists',
                Field: item.field_name,
                Values: item.value
            })),
            { Section: '', Field: '', Values: '' }, // Spacer

            // Block 5
            ...roleItems.map((item: any) => ({
                Section: 'Software Roles & Ownership',
                Field: item.field_name,
                Values: item.value
            })),
            { Section: '', Field: '', Values: '' }, // Spacer

            // Block 6
            ...dateItems.map((item: any) => ({
                Section: 'Process Control Dates',
                Field: item.field_name,
                Values: item.value
            }))
        ]

        const ws = XLSX.utils.json_to_sheet(excelData)

        // Slightly style the columns
        ws['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 50 }]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Access Request")
        XLSX.writeFile(wb, `Access_Request_${req.Employee?.LastName}_${req.id.substring(0, 8)}.xlsx`)
    }

    return (
        <div className="flex gap-3 mt-4 md:mt-0 print:hidden">
            <button
                onClick={handlePrintPDF}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                PDF View
            </button>
            <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Excel
            </button>
        </div>
    )
}
