'use client'

import { useState, useEffect } from 'react'
import { Save, Send, FileText, FileSpreadsheet, CheckCircle, ArrowLeft, Copy, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import ModernDatePicker from '../ModernDatePicker'
import EmployeeAutocomplete from '../EmployeeAutocomplete'

// Interface for the structured JSON data
export interface ChecklistData {
    employeeInfo: {
        costCenter: string
        personnelNumber: string
        workplaceNumber: string
        deskType: string
        supervisor: string
        lastWorkingDay: string
    }
    itHrProcess: {
        oracleDone: boolean
        removeFromEmail: boolean
        emailGroups: string
    }
    hardwareReturn: {
        desktop: { qty: number, returned: boolean, note: string }
        notebook14: { qty: number, returned: boolean, note: string }
        notebook12: { qty: number, returned: boolean, note: string }
        iphone: { qty: number, returned: boolean, note: string }
        mobileTakeover: { takeover: boolean, successor: string }
    }
    homeOfficeReturn: {
        monitor: { returned: boolean, note: string }
        keyboard: { returned: boolean, note: string }
        mouse: { returned: boolean, note: string }
        docking: { returned: boolean, note: string }
        camera: { returned: boolean, note: string }
        printer: { returned: boolean, note: string }
        headset: { returned: boolean, note: string }
    }
    accessRemoval: {
        software: string[]
        systems: string[]
    }
    signOff: {
        hr: { name: string, date: string, signature: string }
        it: { name: string, date: string, signature: string }
    }
}

// Default initial state
const initialChecklistData: ChecklistData = {
    employeeInfo: { costCenter: '', personnelNumber: '', workplaceNumber: '', deskType: 'Flex', supervisor: '', lastWorkingDay: '' },
    itHrProcess: { oracleDone: false, removeFromEmail: false, emailGroups: '' },
    hardwareReturn: {
        desktop: { qty: 0, returned: false, note: '' },
        notebook14: { qty: 0, returned: false, note: '' },
        notebook12: { qty: 0, returned: false, note: '' },
        iphone: { qty: 0, returned: false, note: '' },
        mobileTakeover: { takeover: false, successor: '' }
    },
    homeOfficeReturn: {
        monitor: { returned: false, note: 'e.g., 2 screens' },
        keyboard: { returned: false, note: '' },
        mouse: { returned: false, note: '' },
        docking: { returned: false, note: '' },
        camera: { returned: false, note: '' },
        printer: { returned: false, note: '' },
        headset: { returned: false, note: 'Büro Basel' }
    },
    accessRemoval: { software: [], systems: [] },
    signOff: {
        hr: { name: '', date: '', signature: '' },
        it: { name: '', date: '', signature: '' }
    }
}

interface ChecklistFormProps {
    initialData?: any // Full DB object if editing
    employees?: any[]
    isEditMode?: boolean
    isPublic?: boolean
    token?: string // For public submission
    userRole?: string // ADMIN, HR, IT, VIEWER
}

export default function ChecklistForm({ initialData, employees = [], isEditMode = false, isPublic = false, token, userRole = 'VIEWER' }: ChecklistFormProps) {
    const router = useRouter()

    // Core fields
    const [employeeId, setEmployeeId] = useState(initialData?.EmployeeID || '')
    const [exitDate, setExitDate] = useState(initialData?.ExitDate ? new Date(initialData.ExitDate).toISOString().split('T')[0] : '')
    const [status, setStatus] = useState(initialData?.Status || 'Draft')

    // JSON Data fields
    const [data, setData] = useState<ChecklistData>(initialData?.ChecklistData || initialChecklistData)
    const [saving, setSaving] = useState(false)
    const [generatedLink, setGeneratedLink] = useState('')

    // Read-only logic
    const isCompleted = status === 'Completed'
    const isAdmin = userRole === 'ADMIN'
    const isHR = userRole === 'HR' || isAdmin
    const isIT = userRole === 'IT' || isAdmin

    // Permission Calculation
    // Public User: Can edit Hardware, Home Office, Return Software. Cannot edit Info, IT/HR Process, Sign-off.
    // Internal: Based on userRole.

    // Employee Info: Admin/HR can edit. IT can read.
    const canEditInfo = !isPublic && (isAdmin || (!isCompleted && (isHR || !isEditMode)))

    // IT/HR Process: 
    // Oracle -> HR? 
    // Email -> IT?
    const canEditOracle = !isPublic && (isAdmin || (!isCompleted && isHR))
    const canEditEmail = !isPublic && (isAdmin || (!isCompleted && isIT))

    // Hardware: Public (Employee) or IT/Admin
    const canEditHardware = isAdmin || (!isCompleted && (isPublic || isIT))

    // System Access: 
    // Software licenses -> Public/IT/Admin
    const canEditSoftware = isAdmin || (!isCompleted && (isPublic || isIT))
    // Systems removal -> IT/Admin
    const canEditSystems = !isPublic && (isAdmin || (!isCompleted && isIT))

    // Sign-off
    const canEditHRSign = !isPublic && (isAdmin || (!isCompleted && isHR))
    const canEditITSign = !isPublic && (isAdmin || (!isCompleted && isIT))


    // Helper to update deeply nested state
    const updateData = (section: keyof ChecklistData, field: string, value: any, nestedField?: string) => {
        // Basic lock
        if (isCompleted && !isAdmin) return

        setData(prev => {
            const sectionData = { ...prev[section] } as any
            if (nestedField) {
                sectionData[field] = { ...sectionData[field], [nestedField]: value }
            } else {
                sectionData[field] = value
            }
            return { ...prev, [section]: sectionData }
        })
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setSaving(true)

        try {
            if (isPublic && token) {
                // Public Submission via API
                const res = await fetch(`/api/offboarding/public/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checklistData: data })
                })

                if (res.ok) {
                    alert('Checklist submitted successfully! You can close this window.')
                    setStatus('Submitted')
                } else {
                    const err = await res.json()
                    alert('Submission failed: ' + err.error)
                }
            } else {
                // Interior Submission
                const payload = {
                    employeeId,
                    exitDate,
                    status,
                    checklistData: data,
                    language: 'EN'
                }

                const url = isEditMode && initialData?.ChecklistID
                    ? `/api/offboarding/${initialData.ChecklistID}`
                    : '/api/offboarding'
                const method = isEditMode ? 'PUT' : 'POST'

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (res.ok) {
                    router.push('/offboarding/checklists')
                    router.refresh()
                } else {
                    alert('Failed to save checklist')
                }
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred')
        } finally {
            setSaving(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleGenerateLink = async () => {
        if (!isEditMode || !initialData.ChecklistID) {
            alert('Please save the checklist first.')
            return
        }

        try {
            const res = await fetch(`/api/offboarding/${initialData.ChecklistID}/token`, {
                method: 'POST'
            })
            const json = await res.json()

            if (res.ok) {
                await navigator.clipboard.writeText(json.url)
                setGeneratedLink(json.url)
                alert(`Secure Link Generated & Copied to Clipboard!\n\n${json.url}`)
                if (status === 'Draft') setStatus('Sent')
            } else {
                alert('Failed to generate link: ' + json.error)
            }
        } catch (err) {
            console.error('Failed to generate link: ', err)
        }
    }

    const handleExportExcel = () => {
        const flatData = {
            EmployeeID: employeeId,
            ExitDate: exitDate,
            Status: status,
            CostCenter: data.employeeInfo.costCenter,
            PersonnelNumber: data.employeeInfo.personnelNumber,
            WorkplaceNumber: data.employeeInfo.workplaceNumber,
            DeskType: data.employeeInfo.deskType,
            Supervisor: data.employeeInfo.supervisor,
            LastWorkingDay: data.employeeInfo.lastWorkingDay,
            OracleDone: data.itHrProcess.oracleDone,
            RemoveFromEmail: data.itHrProcess.removeFromEmail,
            EmailGroups: data.itHrProcess.emailGroups,
            Desktop_Qty: data.hardwareReturn.desktop.qty,
            Desktop_Returned: data.hardwareReturn.desktop.returned,
            Notebook14_Qty: data.hardwareReturn.notebook14.qty,
            Notebook14_Returned: data.hardwareReturn.notebook14.returned,
            Mobile_Takeover: data.hardwareReturn.mobileTakeover.takeover,
            Software_Removal: data.accessRemoval.software.join(', '),
            Systems_Removal: data.accessRemoval.systems.join(', '),
            SignOff_HR_Name: data.signOff.hr.name,
            SignOff_IT_Name: data.signOff.it.name
        }

        const ws = XLSX.utils.json_to_sheet([flatData])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Checklist")
        const fileName = `Offboarding_${employeeId || 'New'}.xlsx`
        XLSX.writeFile(wb, fileName)
    }

    // --- Sub-components for Cards ---

    const CardHeader = ({ en, de }: { en: string, de: string }) => (
        <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{en}</h3>
            <p className="mt-1 text-sm text-gray-500">{de}</p>
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-12 print:space-y-4 print:pb-0">

            <div className="flex items-center justify-between print:hidden">
                {!isPublic && (
                    <Link href="/offboarding/checklists" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back to List
                    </Link>
                )}
                {isPublic && <div className="text-sm text-gray-500">Secure Employee View</div>}

                <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                        ${status === 'Completed' ? 'bg-green-100 text-green-800' :
                            status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                                status === 'Sent' ? 'bg-yellow-100 text-yellow-800' :
                                    status === 'IT_Signed' ? 'bg-purple-100 text-purple-800' :
                                        status === 'HR_Signed' ? 'bg-pink-100 text-pink-800' :
                                            'bg-gray-100 text-gray-800'}`}>
                        {status?.toUpperCase()}
                    </span>

                    {!isPublic && !isCompleted && (
                        <button type="button" onClick={() => handleSubmit()} disabled={saving} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Save className="w-4 h-4 mr-2" /> Save Draft
                        </button>
                    )}

                    {isPublic && (
                        <button type="submit" disabled={saving || status === 'Submitted' || isCompleted} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400">
                            {saving ? 'Submitting...' : 'Submit Checklist'}
                        </button>
                    )}
                </div>
            </div>

            {/* Card 1: Employee & Dates */}
            <div className={`bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none ${isPublic ? 'opacity-90' : ''}`}>
                <CardHeader en="Employee Information" de="Mitarbeiterdaten" />
                <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee / Mitarbeiter *</label>
                        <EmployeeAutocomplete
                            disabled={!canEditInfo}
                            defaultEmployee={employees.find(e => e.EmployeeID === employeeId)}
                            onSelect={(emp: any) => setEmployeeId(emp ? emp.EmployeeID : '')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exit Date / Austrittsdatum *</label>
                            <ModernDatePicker
                                required
                                disabled={!canEditInfo}
                                className="w-full"
                                value={exitDate} onChange={(e: any) => setExitDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Day / Letzter Arbeitstag</label>
                            <ModernDatePicker
                                disabled={!canEditInfo}
                                className="w-full"
                                value={data.employeeInfo.lastWorkingDay}
                                onChange={(e: any) => updateData('employeeInfo', 'lastWorkingDay', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost Center / Kostenstelle</label>
                        <input type="text" disabled={!canEditInfo} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100"
                            value={data.employeeInfo.costCenter} onChange={e => updateData('employeeInfo', 'costCenter', e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Personnel No / Personalnummer</label>
                        <input type="text" disabled={!canEditInfo} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100"
                            value={data.employeeInfo.personnelNumber} onChange={e => updateData('employeeInfo', 'personnelNumber', e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Workplace / Arbeitsplatznummer</label>
                        <input type="text" disabled={!canEditInfo} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100"
                            value={data.employeeInfo.workplaceNumber} onChange={e => updateData('employeeInfo', 'workplaceNumber', e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Desk Type / Arbeitsplatz</label>
                        <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100"
                            disabled={!canEditInfo}
                            value={data.employeeInfo.deskType} onChange={e => updateData('employeeInfo', 'deskType', e.target.value)}>
                            <option value="Flex">Flex Desk</option>
                            <option value="Fixed">Fixed Desk</option>
                            <option value="Remote">Remote</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Card 2: IT/HR Process */}
            {!isPublic && (
                <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none">
                    <CardHeader en="IT/HR Process" de="Prozess IT/HR" />
                    <div className="px-6 py-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="oracle" className="h-4 w-4 text-blue-600 border-gray-300 rounded disabled:bg-gray-100"
                                disabled={!canEditOracle}
                                checked={data.itHrProcess.oracleDone}
                                onChange={e => updateData('itHrProcess', 'oracleDone', e.target.checked)} />
                            <label htmlFor="oracle" className="text-sm text-gray-900">
                                Offboarding in Oracle/EC done / Mitarbeiteraustritt im Oracle/EC
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="email" className="h-4 w-4 text-blue-600 border-gray-300 rounded disabled:bg-gray-100"
                                disabled={!canEditEmail}
                                checked={data.itHrProcess.removeFromEmail}
                                onChange={e => updateData('itHrProcess', 'removeFromEmail', e.target.checked)} />
                            <label htmlFor="email" className="text-sm text-gray-900">
                                Remove from email groups / E-Mail: aus Gruppe entfernen
                            </label>
                        </div>
                        <div className="pl-7">
                            <textarea placeholder="Group1; Group2..." className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm border p-2 text-sm disabled:bg-gray-100"
                                disabled={!canEditEmail}
                                value={data.itHrProcess.emailGroups}
                                onChange={e => updateData('itHrProcess', 'emailGroups', e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Card 3: Company Hardware */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none">
                <CardHeader en="Return Hardware (Company)" de="Rückgabe Hardware" />
                <div className="px-6 py-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Returned</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {[
                                { key: 'desktop', label: 'Desktop / Monitor' },
                                { key: 'notebook14', label: 'Notebook (14")' },
                                { key: 'notebook12', label: 'Notebook small (12.5")' },
                                { key: 'iphone', label: 'iPhone' },
                            ].map((row) => (
                                <tr key={row.key}>
                                    <td className="px-3 py-3 text-sm text-gray-900">{row.label}</td>
                                    <td className="px-3 py-3">
                                        <input type="number" min="0" className="w-16 border rounded p-1 text-sm disabled:bg-gray-100"
                                            disabled={!canEditHardware}
                                            value={(data.hardwareReturn as any)[row.key].qty}
                                            onChange={e => updateData('hardwareReturn', row.key, parseInt(e.target.value) || 0, 'qty')} />
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <input type="checkbox" className="h-4 w-4 text-blue-600 rounded disabled:bg-gray-100"
                                            disabled={!canEditHardware}
                                            checked={(data.hardwareReturn as any)[row.key].returned}
                                            onChange={e => updateData('hardwareReturn', row.key, e.target.checked, 'returned')} />
                                    </td>
                                    <td className="px-3 py-3">
                                        <input type="text" className="w-full border rounded p-1 text-sm disabled:bg-gray-100"
                                            disabled={!canEditHardware}
                                            value={(data.hardwareReturn as any)[row.key].note}
                                            onChange={e => updateData('hardwareReturn', row.key, e.target.value, 'note')} />
                                    </td>
                                </tr>
                            ))}

                            {/* Mobile Takeover Special Row */}
                            <tr>
                                <td className="px-3 py-3 text-sm text-gray-900">Mobile number takeover? / Mobile Nr. Übernehmen?</td>
                                <td className="px-3 py-3 text-center bg-gray-50 text-gray-400">-</td>
                                <td className="px-3 py-3 text-center">
                                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded disabled:bg-gray-100"
                                        disabled={!canEditHardware}
                                        checked={data.hardwareReturn.mobileTakeover.takeover}
                                        onChange={e => updateData('hardwareReturn', 'mobileTakeover', e.target.checked, 'takeover')} />
                                </td>
                                <td className="px-3 py-3">
                                    <input type="text" placeholder="Successor / Nachfolge..." className="w-full border rounded p-1 text-sm disabled:bg-gray-100"
                                        disabled={!canEditHardware}
                                        value={data.hardwareReturn.mobileTakeover.successor}
                                        onChange={e => updateData('hardwareReturn', 'mobileTakeover', e.target.value, 'successor')} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Card 4: Home Office Hardware */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none">
                <CardHeader en="Return Hardware (Home Office)" de="Rückgabe Hardware aus Home Office" />
                <div className="px-6 py-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Returned</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {[
                                { key: 'monitor', label: 'Monitor / Bildschirm' },
                                { key: 'keyboard', label: 'Keyboard / Tastatur' },
                                { key: 'mouse', label: 'Mouse / Maus' },
                                { key: 'docking', label: 'Docking station' },
                                { key: 'camera', label: 'Camera / Kamera' },
                                { key: 'printer', label: 'Printer / Drucker' },
                                { key: 'headset', label: 'Headset' },
                            ].map((row) => (
                                <tr key={row.key}>
                                    <td className="px-3 py-3 text-sm text-gray-900">{row.label}</td>
                                    <td className="px-3 py-3 text-center">
                                        <input type="checkbox" className="h-4 w-4 text-blue-600 rounded disabled:bg-gray-100"
                                            disabled={!canEditHardware}
                                            checked={(data.homeOfficeReturn as any)[row.key].returned}
                                            onChange={e => updateData('homeOfficeReturn', row.key, e.target.checked, 'returned')} />
                                    </td>
                                    <td className="px-3 py-3">
                                        <input type="text" className="w-full border rounded p-1 text-sm disabled:bg-gray-100"
                                            disabled={!canEditHardware}
                                            value={(data.homeOfficeReturn as any)[row.key].note}
                                            onChange={e => updateData('homeOfficeReturn', row.key, e.target.value, 'note')} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Card 5: Software & Access */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Software & Access</h3>
                        <p className="mt-1 text-sm text-gray-500">Lizenzen & Berechtigungen</p>
                    </div>
                </div>
                <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Section A -> Software Licenses (Employee/IT) */}
                    <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-3">Return Software Licenses</h4>
                        <div className="space-y-2">
                            {['Snagit 10', 'Acrobat Professional', 'Microsoft Visio'].map(item => (
                                <label key={item} className="flex items-center gap-2">
                                    <input type="checkbox" className="h-4 w-4 disabled:bg-gray-100"
                                        disabled={!canEditSoftware}
                                        checked={data.accessRemoval.software.includes(item)}
                                        onChange={e => {
                                            const newSet = e.target.checked
                                                ? [...data.accessRemoval.software, item]
                                                : data.accessRemoval.software.filter(i => i !== item)
                                            setData(p => ({ ...p, accessRemoval: { ...p.accessRemoval, software: newSet } }))
                                        }} />
                                    <span className="text-sm text-gray-700">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Section B -> Systems (IT Only) */}
                    <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-3">Remove Permissions / Systems</h4>
                        <div className="space-y-2">
                            {['Der schlafende Hase', 'SAP R/3 N20', 'DocuBridge', 'Sales Navigator', 'SAP BW', 'SAP P01'].map(item => (
                                <label key={item} className="flex items-center gap-2">
                                    <input type="checkbox" className="h-4 w-4 disabled:bg-gray-100"
                                        disabled={!canEditSystems}
                                        checked={data.accessRemoval.systems.includes(item)}
                                        onChange={e => {
                                            const newSet = e.target.checked
                                                ? [...data.accessRemoval.systems, item]
                                                : data.accessRemoval.systems.filter(i => i !== item)
                                            setData(p => ({ ...p, accessRemoval: { ...p.accessRemoval, systems: newSet } }))
                                        }} />
                                    <span className="text-sm text-gray-700">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 6: Sign-off */}
            {!isPublic && (
                <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none">
                    <CardHeader en="Sign-off" de="Visum / Unterschrift" />
                    <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* HR Column */}
                        <div className="bg-gray-50 p-4 rounded border">
                            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">HR</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Name</label>
                                    <input type="text" className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-1 disabled:bg-gray-100"
                                        disabled={!canEditHRSign}
                                        value={data.signOff.hr.name} onChange={e => updateData('signOff', 'hr', e.target.value, 'name')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                    <ModernDatePicker
                                        disabled={!canEditHRSign}
                                        value={data.signOff.hr.date} onChange={(e: any) => updateData('signOff', 'hr', e.target.value, 'date')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Signature</label>
                                    <input type="text" placeholder="(Typed)" className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-1 italic bg-white disabled:bg-gray-100"
                                        disabled={!canEditHRSign}
                                        value={data.signOff.hr.signature} onChange={e => updateData('signOff', 'hr', e.target.value, 'signature')} />
                                </div>
                            </div>
                        </div>

                        {/* IT Column */}
                        <div className="bg-gray-50 p-4 rounded border">
                            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">IT</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Name</label>
                                    <input type="text" className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-1 disabled:bg-gray-100"
                                        disabled={!canEditITSign}
                                        value={data.signOff.it.name} onChange={e => updateData('signOff', 'it', e.target.value, 'name')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                    <ModernDatePicker
                                        disabled={!canEditITSign}
                                        value={data.signOff.it.date} onChange={(e: any) => updateData('signOff', 'it', e.target.value, 'date')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Signature</label>
                                    <input type="text" placeholder="(Typed)" className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-1 italic bg-white disabled:bg-gray-100"
                                        disabled={!canEditITSign}
                                        value={data.signOff.it.signature} onChange={e => updateData('signOff', 'it', e.target.value, 'signature')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center py-6 print:hidden">
                <div className="text-sm text-gray-500">
                    <p>Created by: {initialData?.CreatedBy || 'Me'}</p>
                </div>
                {!isPublic && (
                    <div className="flex gap-3">
                        <button type="button" onClick={() => handleSubmit()} disabled={saving || isCompleted && !isAdmin} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Draft
                        </button>
                        {!isCompleted && isAdmin && (
                            <button type="button" onClick={handleGenerateLink} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                                <Send className="w-4 h-4" /> Send Link
                            </button>
                        )}
                        <button type="button" onClick={handlePrint} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> PDF
                        </button>
                        <button type="button" onClick={handleExportExcel} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> Excel
                        </button>
                    </div>
                )}
            </div>

        </form>
    )
}
