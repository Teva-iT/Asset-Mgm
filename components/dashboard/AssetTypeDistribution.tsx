
export default function AssetTypeDistribution({ data }: { data: { type: string, count: number }[] }) {
    const total = data.reduce((acc, curr) => acc + curr.count, 0)

    return (
        <div className="space-y-3">
            {data.map((item) => (
                <div key={item.type}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{item.type || 'Unspecified'}</span>
                        <span className="text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.count / total) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
            {data.length === 0 && <div className="text-gray-400 text-sm">No asset data available</div>}
        </div>
    )
}
