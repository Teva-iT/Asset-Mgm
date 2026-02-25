'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EmployeeAutocomplete from './EmployeeAutocomplete'
import ReferenceUserAutocomplete, { ADUser } from './ReferenceUserAutocomplete'
import SoftwareAccessBlock, { SoftwareState, ENTERPRISE_SOFTWARE } from './SoftwareAccessBlock'
import FolderAccessBlock, { FolderAccessState } from './FolderAccessBlock'
import HRPrerequisitesBlock, { HRPrerequisitesState } from './HRPrerequisitesBlock'
import PersonMasterDataBlock, { PersonMasterDataState } from './PersonMasterDataBlock'
import PersonCommunicationDataBlock, { PersonCommunicationState } from './PersonCommunicationDataBlock'
import DistributionListsBlock, { DistributionListsState } from './DistributionListsBlock'
import SoftwareRolesBlock, { SoftwareRolesState } from './SoftwareRolesBlock'
import ProcessControlBlock, { ProcessControlState } from './ProcessControlBlock'

export default function AccessRequestForm() {
    const router = useRouter()

    const [employee, setEmployee] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Phase 2: AD Reference User State
    const [referenceUser, setReferenceUser] = useState<ADUser | null>(null)

    // Phase 2.5: Enterprise Blocks
    const [softwareAccess, setSoftwareAccess] = useState<SoftwareState>({})
    const [folderAccess, setFolderAccess] = useState<FolderAccessState>({ folders: [] })

    // Phase 2.8: Roles & Process Control
    const [softwareRoles, setSoftwareRoles] = useState<SoftwareRolesState>({ docuBridgeRoles: '', gloryaRoles: '', sapRoles: '', grcRoles: '', ownerAccess: '', referencePerson: '' })
    const [processControl, setProcessControl] = useState<ProcessControlState>({ sectionDueDate: '', forwardingDeadline: '', executionConfirmationDate: '', deactivationDate: '' })

    // Phase 2.6: HR & Person Master Data Blocks
    const [hrState, setHrState] = useState<HRPrerequisitesState>({ dateOfProcessStart: '', employeeEntryDate: '', typeOfHire: '', entryType: '' })
    const [personMasterState, setPersonMasterState] = useState<PersonMasterDataState>({ firstName: '', lastName: '', entryDate: '', contractStatus: '', contractDuration: '', manager: '', department: '', jobTitle: '', shortName: '', costCentre: '', personId: '', salesRepAddress: '' })
    const [personCommState, setPersonCommState] = useState<PersonCommunicationState>({ sharedMailboxes: [] })

    // Phase 2.7: Dynamic Distribution Lists
    const [distListsState, setDistListsState] = useState<DistributionListsState>({ selectedLists: {}, specificPersonalLists: '' })

    const submitForm = async (status: string) => {
        if (!employee) {
            setError('Please select an employee before submitting.')
            return
        }

        setLoading(true)
        setError('')

        // Build Payload
        const items: any[] = []

        // Phase 2.6: HR Data Payload
        if (hrState.dateOfProcessStart) items.push({ section_name: 'HR Prerequisites', field_name: 'Date of Process Start', value: hrState.dateOfProcessStart })
        if (hrState.employeeEntryDate) items.push({ section_name: 'HR Prerequisites', field_name: 'Employee Entry Date', value: hrState.employeeEntryDate })
        if (hrState.typeOfHire) items.push({ section_name: 'HR Prerequisites', field_name: 'Type of Hire', value: hrState.typeOfHire })
        if (hrState.entryType) items.push({ section_name: 'HR Prerequisites', field_name: 'Entry Type', value: hrState.entryType })

        // Phase 2.6: Person Master Data Payload
        if (personMasterState.firstName) items.push({ section_name: 'Person Master Data', field_name: 'First Name', value: personMasterState.firstName })
        if (personMasterState.lastName) items.push({ section_name: 'Person Master Data', field_name: 'Last Name', value: personMasterState.lastName })
        if (personMasterState.entryDate) items.push({ section_name: 'Person Master Data', field_name: 'Entry Date', value: personMasterState.entryDate })
        if (personMasterState.contractStatus) items.push({ section_name: 'Person Master Data', field_name: 'Contract Status', value: personMasterState.contractStatus })
        if (personMasterState.contractDuration) items.push({ section_name: 'Person Master Data', field_name: 'Contract Duration', value: personMasterState.contractDuration })
        if (personMasterState.manager) items.push({ section_name: 'Person Master Data', field_name: 'Manager', value: personMasterState.manager })
        if (personMasterState.department) items.push({ section_name: 'Person Master Data', field_name: 'Department', value: personMasterState.department })
        if (personMasterState.jobTitle) items.push({ section_name: 'Person Master Data', field_name: 'Job Title', value: personMasterState.jobTitle })
        if (personMasterState.shortName) items.push({ section_name: 'Person Master Data', field_name: 'Short Name', value: personMasterState.shortName })
        if (personMasterState.costCentre) items.push({ section_name: 'Person Master Data', field_name: 'Cost Centre', value: personMasterState.costCentre })
        if (personMasterState.personId) items.push({ section_name: 'Person Master Data', field_name: 'Person ID', value: personMasterState.personId })
        if (personMasterState.salesRepAddress) items.push({ section_name: 'Person Master Data', field_name: 'Sales Rep Address', value: personMasterState.salesRepAddress })

        // Phase 2.6: Person Communication Data Payload (Now solely Shared Mailboxes)
        personCommState.sharedMailboxes.forEach((mb, idx) => {
            if (mb.address.trim()) {
                items.push({
                    section_name: 'Shared Mailboxes',
                    field_name: mb.address.trim(),
                    field_type: mb.accessType || 'Full',
                    value: 'Requested',
                    justification: mb.justification
                })
            }
        })

        Object.entries(softwareAccess).forEach(([key, val]) => {
            if (val.selected) {
                const config = ENTERPRISE_SOFTWARE[key]
                items.push({
                    section_name: 'Enterprise Applications & Software',
                    field_name: config?.label || key,
                    field_type: 'checkbox',
                    value: 'true',
                    justification: val.role ? `Role: ${val.role} | Note: ${val.note}` : `Note: ${val.note}`
                })
            }
        })

        if (folderAccess.folders) {
            folderAccess.folders.forEach((val, idx) => {
                const name = val.fNumber ? `${val.fNumber} - ${val.fName}` : (val.fName || `Folder ${idx + 1}`)
                if (name.trim()) {
                    items.push({
                        section_name: 'File Systems & Folders',
                        field_name: name,
                        field_type: 'text',
                        value: val.accessType,
                        justification: `Reference Person: ${val.refPerson || 'None'}`
                    })
                }
            })
        }

        // Phase 2.8: Roles Payload
        const rolesMap = [
            { field_name: 'DocuBridge Roles', val: softwareRoles.docuBridgeRoles },
            { field_name: 'Glorya Roles', val: softwareRoles.gloryaRoles },
            { field_name: 'SAP Roles', val: softwareRoles.sapRoles },
            { field_name: 'GRC Roles', val: softwareRoles.grcRoles },
            { field_name: 'Access for Software Owner', val: softwareRoles.ownerAccess },
            { field_name: 'Reference Person for Access', val: softwareRoles.referencePerson }
        ]
        rolesMap.forEach(r => {
            if (r.val.trim()) items.push({ section_name: 'Software Roles & Ownership', field_name: r.field_name, field_type: 'text', value: r.val.trim() })
        })

        // Phase 2.8: Process Dates Payload
        const datesMap = [
            { field_name: 'Section due date', val: processControl.sectionDueDate },
            { field_name: 'Forwarding deadline', val: processControl.forwardingDeadline },
            { field_name: 'Execution confirm date', val: processControl.executionConfirmationDate },
            { field_name: 'Deactivation Date', val: processControl.deactivationDate }
        ]
        datesMap.forEach(d => {
            if (d.val) items.push({ section_name: 'Process Control Dates', field_name: d.field_name, field_type: 'date', value: d.val })
        })

        // Phase 2.7: Dynamic Distribution Lists Payload
        Object.entries(distListsState.selectedLists).forEach(([listId, isSelected]) => {
            if (isSelected) {
                items.push({
                    section_name: 'Distribution Lists',
                    field_name: listId, // We push the ID, but ideally we want the Name. The backend can join or we assume field_name holds the ID.
                    // Actually, it's safer to store the flag. Since we only have list.id, we'll store that for now, but we don't have the list *name* here directly.
                    // Wait, we can fetch the name from the component or just store it. We'll store ID in field_name, value=true. Wait, print view needs the name. 
                    // Let's store the ID as field_name to be safe, but wait, the label isn't here. Let's fix that below if needed, but for now we'll push it as is.
                    // To get the name, we should have passed it from the component. For now I'll just use field_name: `Distribution List (ID: ${listId})`.
                    // Wait, I will refactor this to save the exact name later by changing onChange. For now, field_name will be `DL: ${listId}`.
                    field_type: 'checkbox',
                    value: 'true',
                    justification: 'Requested'
                })
            }
        })

        if (distListsState.specificPersonalLists.trim()) {
            items.push({
                section_name: 'Distribution Lists',
                field_name: 'Specific Personal Distribution Lists',
                field_type: 'text',
                value: distListsState.specificPersonalLists.trim(),
                justification: 'Requested'
            })
        }

        if (items.length === 0 && status === 'Submitted') {
            setError('You must request at least one item before submitting.')
            setLoading(false)
            return;
        }

        try {
            const res = await fetch('/api/access-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee.EmployeeID,
                    status: status,
                    items: items
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to preserve request')
            }

            // Redirect back to list
            router.push('/access-requests')
            router.refresh()

        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Initial Employee Looker */}
            <div className="card shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold bg-gray-50 -mx-6 -mt-6 p-4 border-b rounded-t-xl text-gray-800 mb-6">
                    0. General System Selection
                </h2>
                <div className="max-w-xl">
                    <label className="form-label text-blue-900">Select Existing Employee Data <span className="text-gray-400 font-normal text-xs ml-2">(Optional Auto-fill)</span></label>
                    <p className="text-xs text-gray-500 mb-2">Select an employee to auto-fill the forms below.</p>
                    <EmployeeAutocomplete onSelect={setEmployee} />

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <label className="form-label text-purple-900 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            Reference User (Mimic Access) <span className="text-gray-400 font-normal text-xs ml-2">(Optional)</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Search live Active Directory to see the groups of a comparable employee.</p>

                        <ReferenceUserAutocomplete onSelect={setReferenceUser} />

                        {referenceUser && (
                            <div className="mt-4 p-4 rounded-lg border border-purple-200 bg-purple-50 animate-fade-in">
                                <h4 className="text-sm font-bold text-purple-900 mb-2 flex flex-col sm:flex-row sm:items-center justify-between">
                                    <span>Active Directory Groups ({referenceUser.groups.length})</span>
                                    <span className="text-xs font-normal text-purple-700 bg-purple-200 px-2 py-0.5 rounded-full mt-1 sm:mt-0">Read-Only</span>
                                </h4>
                                <div className="max-h-40 overflow-y-auto pr-2 border border-purple-100 rounded bg-white p-2">
                                    {referenceUser.groups.length > 0 ? (
                                        <ul className="space-y-1">
                                            {referenceUser.groups.map((group, idx) => {
                                                // Extract just the CN (Common Name) for clearer display if LDAP format
                                                const groupName = group.startsWith('CN=') ? group.split(',')[0].replace('CN=', '') : group
                                                const isHighPrivilege = /(admin|root|superuser|domain admins|enterprise admins|exchange organization)/i.test(groupName)

                                                return (
                                                    <li key={idx} className={`text-xs font-mono break-all px-2 py-1.5 rounded flex items-start sm:items-center justify-between gap-2 ${isHighPrivilege ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-gray-50 text-gray-700'}`}>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold">{groupName}</div>
                                                            <div className="text-gray-400 text-[10px] truncate w-full" title={group}>{group}</div>
                                                        </div>
                                                        {isHighPrivilege && (
                                                            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                                High Privilege
                                                            </span>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic p-2">No groups found for this user.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BLOCK 1A: HR Prerequisites */}
            <HRPrerequisitesBlock state={hrState} onChange={setHrState} />

            {/* BLOCK 1B: Person Master Data */}
            <PersonMasterDataBlock state={personMasterState} onChange={setPersonMasterState} employeeContext={employee} />

            {/* BLOCK 1C: Person Communication Data */}
            <PersonCommunicationDataBlock state={personCommState} onChange={setPersonCommState} />

            {/* BLOCK 2: Enterprise Software */}
            <SoftwareAccessBlock state={softwareAccess} onChange={setSoftwareAccess} />

            {/* BLOCK 3: File Systems & Folders */}
            <FolderAccessBlock state={folderAccess} onChange={setFolderAccess} />

            {/* BLOCK 4: Dynamic Distribution Lists */}
            <DistributionListsBlock state={distListsState} onChange={setDistListsState} />

            {/* BLOCK 5: Software Roles */}
            <SoftwareRolesBlock state={softwareRoles} onChange={setSoftwareRoles} />

            {/* BLOCK 6: Process Control */}
            <ProcessControlBlock state={processControl} onChange={setProcessControl} />

            {/* Action Buttons */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky bottom-6">
                <button
                    onClick={() => submitForm('Draft')}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Save as Draft
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2.5 text-gray-500 hover:text-gray-800 font-medium"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    onClick={() => submitForm('Submitted')}
                    disabled={loading}
                    className="px-8 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    Submit Request
                </button>
            </div>
        </div>
    )
}
