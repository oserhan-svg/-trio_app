import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PriceDistributionChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Calculate price per m2 distribution
    const priceBins = {};
    const binSize = 5000; // 5k TL steps

    data.forEach(p => {
        if (!p.size_m2 || p.size_m2 <= 0) return;
        const m2Price = parseInt(p.price) / p.size_m2;
        if (isNaN(m2Price)) return;
        const bin = Math.floor(m2Price / binSize) * binSize;
        const label = `${(bin / 1000).toFixed(0)}k-${((bin + binSize) / 1000).toFixed(0)}k`;
        priceBins[label] = (priceBins[label] || 0) + 1;
    });

    const chartData = Object.entries(priceBins)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));

    return (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
            <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Fiyat Dağılımı
            </h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 9, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '10px', padding: '4px' }}
                            cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PriceDistributionChart;
