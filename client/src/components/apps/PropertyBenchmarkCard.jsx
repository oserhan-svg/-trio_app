import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Loader2, MapPin, Building, ExternalLink, Zap, Brain, MessageCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const PropertyBenchmarkCard = ({ propertyId }) => {
    const [loading, setLoading] = useState(false);
    const [generatingPitch, setGeneratingPitch] = useState(false);
    const [data, setData] = useState(null);
    const [pitch, setPitch] = useState(null);

    useEffect(() => {
        if (propertyId) {
            fetchBenchmarks();
        }
    }, [propertyId]);

    const fetchBenchmarks = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/properties/${propertyId}/twins`);
            setData(response.data);
            setPitch(null); // Reset pitch when changing property
        } catch (error) {
            console.error('Benchmark Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePitch = async () => {
        setGeneratingPitch(true);
        try {
            const response = await api.get(`/listings/${propertyId}/appraisal-pitch`);
            setPitch(response.data.data);
        } catch (error) {
            console.error('Pitch Error:', error);
        } finally {
            setGeneratingPitch(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <Loader2 className="animate-spin mb-2" size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">Pazar Verileri Analiz Ediliyor...</span>
            </div>
        );
    }

    if (!data || data.market.sample_size === 0) {
        return (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <Info size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Bu bölge için yeterli pazar verisi bulunamadı.</p>
            </div>
        );
    }

    const { market, twins } = data;
    const isUnderpriced = market.deviation < -5;
    const isOverpriced = market.deviation > 5;
    const isFair = !isUnderpriced && !isOverpriced;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Market Position Badge */}
            <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Pazar Konumu</div>
                    <div className={`text-xl font-black flex items-center gap-2 ${isUnderpriced ? 'text-emerald-600' : isOverpriced ? 'text-rose-600' : 'text-blue-600'}`}>
                        {isUnderpriced && <TrendingDown size={24} />}
                        {isOverpriced && <TrendingUp size={24} />}
                        {isFair && <Minus size={24} />}
                        {isUnderpriced ? 'Fırsat Fiyat' : isOverpriced ? 'Piyasa Üstü' : 'Adil Fiyat'}
                    </div>
                </div>
                <div className="text-right relative z-10">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Sapma</div>
                    <div className={`text-xl font-black ${isUnderpriced ? 'text-emerald-600' : isOverpriced ? 'text-rose-600' : 'text-blue-600'}`}>
                        {market.deviation > 0 ? '+' : ''}{market.deviation}%
                    </div>
                </div>
                {/* Background Decor */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${isUnderpriced ? 'bg-emerald-500' : isOverpriced ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
            </div>

            {/* Price vs Market Gauge */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 text-center md:text-left">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ortalama m² Birim Fiyatı</div>
                        <div className="text-2xl font-black tracking-tight">{Math.round(market.avg_price_per_m2).toLocaleString()} ₺</div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">Bölgedeki {market.sample_size} benzer ilan baz alınmıştır.</p>
                    </div>
                    <div className="h-12 w-px bg-white/10 hidden md:block"></div>
                    <div className="flex-1 text-center md:text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">İlan m² Birim Fiyatı</div>
                        <div className="text-2xl font-black tracking-tight">{Math.round(data.target.price_per_m2).toLocaleString()} ₺</div>
                        <div className={`text-[11px] font-bold mt-1 inline-flex items-center gap-1 ${isUnderpriced ? 'text-emerald-400' : isOverpriced ? 'text-rose-400' : 'text-blue-400'}`}>
                            {isUnderpriced ? '(Bölgeye göre daha uygun)' : isOverpriced ? '(Bölgeye göre daha yüksek)' : '(Piyasa standartlarında)'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Twins List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Building size={16} className="text-indigo-500" />
                        Mahalle İkizleri (Benzerler)
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Yakın {twins.length} İlan</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {twins.map(twin => (
                        <div key={twin.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-md group">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                {twin.images && twin.images[0] ? (
                                    <img src={twin.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Building size={20} /></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate mb-1">{twin.title}</div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                    <span>{twin.size_m2} m²</span>
                                    <span>•</span>
                                    <span>{Math.round(twin.price / twin.size_m2).toLocaleString()} ₺/m²</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-indigo-600">{Number(twin.price).toLocaleString()} ₺</div>
                                <a href={twin.url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-slate-400 hover:text-indigo-500 uppercase flex items-center justify-end gap-1 mt-1 transition-colors">
                                    İncele <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Appraisal Pitch Section */}
            <div className="pt-6 border-t border-slate-100">
                {!pitch ? (
                    <button
                        onClick={handleGeneratePitch}
                        disabled={generatingPitch}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {generatingPitch ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                        AI Değerleme Raporu Üret
                    </button>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl">
                            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap size={14} /> AI Pazar Analizi
                            </h4>
                            <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                                {pitch.market_analysis}
                            </p>
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-3xl">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ArrowRight size={14} className="text-blue-400" /> Danışman Stratejisi
                            </h4>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                {pitch.consultant_strategy}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <MessageCircle size={16} className="text-emerald-500" /> Mülk Sahibi İkna Mesajı
                            </h4>
                            <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm text-slate-700 italic leading-relaxed relative group">
                                {pitch.owner_message}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(pitch.owner_message);
                                        alert('Kopyalandı');
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-slate-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    📄
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyBenchmarkCard;
