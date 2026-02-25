


interface AuditLog {
    LogID: string
    Action: string
    Details: string | null
    Timestamp: string | Date
    User?: {
        Username: string | null
    } | null
    Asset: {
        AssetName: string | null
        AssetType: string | null
    }
}

export default function RecentAuditLog({ logs }: { logs: AuditLog[] }) {
    if (logs.length === 0) return <div className="text-gray-400 text-sm">No recent activity</div>

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <div key={log.LogID} className="flex gap-3 items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${getActionColor(log.Action)}`} />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {formatAction(log.Action)} <span className="text-gray-500 font-normal">on</span> {log.Asset.AssetName || 'Unknown Asset'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{log.Details}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {log.User?.Username || 'System'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {new Date(log.Timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
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
