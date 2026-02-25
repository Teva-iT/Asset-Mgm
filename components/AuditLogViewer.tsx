

interface AuditLog {
    LogID: string
    Action: string
    Details: string | null
    Timestamp: string | Date
    User?: {
        name: string | null
        email: string
    } | null
}

export default function AuditLogViewer({ logs }: { logs: AuditLog[] }) {
    if (logs.length === 0) {
        return <div className="text-gray-500 text-sm py-4">No history available for this asset.</div>
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">History</h3>
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
                {logs.map((log) => (
                    <div key={log.LogID} className="mb-8 ml-6 relative">
                        {/* Dot */}
                        <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-white">
                            <span className={`h-2.5 w-2.5 rounded-full ${getActionColor(log.Action)}`} />
                        </span>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">{formatAction(log.Action)}</h4>
                                <p className="mt-0.5 text-sm text-gray-600">{log.Details}</p>
                            </div>
                            <div className="mt-1 sm:mt-0 whitespace-nowrap text-right">
                                <time className="text-xs text-gray-400 block">{new Date(log.Timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</time>
                                <span className="text-xs text-gray-500 font-medium">{log.User?.name || 'System'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function getActionColor(action: string) {
    switch (action) {
        case 'CREATE': return 'bg-green-500'
        case 'ASSIGN': return 'bg-blue-500'
        case 'RETURN': return 'bg-yellow-500'
        case 'UPDATE': return 'bg-gray-500'
        case 'DELETE': return 'bg-red-500'
        default: return 'bg-gray-400'
    }
}

function formatAction(action: string) {
    return action.charAt(0) + action.slice(1).toLowerCase()
}
