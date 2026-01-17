import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PropertyChart = ({ data }) => {
    // Process data to count properties by room number
    const roomCounts = data.reduce((acc, curr) => {
        const room = curr.rooms || 'Bilinmiyor';
        acc[room] = (acc[room] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.keys(roomCounts).map(key => ({
        name: key,
        value: roomCounts[key]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    if (data.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 self-start">Oda Sayısı Dağılımı</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (%${(percent * 100).toFixed(0)})`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PropertyChart;
