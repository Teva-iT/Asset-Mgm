
function CSSPieChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No Data</div>;

    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let currentDeg = 0;
    const gradientParts: string[] = [];

    data.forEach((item, index) => {
        if (item.value === 0) return;
        const percent = item.value / total;
        const deg = percent * 360;
        const endDeg = currentDeg + deg;
        gradientParts.push(`${COLORS[index % COLORS.length]} ${currentDeg}deg ${endDeg}deg`);
        currentDeg = endDeg;
    });

    const gradientString = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div
                className="rounded-full relative shadow-sm"
                style={{
                    width: '200px',
                    height: '200px',
                    background: gradientString,
                }}
            >
                {/* Donut Hole */}
                <div className="absolute inset-0 m-auto bg-white rounded-full w-[120px] h-[120px] flex items-center justify-center shadow-inner">
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-gray-800">{total}</span>
                        <span className="text-xs text-gray-500 uppercase">Total</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 max-w-xs">
                {data.map((entry, index) => (
                    entry.value > 0 && (
                        <div key={index} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-xs text-gray-600 font-medium">{entry.name} ({Math.round(entry.value / total * 100)}%)</span>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}
