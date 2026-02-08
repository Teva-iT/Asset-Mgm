'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#059669', '#7c3aed', '#dc2626', '#ef4444', '#f59e0b', '#6b7280']

interface DataPoint {
    name: string
    value: number
}

export default function AssetStatusChart({ data }: { data: DataPoint[] }) {
    // If no data, show a placeholder "gray" chart to keep the visual weight
    const chartData = data.every(d => d.value === 0)
        ? [{ name: 'No Data', value: 1, color: '#e5e7eb' }]
        : data

    const isPlaceholder = data.every(d => d.value === 0)

    return (
        <div className="h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={isPlaceholder ? 0 : 5}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={isPlaceholder ? '#e5e7eb' : (COLORS[index % COLORS.length])} />
                        ))}
                    </Pie>
                    {!isPlaceholder && <Tooltip cursor={false} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />}
                    {!isPlaceholder && <Legend verticalAlign="bottom" height={36} iconType="circle" />}
                </PieChart>
            </ResponsiveContainer>
            {isPlaceholder && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-gray-400 text-sm font-medium">No Data</span>
                </div>
            )}
        </div>
    )
}
