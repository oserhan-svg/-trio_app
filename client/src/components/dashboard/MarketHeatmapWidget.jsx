import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Map, ArrowRight } from 'lucide-react';

const MarketHeatmapWidget = () => {
    // Simulated Market Data (Replace with API call to /api/market/stats later)
    const marketData = useMemo(() => [
        { district: 'Cunda (Alibey)', trend: 'up', change: 12, avgPrice: '8.5M', demand: 'High', color: 'bg-rose-500' },
        { district: 'Ayvalık Merkez', trend: 'stable', change: 2, avgPrice: '4.2M', demand: 'Medium', color: 'bg-orange-400' },
        { district: 'Sarımsaklı', trend: 'down', change: -5, avgPrice: '3.8M', demand: 'Low', color: 'bg-emerald-500' },
        { district: 'Altınova', trend: 'up', change: 8, avgPrice: '5.1M', demand: 'Medium', color: 'bg-orange-500' },
        { district: 'Küçükköy', trend: 'up', change: 15, avgPrice: '6.2M', demand: 'High', color: 'bg-rose-600' },
    ], []);

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Map className="text-indigo-600" size={20} />
                    Bölgesel Piyasa Isı Haritası
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold animate-pulse">
                    CANLI VERİ
                </span>
            </div>

            <div className="space-y-3">
                {marketData.map((region, idx) => (
                    <div key={idx} className="group flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-10 rounded-full ${region.color}`}></div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">{region.district}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    Ort. {region.avgPrice} ₺
                                    <span className="text-gray-300">•</span>
                                    Talep: {region.demand === 'High' ? '🔥 Yüksek' : region.demand === 'Medium' ? '⚖️ Normal' : '❄️ Düşük'}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`text-sm font-black flex items-center justify-end gap-1 ${region.trend === 'up' ? 'text-rose-600' : region.trend === 'down' ? 'text-emerald-600' : 'text-gray-600'}`}>
                                {region.trend === 'up' ? <TrendingUp size={14} /> : region.trend === 'down' ? <TrendingDown size={14} /> : null}
                                %{Math.abs(region.change)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">son 30 gün</div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                Detaylı Analiz Raporu <ArrowRight size={14} />
            </button>
        </div>
    );
};

export default MarketHeatmapWidget;
