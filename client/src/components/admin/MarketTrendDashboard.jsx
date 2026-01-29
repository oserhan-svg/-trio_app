import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Map, Info, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import api from '../../services/api';

const MarketTrendDashboard = () => {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrends();
    }, []);

    const fetchTrends = async () => {
        try {
            setLoading(true);
            const res = await api.get('/market/trends');
            setTrends(res.data);
        } catch (error) {
            console.error('Trend fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black">Piyasa Grafikleri Hazırlanıyor...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Mikro-Bölge Piyasa Analizi</h2>
                        <p className="text-xs text-slate-500">Ayvalık ve çevre bölgelerdeki yatırım potansiyeli ve fiyat değişimleri.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trends.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden transition-all hover:scale-[1.03]">
                        <div className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                                    {item.district}
                                </span>
                                <div className={`flex items-center gap-1 text-xs font-black ${item.trend === 'bullish' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {item.trend === 'bullish' ? <ArrowUpRight size={14} /> : <Activity size={14} />}
                                    %{item.priceChange}
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Ortalama m2 Fiyatı</div>
                                <div className="text-2xl font-black text-slate-800">{item.avgPriceM2.toLocaleString('tr-TR')} ₺</div>
                            </div>

                            <div className="mt-auto space-y-4">
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2">
                                        <span>YATIRIM PUANI (GROWTH)</span>
                                        <span className="text-slate-800">%{item.growthScore}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${item.growthScore > 75 ? 'bg-emerald-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${item.growthScore}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-black">
                                    <div className="text-slate-400 uppercase">Aktif İlan</div>
                                    <div className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{item.listingCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                <Map size={120} className="absolute right-0 bottom-0 opacity-5 pointer-events-none" />
                <div className="max-w-xl">
                    <h3 className="text-lg font-black mb-3 flex items-center gap-2">
                        <TrendingUp className="text-emerald-400" />
                        AI Bölgesel Yatırım Öngörüsü
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                        "Cunda bölgesindeki butik otel ve tarihi bina talebi, piyasa genelinden %25 daha hızlı değerlenmeye devam ediyor. Yatırımcıları Sarımsaklı bölgesindeki yeni konut projelerinden ziyade, Cunda'daki restorasyon fırsatlarına yönlendirmek maksimum ROI sağlayacaktır."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarketTrendDashboard;
