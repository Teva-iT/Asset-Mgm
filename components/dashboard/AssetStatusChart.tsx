'use client'



const COLORS = ['#059669', '#7c3aed', '#dc2626', '#ef4444', '#f59e0b', '#6b7280']

interface DataPoint {
    name: string
    value: number
}

export default function AssetStatusChart({ data }: { data: DataPoint[] }) {
    // Check if we have data
    const hasData = data.some(d => d.value > 0);

    // Calculate total for percentages
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    // Generate conic-gradient string
    let currentDeg = 0;
    const gradientParts = [];

    if (!hasData) {
        gradientParts.push(`#e5e7eb 0deg 360deg`);
    } else {
        data.forEach((item, index) => {
            if (item.value === 0) return;

            const percent = item.value / total;
            const deg = percent * 360;
            const endDeg = currentDeg + deg;

            gradientParts.push(`${COLORS[index % COLORS.length]} ${currentDeg}deg ${endDeg}deg`);
            currentDeg = endDeg;
        });
    }

    const gradientString = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="h-72 w-full flex flex-col items-center justify-center relative">
            {/* CSS Pie Chart */}
            <div
                className="rounded-full relative"
                style={{
                    width: '200px',
                    height: '200px',
                    background: gradientString,
                }}
            >
                {/* Inner White Circle for Donut Effect */}
                <div className="absolute inset-0 m-auto bg-white rounded-full w-[160px] h-[160px] flex items-center justify-center">
                    {!hasData && <span className="text-gray-400 text-sm font-medium">No Data</span>}
                </div>
            </div>

            {/* Legend */}
            {hasData && (
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                    {data.map((entry, index) => (
                        entry.value > 0 && (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs text-gray-600 font-medium">{entry.name}</span>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}
