import React, { useState, useEffect } from 'react';
import { ShieldAlert, Swords, TrendingDown, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const CompetitorWarRoomWidget = ({ propertyId }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalysis();
    }, [propertyId]);

    const loadAnalysis = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/competitors/analyze/${propertyId}`);
            setAnalysis(res.data);
        } catch (error) {
            console.error('War room analysis error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">Rakip stratejileri çözümleniyor...</div>;
    if (!analysis) return null;

    const { myPrice, competitors, threatCount, strategy } = analysis;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Swords size={20} />
                    Competitor War Room (Rakip Analizi)
                </h3>
                {threatCount > 0 && (
                    <span className="bg-white/20 text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
                        {threatCount} TEHDİT TESPİT EDİLDİ
                    </span>
                )}
            </div>

            <div className="p-5">
                {/* Situation Overview */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bizim Fiyatımız</div>
                        <div className="text-xl font-black text-slate-800">{myPrice.toLocaleString('tr-TR')} ₺</div>
                    </div>
                    <div className="flex-1 bg-rose-50 p-3 rounded-lg border border-rose-100 text-right">
                        <div className="text-[10px] font-bold text-rose-400 uppercase mb-1">En Ucuz Rakip</div>
                        <div className="text-xl font-black text-rose-700">
                            {competitors.length > 0 ? Math.min(...competitors.map(c => c.price)).toLocaleString('tr-TR') : '-'} ₺
                        </div>
                    </div>
                </div>

                {/* Strategy Card */}
                <div className={`p-4 rounded-xl border-2 mb-6 ${strategy.urgency === 'high' ? 'bg-red-50 border-red-200' :
                        strategy.urgency === 'medium' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${strategy.urgency === 'high' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                            }`}>
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase opacity-60">ÖNERİLEN STRATEJİ</div>
                            <h4 className="font-black text-gray-800 text-lg leading-tight mb-2">
                                {strategy.type}: {strategy.label}
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed mb-3">
                                {strategy.recommendation}
                            </p>
                            {strategy.targetPrice && strategy.targetPrice !== myPrice && (
                                <div className="bg-white/60 p-2 rounded border border-current text-xs font-bold inline-block">
                                    Hedef Savunma Fiyatı: {strategy.targetPrice.toLocaleString('tr-TR')} ₺
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Competitor List */}
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">TESPİT EDİLEN RAKİPLER</h4>
                <div className="space-y-2">
                    {competitors.length > 0 ? (
                        competitors.sort((a, b) => a.price - b.price).map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition">
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="text-xs font-bold text-gray-800 truncate">{c.title}</div>
                                    <div className="text-[10px] text-gray-400">Rakip İlan</div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <div>
                                        <div className="text-sm font-black text-gray-900">{c.price.toLocaleString('tr-TR')} ₺</div>
                                        <div className={`text-[10px] font-bold ${parseFloat(c.diff) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {c.diff}% {parseFloat(c.diff) < 0 ? 'Daha Ucuz' : 'Daha Pahalı'}
                                        </div>
                                    </div>
                                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500 transition">
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 italic text-xs">
                            Şu an direkt rakip bulunamadı.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompetitorWarRoomWidget;
