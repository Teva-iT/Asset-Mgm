import { useState } from 'react'

export interface SoftwareRolesState {
    docuBridgeRoles: string
    gloryaRoles: string
    sapRoles: string
    grcRoles: string
    ownerAccess: string // Access for Software Owner field
    referencePerson: string // Reference Person for access rights
}

interface Props {
    state: SoftwareRolesState
    onChange: (state: SoftwareRolesState) => void
}

export default function SoftwareRolesBlock({ state, onChange }: Props) {

    const handleChange = (field: keyof SoftwareRolesState, value: string) => {
        onChange({ ...state, [field]: value })
    }

    return (
        <div className="card shadow-sm border border-gray-200 mt-6">
            <h2 className="text-xl font-bold bg-amber-50 -mx-6 -mt-6 p-4 border-b border-amber-100 rounded-t-xl text-amber-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                5. Software Access – Role / Owner Based
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Individual Role Selections */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Individual Role Selections</h3>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">DocuBridge roles</label>
                        <input
                            type="text"
                            value={state.docuBridgeRoles}
                            onChange={(e) => handleChange('docuBridgeRoles', e.target.value)}
                            className="w-full text-sm p-2 border border-amber-200 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                            placeholder="Specify roles..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Glorya roles</label>
                        <input
                            type="text"
                            value={state.gloryaRoles}
                            onChange={(e) => handleChange('gloryaRoles', e.target.value)}
                            className="w-full text-sm p-2 border border-amber-200 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                            placeholder="Specify roles..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">SAP roles</label>
                        <input
                            type="text"
                            value={state.sapRoles}
                            onChange={(e) => handleChange('sapRoles', e.target.value)}
                            className="w-full text-sm p-2 border border-amber-200 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                            placeholder="Specify roles..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">GRC roles</label>
                        <input
                            type="text"
                            value={state.grcRoles}
                            onChange={(e) => handleChange('grcRoles', e.target.value)}
                            className="w-full text-sm p-2 border border-amber-200 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                            placeholder="Specify roles..."
                        />
                    </div>
                </div>

                {/* Owner Approvals Metadata */}
                <div className="space-y-4 md:border-l md:pl-6 border-gray-100">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Software Owner Context</h3>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Access for Software Owner</label>
                        <textarea
                            value={state.ownerAccess}
                            onChange={(e) => handleChange('ownerAccess', e.target.value)}
                            className="w-full text-sm p-2 border border-amber-200 rounded focus:ring-1 focus:ring-amber-500 outline-none min-h-[80px]"
                            placeholder="Specify owner access requirements..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Reference Person for access rights</label>
                        <input
                            type="text"
                            value={state.referencePerson}
                            onChange={(e) => handleChange('referencePerson', e.target.value)}
                            className="w-full text-sm p-2 border border-amber-200 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                            placeholder="Name of reference person"
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
