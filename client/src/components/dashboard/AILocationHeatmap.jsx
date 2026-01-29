import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MapPin, Users, Home } from 'lucide-react';

const AILocationHeatmap = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHeatmapData = async () => {
            try {
                const response = await api.get('/analytics/demand-heatmap');
                setData(response.data);
            } catch (error) {
                console.error('Heatmap load error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmapData();
    }, []);

    if (loading) return <div className="p-4 text-center text-xs text-gray-400">Analiz ediliyor...</div>;

    // Group by district for a cleaner view
    const grouped = data.reduce((acc, item) => {
        if (!acc[item.district]) acc[item.district] = { total: 0, rooms: {} };
        acc[item.district].total += item.count;
        acc[item.district].rooms[item.rooms] = (acc[item.district].rooms[item.rooms] || 0) + item.count;
        return acc;
    }, {});

    const sortedDistricts = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin className="text-red-500" size={18} />
                    <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Bölgesel Talep Yoğunluğu</h3>
                </div>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">Canlı AI Verisi</span>
            </div>

            <div className="px-4 py-2 flex-1 overflow-y-auto">
                {sortedDistricts.length === 0 ? (
                    <div className="h-40 flex flex-center items-center justify-center text-xs text-slate-400 italic">
                        Henüz yeterli talep verisi yok.
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {sortedDistricts.map(([district, stats]) => (
                            <div key={district} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-slate-700">{district}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{stats.total} Müşteri</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (stats.total / (sortedDistricts[0][1].total || 1)) * 100)}%` }}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(stats.rooms).map(([rooms, count]) => (
                                        <div key={rooms} className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500">
                                            <Home size={10} /> {rooms}: {count}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100">
                <p className="text-[9px] text-slate-400 text-center font-medium">
                    Müşteri taleplerinden (Demands) otomatik olarak üretilmiştir.
                </p>
            </div>
        </div>
    );
};

export default AILocationHeatmap;
