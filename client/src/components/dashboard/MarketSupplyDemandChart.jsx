import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const MarketSupplyDemandChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/analytics');
            if (response.data.supplyDemand) {
                // Take top 8 neighborhoods by demand for clarity
                const topData = response.data.supplyDemand
                    .sort((a, b) => b.demand - a.demand)
                    .slice(0, 8);
                setData(topData);
            }
        } catch (error) {
            console.error('Failed to fetch supply/demand data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-80 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400">Veriler hazırlanıyor...</div>;

    if (data.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="text-blue-600" />
                        Mahalle Bazlı Talep-Arz Dengesi
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Hangi bölgede kaç müşteri bekliyor vs kaç ilan var?</p>
                </div>
            </div>

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                        barGap={8}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                        <Bar
                            name="Bekleyen Talep"
                            dataKey="demand"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            name="Mevcut Arz (İlan)"
                            dataKey="supply"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Insight Label */}
            <div className="mt-4 p-3 bg-blue-50 rounded-xl flex gap-3 items-start border border-blue-100">
                <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                    <span className="font-bold underline">Stratejik İpucu:</span> Talebin arzdan yüksek olduğu (Mor çubuğun Yeşil'den uzun olduğu) bölgelerde portföy toplama çalışmalarına ağırlık vermeniz önerilir.
                </p>
            </div>
        </div>
    );
};

export default MarketSupplyDemandChart;
