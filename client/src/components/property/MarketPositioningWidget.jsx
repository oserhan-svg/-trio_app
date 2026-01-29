import React, { useState, useEffect } from 'react';
import { Target, TrendingDown, TrendingUp, AlertCircle, HelpCircle, ArrowRightCircle } from 'lucide-react';
import api from '../../services/api';

const MarketPositioningWidget = ({ propertyId }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalysis();
    }, [propertyId]);

    const loadAnalysis = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/appraisal/property/${propertyId}`);
            setAnalysis(res.data);
        } catch (error) {
            console.error('Appraisal load error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse bg-gray-50 h-64 rounded-xl border border-gray-100"></div>;
    if (!analysis) return null;

    const { currentPrice, fairMarketValue, positioning, confidence, comparableCount, suggestion } = analysis;

    const isOverpriced = positioning > 5;
    const isUnderpriced = positioning < -5;
    const isFair = !isOverpriced && !isUnderpriced;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                    <Target size={18} className="text-blue-400" />
                    Piyasa Konumlandırma Analizi
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-70">
                    Güven Skoru:
                    <span className={
                        confidence === 'high' ? 'text-emerald-400' :
                            confidence === 'medium' ? 'text-orange-400' : 'text-red-400'
                    }>{confidence}</span>
                </div>
            </div>

            <div className="p-6">
                {/* Metrics Center */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Piyasa Rayiç Değeri</div>
                        <div className="text-xl font-black text-gray-800">
                            {fairMarketValue.toLocaleString('tr-TR')} ₺
                        </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Piyasa Sapması</div>
                        <div className={`text-xl font-black flex items-center justify-center gap-1 ${isOverpriced ? 'text-red-600' : isUnderpriced ? 'text-emerald-600' : 'text-blue-600'
                            }`}>
                            {positioning > 0 ? '+' : ''}{positioning}%
                            {isOverpriced ? <TrendingUp size={18} /> : isUnderpriced ? <TrendingDown size={18} /> : null}
                        </div>
                    </div>
                </div>

                {/* Positioning Bar */}
                <div className="relative h-12 bg-gray-100 rounded-full mb-8 flex items-center px-2">
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-red-400 rounded-full mx-10 opacity-30"></div>

                    {/* Zones */}
                    <div className="absolute left-0 w-20 text-[9px] font-bold text-emerald-600 text-center">-20% (Fırsat)</div>
                    <div className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-600 text-center">Rayiç</div>
                    <div className="absolute right-0 w-20 text-[9px] font-bold text-red-600 text-center">+20% (Pahalı)</div>

                    {/* Indicator */}
                    <div
                        className="absolute w-8 h-8 bg-white border-4 border-slate-800 rounded-full shadow-lg transition-all duration-1000 flex items-center justify-center z-10"
                        style={{ left: `calc(${Math.min(max(positioning + 50, 5), 95)}% - 16px)` }}
                    >
                        <div className="w-2 h-2 bg-slate-800 rounded-full animate-ping"></div>
                    </div>
                </div>

                {/* Suggestion Card */}
                {suggestion && (
                    <div className={`p-4 rounded-xl border-l-4 ${suggestion.action === 'price_reduction' ? 'bg-red-50 border-red-400' :
                            suggestion.action === 'premium_positioning' ? 'bg-emerald-50 border-emerald-400' :
                                'bg-blue-50 border-blue-400'
                        }`}>
                        <div className="flex items-start gap-3">
                            {suggestion.action === 'price_reduction' ? <AlertCircle className="text-red-500 shrink-0" size={20} /> :
                                suggestion.action === 'premium_positioning' ? <TrendingDown className="text-emerald-500 shrink-0" size={20} /> :
                                    <CheckCircle className="text-blue-500 shrink-0" size={20} />}

                            <div>
                                <h4 className="font-bold text-gray-800 text-sm mb-1">Strateji Önerisi</h4>
                                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                                    {suggestion.reason}
                                </p>

                                {suggestion.target !== currentPrice && (
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-bold text-gray-500">Hedef Fiyat:</div>
                                        <div className="text-sm font-black text-slate-800">
                                            {suggestion.target.toLocaleString('tr-TR')} ₺
                                        </div>
                                        <ArrowRightCircle size={14} className="text-blue-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 text-[9px] text-gray-400 text-center italic">
                    * Bu analiz bölgedeki {comparableCount} benzer ilan verisi kullanılarak oluşturulmuştur.
                </div>
            </div>
        </div>
    );
};

const max = (a, b) => a > b ? a : b;

const CheckCircle = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default MarketPositioningWidget;
