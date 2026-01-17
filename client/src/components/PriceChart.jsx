import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const PriceChart = ({ data }) => {
    // Transform data for chart if needed, or assume parent passes prepared data
    if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">Analiz verisi yok.</div>;

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Bölgesel Fiyat Analizi (m²)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="neighborhood" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value.toLocaleString()} TL`} />
                        <Bar dataKey="avgPricePerM2" fill="#3b82f6" name="Ort. m² Fiyatı" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PriceChart;
