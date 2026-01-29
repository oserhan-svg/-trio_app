import React, { useState, useEffect } from 'react';
import { LineChart, BarChart3, TrendingUp, Clock, DollarSign, Target, PieChart, Info, Waves } from 'lucide-react';
import api from '../../services/api';

const PredictiveRevenueDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBI();
    }, []);

    const fetchBI = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/bi-dashboard');
            setData(res.data);
        } catch (error) {
            console.error('BI Fetch failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="space-y-6 animate-pulse p-1">
            <div className="h-24 bg-white rounded-2xl border border-slate-100 shadow-sm"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-48 bg-slate-900 rounded-2xl shadow-xl"></div>
                <div className="h-48 bg-white rounded-2xl border border-slate-100 shadow-sm"></div>
                <div className="h-48 bg-white rounded-2xl border border-slate-100 shadow-sm"></div>
            </div>
            <div className="h-24 bg-indigo-50 rounded-2xl border border-indigo-100"></div>
        </div>
    );

    if (!data || !data.projection) return (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <TrendingUp size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-800">Henüz Analiz Verisi Yok</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                Predictive Dashboard için yeterli veri (Pazarlık aşamasında ilan vb.) bulunamadı.
            </p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                        <LineChart size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Öngörülü Ciro & Pipeline Dashboard</h2>
                        <p className="text-xs text-slate-500">Satış hızı ve olasılık bazlı gelir tahminleme sistemi.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Projection Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <Waves className="absolute right-0 bottom-0 opacity-10 pointer-events-none" size={150} />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300">Öngörülen Aylık Hakediş</h3>
                        <TrendingUp size={20} className="text-emerald-400" />
                    </div>
                    <div className="text-4xl font-black mb-2">{data.projection.totalPotential.toLocaleString('tr-TR')} ₺</div>
                    <div className="text-[10px] text-indigo-300 font-bold mb-6 flex items-center gap-1">
                        <Target size={12} /> {data.projection.dealCount} Aktif Fırsatın Olasılık Ağırlıklı Ortalaması
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                        <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                            <span>Tahmin Güveni</span>
                            <span className="text-emerald-400">{data.projection.targetConfidence}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[75%]" />
                        </div>
                    </div>
                </div>

                {/* Pipeline Velocity Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <Clock size={14} className="text-blue-500" /> Pipeline Hızı (Gün)
                    </h3>
                    <div className="space-y-4">
                        <VelocityItem label="Yeni ➔ Aktif" days={data.velocity.newToActive} color="bg-blue-400" max={15} />
                        <VelocityItem label="Aktif ➔ Pazarlık" days={data.velocity.activeToNegotiation} color="bg-indigo-400" max={15} />
                        <VelocityItem label="Pazarlık ➔ Kapanış" days={data.velocity.negotiationToClosed} color="bg-emerald-400" max={15} />
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold">Toplam Döngü</span>
                        <span className="font-black text-slate-800">{data.velocity.totalCycleTime} GÜN</span>
                    </div>
                </div>

                {/* Consultant Efficiency Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <PieChart size={14} className="text-purple-500" /> Danışman Verimliliği
                    </h3>
                    <div className="space-y-4 max-h-[180px] overflow-y-auto">
                        {data.efficiency.map((c, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="text-xs font-bold text-gray-700">{c.name}</div>
                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">%{c.conversionRate}</div>
                                    <div className="text-[10px] font-bold text-gray-400">{c.leadsPerMonth} Lead/ay</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Advisor Box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <BarChart3 className="text-indigo-600" size={32} />
                </div>
                <div>
                    <h4 className="font-black text-indigo-900 text-sm mb-1 uppercase tracking-tight">AI Strateji Önerisi</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed italic">
                        "Pipeline hızı geçen aya göre %12 yavaşlamış durumda. Özellikle 'Pazarlık ➔ Kapanış' aşamasındaki 8 günlük süreyi 5 güne çekmek, nakit akışınızı bu ay %20 artıracaktır. Danışmanlara kapora sürecini hızlandırmaları için dijital imza araçlarını hatırlatın."
                    </p>
                </div>
            </div>
        </div>
    );
};

const VelocityItem = ({ label, days, color, max }) => (
    <div>
        <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
            <span>{label}</span>
            <span className="text-slate-800">{days} Gün</span>
        </div>
        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${(days / max) * 100}%` }} />
        </div>
    </div>
);

export default PredictiveRevenueDashboard;
