'use client'

export const ENTERPRISE_SOFTWARE: Record<string, { label: string, requiresRole: boolean, placeholder: string }> = {
    // Original core
    'docubridge': { label: 'DocuBridge (B)', requiresRole: true, placeholder: 'Specify role (e.g. Publisher, Reviewer)' },
    'sap_gui': { label: 'SAP GUI 7.60', requiresRole: true, placeholder: 'Specify exact SAP Role or Module' },
    'grc': { label: 'GRC (Governance, Risk, Compliance)', requiresRole: true, placeholder: 'Specify GRC profile' },
    'trackwise': { label: 'Trackwise', requiresRole: true, placeholder: 'Specify Quality Role' },
    'glorya': { label: 'Glorya', requiresRole: true, placeholder: 'Specify Clinical Role' },
    'o365': { label: 'Office 365 License (E3/E5)', requiresRole: false, placeholder: 'Justification if non-standard' },

    // Phase 2.8 Standard
    'ms_teams': { label: 'Microsoft Teams', requiresRole: false, placeholder: 'Coordination note' },
    'concur': { label: 'Concur', requiresRole: false, placeholder: 'Coordination note' },
    'acrobat_reader': { label: 'Acrobat Reader', requiresRole: false, placeholder: 'Coordination note' },
    'vpn': { label: 'Remote Access (VPN Client)', requiresRole: false, placeholder: 'Justification for remote access' },
    'rexx': { label: 'rexx', requiresRole: false, placeholder: 'Coordination note' },

    // Phase 2.8 Extended / Additional
    'ms_visio': { label: 'Microsoft Visio', requiresRole: false, placeholder: 'Ticket / Justification' },
    '7zip': { label: '7-ZIP', requiresRole: false, placeholder: 'Ticket / Justification' },
    'acrobat_dc_pro': { label: 'Adobe Acrobat DC Professional', requiresRole: false, placeholder: 'Ticket / Justification' },
    'indesign': { label: 'Adobe InDesign', requiresRole: false, placeholder: 'Ticket / Justification' },
    'photoshop': { label: 'Adobe Photoshop', requiresRole: false, placeholder: 'Ticket / Justification' },
    'schlafende_hase': { label: 'Der schlafende Hase', requiresRole: false, placeholder: 'Ticket / Justification' },
    'citrix': { label: 'Citrix access', requiresRole: false, placeholder: 'Ticket / Justification' },
    'citrix_upgrade': { label: 'Citrix 4.12 upgrade', requiresRole: false, placeholder: 'Ticket / Justification' },
    'docusign': { label: 'DocuSign', requiresRole: false, placeholder: 'Ticket / Justification' },
    'teams_vc': { label: 'Microsoft Teams VC Account', requiresRole: false, placeholder: 'Ticket / Justification' },
    'snagit': { label: 'Snagit 10', requiresRole: false, placeholder: 'Ticket / Justification' },
    'mobil_iron': { label: 'Mobil Iron', requiresRole: false, placeholder: 'Ticket / Justification' },
    'veeva_office': { label: 'Veeva office staff', requiresRole: false, placeholder: 'Ticket / Justification' }
}

export type SoftwareState = Record<string, { selected: boolean, role: string, note: string }>

interface Props {
    state: SoftwareState
    onChange: (state: SoftwareState) => void
}

export default function SoftwareAccessBlock({ state, onChange }: Props) {

    const handleToggle = (key: string) => {
        onChange({
            ...state,
            [key]: {
                selected: !state[key]?.selected,
                role: state[key]?.role || '',
                note: state[key]?.note || ''
            }
        })
    }

    const handleChange = (key: string, field: 'role' | 'note', value: string) => {
        onChange({
            ...state,
            [key]: { ...state[key], [field]: value }
        })
    }

    return (
        <div className="card shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold bg-gray-50 -mx-6 -mt-6 p-4 border-b rounded-t-xl text-gray-800 mb-6">
                2. Enterprise Applications & Software
            </h2>
            <div className="space-y-4">
                {Object.entries(ENTERPRISE_SOFTWARE).map(([key, config]) => {
                    const isSelected = state[key]?.selected || false
                    return (
                        <div key={key} className={`p-4 rounded-lg border transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                            <label className="flex items-start md:items-center gap-4 cursor-pointer mb-2">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggle(key)}
                                    className="w-5 h-5 text-blue-600 rounded bg-gray-100 border-gray-300 mt-1 md:mt-0"
                                />
                                <div className="flex-1 font-medium text-gray-900 leading-tight">
                                    {config.label}
                                </div>
                            </label>

                            {isSelected && (
                                <div className="ml-9 animate-fade-in mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {config.requiresRole && (
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Requested Role <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder={config.placeholder}
                                                value={state[key]?.role || ''}
                                                onChange={(e) => handleChange(key, 'role', e.target.value)}
                                                className="w-full text-sm p-2 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}
                                    <div className={config.requiresRole ? '' : 'md:col-span-2'}>
                                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Coordination Note / Ticket Ref</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., ServiceNow Ticket INT1234, IDM Note..."
                                            value={state[key]?.note || ''}
                                            onChange={(e) => handleChange(key, 'note', e.target.value)}
                                            className="w-full text-sm p-2 border border-blue-200 bg-white rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
