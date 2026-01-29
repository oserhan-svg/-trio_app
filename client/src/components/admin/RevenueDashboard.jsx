import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Users,
    ChevronRight,
    Loader2,
    Target,
    Zap,
    FileText,
    Calculator
} from 'lucide-react';
import api from '../../services/api';

const RevenueDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchFinancials();
    }, []);

    const fetchFinancials = async () => {
        setLoading(true);
        try {
            const response = await api.get('/deals/stats');
            setData(response.data);
        } catch (error) {
            console.error('Financial Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    if (!data) return null;

    const { actual, forecast } = data;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Revenue Pulse Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Ciro"
                    value={actual.totalRevenue}
                    suffix=" ₺"
                    icon={DollarSign}
                    color="indigo"
                    trend="+12%"
                />
                <StatCard
                    title="Satış Hacmi"
                    value={actual.totalSalesVolume}
                    suffix=" ₺"
                    icon={TrendingUp}
                    color="blue"
                    trend="+8%"
                />
                <StatCard
                    title="Biten İşlemler"
                    value={actual.dealCount}
                    suffix=" Adet"
                    icon={Target}
                    color="emerald"
                    trend="+2"
                />
                <StatCard
                    title="AI Gelir Tahmini"
                    value={forecast.projectedRevenue}
                    suffix=" ₺"
                    icon={Zap}
                    color="purple"
                    isForecast
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Actual Performance Chart (Simplified) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Ciro Dağılımı</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Aylık Gerçekleşen Gelir</p>
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black uppercase text-indigo-600">6 Aylık</button>
                            <button className="px-4 py-1.5 text-[10px] font-black uppercase text-slate-400">Yıllık</button>
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-4 px-2">
                        {actual.monthlyData.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full bg-slate-50 rounded-2xl relative h-full flex items-end overflow-hidden">
                                    <div
                                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-2xl transition-all duration-1000 group-hover:from-indigo-500 group-hover:to-indigo-300"
                                        style={{ height: `${(m.revenue / actual.totalRevenue) * 100}%`, minHeight: '10%' }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{m.month.split('-')[1]}. Ay</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Forecast Radar (Weighted Pipeline) */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={16} className="text-indigo-400 fill-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">AI Tahminleme</span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight mb-2">Ağırlıklı Pipeline</h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Yapay zeka, pipeline'ınızdaki {forecast.leadCount} aday için kapanma ihtimaline göre beklenen geliri hesaplar.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4 my-8">
                        {forecast.weightedLeads.map((lead, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-100 truncate">{lead.client}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">%{lead.probability} İhtimal</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-indigo-300">+{Math.round(lead.weighted).toLocaleString()} ₺</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative z-10 p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Potansiyel Komisyon</div>
                        <div className="text-2xl font-black text-white">{Math.round(forecast.projectedRevenue).toLocaleString()} ₺</div>
                    </div>
                </div>
            </div>

            {/* 4. Efficiency Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Calculator size={18} className="text-emerald-500" /> İşlem Verimliliği
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ortalama Satış</div>
                            <div className="text-xl font-black text-slate-800">
                                {actual.dealCount > 0 ? Math.round(actual.totalSalesVolume / actual.dealCount).toLocaleString() : 0} ₺
                            </div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ortalama Komisyon</div>
                            <div className="text-xl font-black text-indigo-600">
                                {actual.dealCount > 0 ? Math.round(actual.totalRevenue / actual.dealCount).toLocaleString() : 0} ₺
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg flex items-center justify-between group">
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Dijital İşlem Arşivi</h4>
                        <p className="text-xs text-slate-500 font-medium">Kapanan tüm işlemlerin dökümüne ulaşın.</p>
                        <button className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
                            <FileText size={16} /> Tüm Raporlar
                        </button>
                    </div>
                    <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <PieChart size={48} className="text-slate-200" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, suffix, icon: Icon, color, trend, isForecast }) => (
    <div className={`p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300 group`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            {trend && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend}
                </span>
            )}
            {isForecast && (
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-purple-50 text-purple-600 flex items-center gap-1">
                    <Zap size={8} fill="currentColor" /> FORECAST
                </span>
            )}
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
        <div className="text-xl font-black text-slate-900 tracking-tight">
            {Number(value).toLocaleString()}{suffix}
        </div>
    </div>
);

export default RevenueDashboard;
