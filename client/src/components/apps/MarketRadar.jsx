import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Home, Building, TreeDeciduous, ExternalLink, TrendingUp, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const MarketRadar = ({ onBack }) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('daire');
    const [ownerOnly, setOwnerOnly] = useState(false);
    const [error, setError] = useState(null);

    const categories = [
        { id: 'daire', label: 'Daire', icon: Building, color: 'blue' },
        { id: 'villa', label: 'Villa', icon: Home, color: 'purple' },
        { id: 'arsa', label: 'Arsa', icon: TreeDeciduous, color: 'emerald' },
        { id: 'zeytinlik', label: 'Zeytinlik', icon: TreeDeciduous, color: 'lime' },
        { id: 'tarla', label: 'Tarla', icon: TreeDeciduous, color: 'amber' },
        { id: 'commercial', label: 'İşyeri', icon: Building, color: 'gray' },
        { id: 'tourism', label: 'Turizm', icon: Home, color: 'orange' }
    ];

    const fetchProperties = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                limit: 50,
                opportunity_filter: 'opportunity',
                radar_category: activeCategory,
                seller_type: ownerOnly ? 'owner' : undefined
            };

            const response = await api.get('/properties', { params });
            const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setProperties(data);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
            setError('Veriler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [activeCategory, ownerOnly]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <div className="bg-slate-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[700px] flex flex-col font-sans">
            {/* Header */}
            <div className="p-8 pb-10 border-b border-gray-100 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="group p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 text-gray-500 hover:text-blue-600"
                            >
                                <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-rose-500 rounded-lg shadow-lg shadow-rose-200">
                                    <TrendingUp size={20} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                    Fırsat Radarı
                                </h2>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Piyasa ortalamasının altındaki en iyi {activeCategory} ilanları</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                        <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
                            <button
                                onClick={() => setOwnerOnly(false)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${!ownerOnly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Tüm İlanlar
                            </button>
                            <button
                                onClick={() => setOwnerOnly(true)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${ownerOnly ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Sahibinden
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-72 bg-white border-r border-gray-100 p-6 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
                    <div className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Kategoriler</div>
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;
                        const colors = {
                            blue: 'from-blue-500 to-blue-600 shadow-blue-200',
                            purple: 'from-purple-500 to-purple-600 shadow-purple-200',
                            emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
                            lime: 'from-lime-500 to-lime-600 shadow-lime-200',
                            amber: 'from-amber-500 to-amber-600 shadow-amber-200',
                            orange: 'from-orange-500 to-orange-600 shadow-orange-200',
                            gray: 'from-slate-500 to-slate-600 shadow-slate-200'
                        };

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-500 w-full text-left group relative ${isActive
                                    ? 'bg-slate-900 text-white shadow-xl translate-x-1'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                                    }`}
                            >
                                <div className={`p-2.5 rounded-xl transition-all duration-500 shadow-lg ${isActive ? `bg-gradient-to-br ${colors[cat.color]} scale-110` : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-gray-600'}`}>
                                    <Icon size={20} />
                                </div>
                                <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-slate-900'}`}>{cat.label}</span>
                                {isActive && (
                                    <div className="absolute right-4 w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 p-8 bg-slate-50/50 backdrop-blur-sm overflow-y-auto custom-scrollbar h-[700px]">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600"></div>
                                <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
                            </div>
                            <p className="font-bold text-lg text-slate-700">Piyasa verileri analiz ediliyor...</p>
                            <p className="text-sm">En iyi fırsatlar senin için taranıyor</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <AlertCircle size={64} className="text-rose-400 mb-6" />
                            <p className="font-bold text-xl text-slate-800 mb-2">{error}</p>
                            <button onClick={fetchProperties} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">Tekrar Dene</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {properties.length > 0 ? properties.map(p => (
                                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col sm:flex-row gap-0 overflow-hidden relative">
                                    {/* Image Section */}
                                    <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-gray-100 relative overflow-hidden">
                                        {p.images && p.images[0] ? (
                                            <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 flex-col gap-2">
                                                <Building size={40} className="opacity-20" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Görüntü Yok</span>
                                            </div>
                                        )}

                                        {/* Badges on Image */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            <div className="bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black shadow-lg border border-gray-100 text-slate-900 uppercase tracking-tighter">
                                                {p.district}
                                            </div>
                                            {p.seller_type === 'owner' && (
                                                <div className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1.5 border border-yellow-500/20">
                                                    Sahibinden
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] font-bold border border-white/10 flex items-center gap-2">
                                            <TrendingUp size={12} className="text-rose-400" />
                                            %{Math.abs(p.deviation)} {p.deviation < 0 ? 'Daha Uygun' : 'Daha Yüksek'}
                                        </div>
                                    </div>

                                    {/* Details Section */}
                                    <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                                        <div>
                                            <div className="flex justify-between items-start mb-3 gap-4">
                                                <h3 className="font-extrabold text-gray-900 line-clamp-2 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                                                    {p.title?.split('#')[0].trim()}
                                                </h3>
                                                <a
                                                    href={p.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2.5 rounded-xl bg-slate-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 flex-shrink-0 border border-transparent hover:border-blue-100 shadow-sm"
                                                >
                                                    <ExternalLink size={18} />
                                                </a>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <div className="px-3 py-1.5 bg-slate-50 border border-gray-100 rounded-lg text-[11px] font-bold text-gray-600 flex items-center gap-1.5 shadow-sm">
                                                    <Building size={14} className="text-slate-400" />
                                                    {p.rooms || '-'}
                                                </div>
                                                <div className="px-3 py-1.5 bg-slate-50 border border-gray-100 rounded-lg text-[11px] font-bold text-gray-600 flex items-center gap-1.5 shadow-sm">
                                                    <Filter size={14} className="text-slate-400" />
                                                    {p.size_m2} m²
                                                </div>
                                                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] font-black text-emerald-700 flex items-center gap-1.5 shadow-sm">
                                                    <CheckCircle2 size={14} />
                                                    {p.opportunity_label?.toUpperCase() || 'FIRSAT'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between border-t border-gray-50 pt-5 mt-auto">
                                            <div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Satış Fiyatı</div>
                                                <div className="text-xl font-black text-slate-900 tracking-tight">
                                                    {formatPrice(p.price)}
                                                </div>
                                                <div className="text-[11px] font-bold text-blue-600/70 mt-0.5">
                                                    {Math.round(p.price / p.size_m2).toLocaleString()} ₺/m²
                                                </div>
                                            </div>

                                            {p.roi && (
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Amortisman</div>
                                                    <div className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-200 flex items-center gap-2">
                                                        <TrendingUp size={14} className="text-rose-400" />
                                                        {p.roi.amortizationYears} Yıl
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Drop Indicator */}
                                    {p.has_recent_price_drop && (
                                        <div className="absolute top-0 right-14 bg-rose-500 text-white px-3 py-1 rounded-b-xl text-[10px] font-black shadow-lg">
                                            FİYAT DÜŞTÜ!
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="col-span-full py-24 text-center text-gray-500 flex flex-col items-center glass-card rounded-3xl border border-gray-100 bg-white/50">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
                                        <Filter className="text-gray-300" size={48} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Henüz Fırsat Yok</h4>
                                    <p className="max-w-xs text-sm text-gray-500">Bu kategoride kriterlere uygun ilan şimdilik bulunamadı. Radarımız taranıyor!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default MarketRadar;
