import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const NeighborhoodChart = ({ stats }) => {
    // Highly defensive data preparation
    const chartData = useMemo(() => {
        if (!stats || !Array.isArray(stats)) return [];
        return stats
            .filter(s => s && s.neighborhood && typeof s.avgPricePerM2 === 'number' && s.avgPricePerM2 > 0)
            .map(s => ({
                name: String(s.neighborhood).replace(' Mah.', '').substring(0, 12),
                price: Math.round(s.avgPricePerM2),
                count: s.count || 0
            }))
            .sort((a, b) => b.price - a.price)
            .slice(0, 5); // Limit to top 5 for maximum safety and space
    }, [stats]);

    if (chartData.length === 0) {
        return (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col items-center justify-center text-gray-400 text-[10px] text-center">
                Bölgesel veri analizi için yeterli ilan henüz toplanmadı.
            </div>
        );
    }

    return (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
            <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Bölgesel Fiyat (m²)
            </h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide domain={[0, 'auto']} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 9, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            width={70}
                            interval={0}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '9px', padding: '4px' }}
                        />
                        <Bar dataKey="price" radius={[0, 2, 2, 0]} barSize={12}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.price > 45000 ? '#ef4444' : entry.price < 35000 ? '#22c55e' : '#10b981'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default NeighborhoodChart;
