import React, { useState, useEffect } from 'react';
import { Landmark, TrendingDown, TrendingUp, AlertCircle, CheckCircle2, DollarSign, BrainCircuit } from 'lucide-react';
import api from '../../services/api';

const FinancialProfilerWidget = ({ clientId }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, [clientId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/clients/${clientId}/financial-profile`);
            setProfile(res.data);
        } catch (error) {
            console.error('Profiling error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 font-bold uppercase text-[10px] tracking-widest">Müşteri Finansalları Analiz Ediliyor...</div>;
    if (!profile || profile.status === 'incomplete') return null;

    const getStatusColor = (status) => {
        if (status === 'High') return 'bg-emerald-500 text-white';
        if (status === 'Medium') return 'bg-amber-500 text-white';
        return 'bg-rose-500 text-white';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-indigo-700 p-4 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                    <Landmark size={18} />
                    Finansal Profilleme & Kalifikasyon
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(profile.preQualificationStatus)}`}>
                    {profile.preQualificationStatus === 'High' ? 'NİTELİKLİ ALICI' : 'LİMİTLİ ALICI'}
                </span>
            </div>

            <div className="p-6">
                {/* Score & Gauge */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                className={profile.realismScore > 80 ? 'text-emerald-500' : profile.realismScore > 50 ? 'text-amber-500' : 'text-rose-500'}
                                strokeDasharray={364}
                                strokeDashoffset={364 - (364 * profile.realismScore) / 100}
                                strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-800">%{profile.realismScore}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">GERÇEKÇİLİK</span>
                        </div>
                    </div>
                </div>

                {/* Fast Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <DollarSign size={10} /> Müşteri Bütçesi
                        </div>
                        <div className="text-xs font-black text-gray-800">{profile.maxBudget?.toLocaleString('tr-TR')} ₺</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <TrendingUp size={10} /> Piyasa Ortalaması
                        </div>
                        <div className="text-xs font-black text-gray-800">{profile.marketAvg?.toLocaleString('tr-TR')} ₺</div>
                    </div>
                </div>

                {/* AI Insight */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 relative">
                    <BrainCircuit size={48} className="absolute -right-2 -bottom-2 text-indigo-500 opacity-5" />
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-2 flex items-center gap-1">
                        <CheckCircle2 size={12} /> AI STRATEJİSİ
                    </h4>
                    <div className="text-xs text-indigo-900 leading-relaxed italic whitespace-pre-line">
                        {profile.aiInsight}
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <AlertCircle size={14} className="text-slate-400" />
                    <span className="text-[9px] text-slate-400 font-medium italic">
                        "Piyasa verileri anlık olaral taranan 1000+ ilan üzerinden hesaplanmıştır."
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FinancialProfilerWidget;
