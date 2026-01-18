import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PerformanceDetailModal from './PerformanceDetailModal';
import PortfolioDashboard from './PortfolioDashboard';
import {
    Users, Home, TrendingUp, CheckCircle, PhoneCall,
    Calendar, BarChart2, Award, Star
} from 'lucide-react';

const PerformanceDashboard = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedConsultant, setSelectedConsultant] = useState(null);

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/performance');
            // Sort by total activity for leaderboard
            const sortedData = response.data.sort((a, b) => {
                const scoreA = a.stats.active_sale + a.stats.active_rent + (a.stats.interactions_monthly * 0.5);
                const scoreB = b.stats.active_sale + b.stats.active_rent + (b.stats.interactions_monthly * 0.5);
                return scoreB - scoreA;
            });
            setPerformanceData(sortedData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching performance:', err);
            setError('Performans verileri yüklenirken bir hata oluştu.');
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12 text-gray-500">Yükleniyor...</div>;
    if (error) return <div className="p-6 text-red-500 bg-red-50 rounded-xl border border-red-100">{error}</div>;

    const topConsultant = performanceData[0];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Danışman Performansı</h2>
                    <p className="text-slate-500 mt-1">Ekibinizin aylık başarı ve portföy gelişimi verileri.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button className="px-3 py-1 text-sm bg-white rounded shadow-sm text-slate-700 font-medium">Bu Ay</button>
                    <button className="px-3 py-1 text-sm text-slate-500 hover:text-slate-700">Geçen Ay</button>
                    <button className="px-3 py-1 text-sm text-slate-500 hover:text-slate-700">Yıllık</button>
                </div>
            </div>

            {/* Quick Stats / Leaderboard */}
            {performanceData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 flex items-center justify-between overflow-hidden relative border-0">
                        <div className="relative z-10">
                            <span className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full border border-white/10">Ayın Yıldızı</span>
                            <h3 className="text-2xl font-bold mt-2">{topConsultant.email.split('@')[0]}</h3>
                            <p className="text-indigo-200 text-sm mt-1">{topConsultant.stats.active_sale + topConsultant.stats.active_rent} Aktif İlan | {topConsultant.stats.interactions_monthly} Etkileşim</p>
                            <button
                                onClick={() => setSelectedConsultant(topConsultant)}
                                className="mt-4 bg-white text-indigo-600 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Detayları Gör
                            </button>
                        </div>
                        <Award size={120} className="text-white/10 absolute -right-6 -bottom-6 rotate-12" />
                        <Star className="text-amber-400 absolute top-6 right-8 animate-pulse" fill="#f59e0b" size={32} />
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Toplam Portföy</span>
                        <div className="text-3xl font-black text-slate-800 mt-1">
                            {performanceData.reduce((acc, curr) => acc + curr.stats.active_sale + curr.stats.active_rent, 0)}
                        </div>
                        <span className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> +12% artış
                        </span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Ekip Etkileşimi</span>
                        <div className="text-3xl font-black text-slate-800 mt-1">
                            {performanceData.reduce((acc, curr) => acc + curr.stats.interactions_monthly, 0)}
                        </div>
                        <span className="text-slate-400 text-xs mt-2">Bu ayki toplam görüşme</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {performanceData.map((consultant, index) => (
                    <div key={consultant.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative">
                        {index === 0 && (
                            <div className="absolute top-0 right-0 z-10">
                                <div className="bg-amber-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                    <Star size={10} fill="white" /> Lider
                                </div>
                            </div>
                        )}
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${index === 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center font-bold text-lg shadow-inner`}>
                                    {consultant.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{consultant.email}</h3>
                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-emerald-100/50">Danışman</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-slate-400 block uppercase tracking-tighter mb-1 font-bold">Portföy Gücü</span>
                                <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-1000"
                                        style={{ width: `${Math.min((consultant.stats.active_sale + consultant.stats.active_rent) * 10, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-100 border-b border-slate-100">
                            <StatBox
                                label="Satılık İlan"
                                value={consultant.stats.active_sale}
                                icon={<Home size={18} />}
                                color="blue"
                            />
                            <StatBox
                                label="Kiralık İlan"
                                value={consultant.stats.active_rent}
                                icon={<TrendingUp size={18} />}
                                color="purple"
                            />
                            <StatBox
                                label="Yeni Portföy"
                                subLabel="(Bu Ay)"
                                value={consultant.stats.new_portfolio_monthly}
                                icon={<CheckCircle size={18} />}
                                color="emerald"
                            />
                            <StatBox
                                label="Aktif Müşteri"
                                value={consultant.stats.total_clients}
                                icon={<Users size={18} />}
                                color="amber"
                            />
                            <StatBox
                                label="İşlemler"
                                subLabel="(Bu Ay)"
                                value={consultant.stats.interactions_monthly}
                                icon={<PhoneCall size={18} />}
                                color="rose"
                            />
                            <StatBox
                                label="Biten Görev"
                                value={consultant.stats.completed_tasks_monthly}
                                icon={<Calendar size={18} />}
                                color="indigo"
                            />
                        </div>

                        <div className="p-4 bg-white flex justify-end">
                            <button
                                onClick={() => setSelectedConsultant(consultant)}
                                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group transition-all"
                            >
                                <BarChart2 size={16} className="group-hover:scale-110 transition-transform" />
                                Detaylı Analiz
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {performanceData.length === 0 && (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Users className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium">Henüz performans verisi olan danışman bulunmuyor.</p>
                </div>
            )}

            {/* Performance Detail Modal */}
            {selectedConsultant && (
                <PerformanceDetailModal
                    consultant={selectedConsultant}
                    onClose={() => setSelectedConsultant(null)}
                />
            )}

            {/* Agency Portfolio Stats */}
            <div className="mt-8 border-t border-slate-200 pt-8">
                <PortfolioDashboard mode="agency" />
            </div>
        </div>
    );
};

const StatBox = ({ label, subLabel, value, icon, color }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    };

    return (
        <div className="p-4 hover:bg-slate-50 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 border shadow-sm ${colors[color]}`}>
                {icon}
            </div>
            <div className="text-2xl font-black text-slate-800">{value}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                {label} {subLabel && <span className="text-[8px] opacity-70 block">{subLabel}</span>}
            </div>
        </div>
    );
};

export default PerformanceDashboard;
