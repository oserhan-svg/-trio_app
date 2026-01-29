import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PerformanceDetailModal from './PerformanceDetailModal';
import {
    Users, TrendingUp, PhoneCall, Calendar,
    BarChart2, Award, Star, Search, Filter,
    Briefcase, CheckCircle2, MoreHorizontal
} from 'lucide-react';

const PerformanceDashboard = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/performance');
            const sortedData = response.data.sort((a, b) => {
                const scoreA = a.stats.active_sale + a.stats.active_rent + (a.stats.interactions_monthly * 0.5);
                const scoreB = b.stats.active_sale + b.stats.active_rent + (b.stats.interactions_monthly * 0.5);
                return scoreB - scoreA;
            });
            setPerformanceData(sortedData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching performance:', err);
            setError('Veri yüklenemedi.');
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8 text-slate-400 text-sm">Yükleniyor...</div>;
    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-lg text-sm border border-red-100">{error}</div>;

    const filteredData = performanceData.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPortfolio = performanceData.reduce((acc, curr) => acc + curr.stats.active_sale + curr.stats.active_rent, 0);
    const totalInteractions = performanceData.reduce((acc, curr) => acc + curr.stats.interactions_monthly, 0);
    const topPerformer = performanceData[0];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Ultra-Compact Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Briefcase size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Toplam Portföy</p>
                            <h3 className="text-lg font-bold text-slate-800">{totalPortfolio} <span className="text-xs font-normal text-emerald-500">+4%</span></h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <PhoneCall size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Aylık Etkileşim</p>
                            <h3 className="text-lg font-bold text-slate-800">{totalInteractions} <span className="text-xs font-normal text-slate-400">görüşme</span></h3>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3 rounded-xl shadow-sm flex items-center justify-between text-white relative overflow-hidden">
                    <div className="flex items-center gap-3 z-10">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Award size={18} className="text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-300 uppercase tracking-wide font-bold">Ayın Lideri</p>
                            <h3 className="text-sm font-bold">{topPerformer?.name || 'Belirlenmedi'}</h3>
                        </div>
                    </div>
                    <Star className="absolute -right-2 -bottom-2 text-white/5 rotate-12" size={60} />
                </div>
            </div>

            {/* 2. Compact Toolbar */}
            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Danışman ara..."
                        className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 bg-slate-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100">
                        <Filter size={14} /> Filtrele
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100">
                        <Calendar size={14} /> Bu Ay
                    </button>
                </div>
            </div>

            {/* 3. High Density Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                            <th className="px-4 py-3 font-semibold">Danışman</th>
                            <th className="px-4 py-3 font-semibold text-center">Rol</th>
                            <th className="px-4 py-3 font-semibold text-center">Satılık</th>
                            <th className="px-4 py-3 font-semibold text-center">Kiralık</th>
                            <th className="px-4 py-3 font-semibold text-center">Etkileşim</th>
                            <th className="px-4 py-3 font-semibold text-center">Başarı Skoru</th>
                            <th className="px-4 py-3 font-semibold text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.map((consultant, index) => (
                            <tr key={consultant.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                                            {consultant.name ? consultant.name.charAt(0) : consultant.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{consultant.name || 'İsimsiz'}</p>
                                            <p className="text-[10px] text-slate-400">{consultant.email}</p>
                                        </div>
                                        {index === 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">1.</span>}
                                        {index === 1 && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">2.</span>}
                                        {index === 2 && <span className="ml-1 px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold rounded">3.</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700">
                                        Danışman
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className="text-sm font-bold text-slate-700">{consultant.stats.active_sale}</span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className="text-sm font-bold text-slate-700">{consultant.stats.active_rent}</span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1 text-slate-600">
                                        <PhoneCall size={12} className="text-slate-400" />
                                        <span className="text-sm font-semibold">{consultant.stats.interactions_monthly}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${Math.min(((consultant.stats.active_sale + consultant.stats.active_rent) * 5), 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-emerald-600">{Math.min(((consultant.stats.active_sale + consultant.stats.active_rent) * 5), 100)}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <button
                                        onClick={() => setSelectedConsultant(consultant)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedConsultant && (
                <PerformanceDetailModal
                    consultant={selectedConsultant}
                    onClose={() => setSelectedConsultant(null)}
                />
            )}
        </div>
    );
};

export default PerformanceDashboard;
