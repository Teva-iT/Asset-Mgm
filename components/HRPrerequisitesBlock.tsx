export interface HRPrerequisitesState {
    dateOfProcessStart: string
    employeeEntryDate: string
    typeOfHire: 'New' | 'Change' | ''
    entryType: 'Employee Entry' | 'Change Request' | ''
}

import ModernDatePicker from './ModernDatePicker'

interface Props {
    state: HRPrerequisitesState
    onChange: (state: HRPrerequisitesState) => void
}

export default function HRPrerequisitesBlock({ state, onChange }: Props) {
    const handleChange = (field: keyof HRPrerequisitesState, value: string) => {
        onChange({ ...state, [field]: value })
    }

    return (
        <div className="card shadow-sm border border-gray-200 mt-6">
            <h2 className="text-xl font-bold bg-indigo-50 -mx-6 -mt-6 p-4 border-b border-indigo-100 rounded-t-xl text-indigo-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                1A. HR – General Prerequisites
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="form-label text-gray-700">Date of Process Start <span className="text-red-500">*</span></label>
                    <ModernDatePicker
                        value={state.dateOfProcessStart}
                        onChange={(e: any) => handleChange('dateOfProcessStart', e.target.value)}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="form-label text-gray-700">Employee Entry Date <span className="text-red-500">*</span></label>
                    <ModernDatePicker
                        value={state.employeeEntryDate}
                        onChange={(e: any) => handleChange('employeeEntryDate', e.target.value)}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="form-label text-gray-700">Type of Hire <span className="text-red-500">*</span></label>
                    <select
                        value={state.typeOfHire}
                        onChange={(e) => handleChange('typeOfHire', e.target.value as any)}
                        className="form-input w-full"
                    >
                        <option value="">Select Type</option>
                        <option value="New">New</option>
                        <option value="Change">Change</option>
                    </select>
                </div>
                <div>
                    <label className="form-label text-gray-700">Entry Type <span className="text-red-500">*</span></label>
                    <select
                        value={state.entryType}
                        onChange={(e) => handleChange('entryType', e.target.value as any)}
                        className="form-input w-full"
                    >
                        <option value="">Select Entry</option>
                        <option value="Employee Entry">Employee Entry</option>
                        <option value="Change Request">Change Request</option>
                    </select>
                </div>
            </div>
        </div>
    )
}
