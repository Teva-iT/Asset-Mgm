import { useEffect } from 'react'

export interface PersonMasterDataState {
    firstName: string
    lastName: string
    entryDate: string
    contractStatus: 'intern' | 'extern' | ''
    contractDuration: 'limited' | 'unlimited' | ''
    manager: string
    department: string
    jobTitle: string
    shortName: string
    costCentre: string
    personId: string
    salesRepAddress: string
}

interface Props {
    state: PersonMasterDataState
    onChange: (state: PersonMasterDataState) => void
    employeeContext: any // The employee selected from the autocomplete block
}

export default function PersonMasterDataBlock({ state, onChange, employeeContext }: Props) {
    const handleChange = (field: keyof PersonMasterDataState, value: string) => {
        onChange({ ...state, [field]: value })
    }

    // Auto-fill from DB context if present, but allow override
    useEffect(() => {
        if (employeeContext && !state.firstName && !state.lastName) {
            onChange({
                ...state,
                firstName: employeeContext.FirstName || '',
                lastName: employeeContext.LastName || '',
                department: employeeContext.Department || '',
                jobTitle: employeeContext.Title || '',
            })
        }
    }, [employeeContext])

    return (
        <div className="card shadow-sm border border-gray-200 mt-6">
            <h2 className="text-xl font-bold bg-blue-50 -mx-6 -mt-6 p-4 border-b border-blue-100 rounded-t-xl text-blue-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                1B. Person Master Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="form-label text-gray-700">First Name <span className="text-red-500">*</span></label>
                    <input type="text" value={state.firstName} onChange={e => handleChange('firstName', e.target.value)} className="form-input w-full" />
                </div>
                <div>
                    <label className="form-label text-gray-700">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" value={state.lastName} onChange={e => handleChange('lastName', e.target.value)} className="form-input w-full" />
                </div>
                <div>
                    <label className="form-label text-gray-700">Entry Date (Master) <span className="text-red-500">*</span></label>
                    <input type="date" value={state.entryDate} onChange={e => handleChange('entryDate', e.target.value)} className="form-input w-full" />
                </div>

                <div>
                    <label className="form-label text-gray-700">Contract Status <span className="text-red-500">*</span></label>
                    <select value={state.contractStatus} onChange={e => handleChange('contractStatus', e.target.value as any)} className="form-input w-full">
                        <option value="">Select...</option>
                        <option value="intern">Intern / Internal</option>
                        <option value="extern">Extern / Contractor</option>
                    </select>
                </div>
                <div>
                    <label className="form-label text-gray-700">Contract Duration <span className="text-red-500">*</span></label>
                    <select value={state.contractDuration} onChange={e => handleChange('contractDuration', e.target.value as any)} className="form-input w-full">
                        <option value="">Select...</option>
                        <option value="limited">Limited</option>
                        <option value="unlimited">Unlimited</option>
                    </select>
                </div>
                <div>
                    <label className="form-label text-gray-700">Manager <span className="text-red-500">*</span></label>
                    <input type="text" value={state.manager} onChange={e => handleChange('manager', e.target.value)} placeholder="Name of Manager" className="form-input w-full" />
                </div>

                <div>
                    <label className="form-label text-gray-700">Department</label>
                    <input type="text" value={state.department} onChange={e => handleChange('department', e.target.value)} className="form-input w-full" />
                </div>
                <div>
                    <label className="form-label text-gray-700">Job Title</label>
                    <input type="text" value={state.jobTitle} onChange={e => handleChange('jobTitle', e.target.value)} className="form-input w-full" />
                </div>
                <div>
                    <label className="form-label text-gray-700">Short Name</label>
                    <input type="text" value={state.shortName} onChange={e => handleChange('shortName', e.target.value)} placeholder="e.g. jdoe" className="form-input w-full" />
                </div>

                <div>
                    <label className="form-label text-gray-700">Cost Centre <span className="text-red-500">*</span></label>
                    <input type="text" value={state.costCentre} onChange={e => handleChange('costCentre', e.target.value)} className="form-input w-full" />
                </div>
                <div>
                    <label className="form-label text-gray-700">Person ID</label>
                    <input type="text" value={state.personId} onChange={e => handleChange('personId', e.target.value)} className="form-input w-full" />
                </div>
            </div>

            <div className="mt-6">
                <label className="form-label text-gray-700">Sales Representative Address <span className="text-gray-400 font-normal text-xs ml-1">(If applicable)</span></label>
                <textarea
                    value={state.salesRepAddress}
                    onChange={e => handleChange('salesRepAddress', e.target.value)}
                    className="form-input w-full resize-none"
                    rows={2}
                    placeholder="Provide full address if person is a sales representative"
                />
            </div>
        </div>
    )
}
