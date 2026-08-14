import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, FileSpreadsheet, Instagram, Eye, ChevronLeft, ChevronRight, FileText, TrendingDown, Home, ChevronUp, ChevronDown, X, Sparkles, Activity, Layers, Search, Flame } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PropertySkeleton = () => (
    <>
        {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="animate-pulse bg-white/40 dark:bg-slate-900/20">
                <td className="px-6 py-6"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg"></div></td>
                <td className="px-6 py-6"><div className="w-12 h-6 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                <td className="px-6 py-6">
                    <div className="w-48 h-5 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                </td>
                <td className="px-6 py-6"><div className="w-24 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                <td className="px-6 py-6"><div className="w-32 h-6 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                <td className="px-6 py-6"><div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                <td className="px-6 py-6"><div className="w-24 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div></td>
                <td className="px-6 py-6"><div className="w-32 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl ml-auto"></div></td>
            </tr>
        ))}
    </>
);

const PropertyRow = React.memo(({ prop, isSelected, onToggleSelect, onGenerateStory, lastElementRef }) => {
    const navigate = useNavigate();
    return (
        <tr
            ref={lastElementRef}
            className={`group transition-all duration-300 ease-out hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-blue-500/5 hover:translate-y-[-2px] relative ${isSelected ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
        >
            <td className="px-6 py-6">
                <input
                    type="checkbox"
                    className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 cursor-pointer transition-all shadow-inner"
                    checked={isSelected}
                    onChange={() => onToggleSelect(prop.id)}
                />
            </td>
            <td className="px-6 py-6 whitespace-nowrap">
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-900 dark:text-slate-200 tracking-tight">
                        {new Date(prop.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                        {new Date(prop.created_at).getFullYear()}
                    </span>
                </div>
            </td>
            <td className="px-6 py-6 max-w-sm">
                <div className="flex items-center gap-3 mb-2.5">
                    {prop.url.includes('hepsiemlak') && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black bg-rose-600 text-white shadow-lg shadow-rose-500/20 uppercase tracking-wider">
                            HEPSIEMLAK
                        </span>
                    )}
                    {prop.url.includes('sahibinden') && (
                        <span
                            className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black shadow-lg shadow-yellow-500/20 uppercase tracking-wider"
                            style={{ backgroundColor: '#ffdb15', color: '#000' }}
                        >
                            SAHIBINDEN
                        </span>
                    )}
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 tracking-widest">
                        #{prop.external_id ? (prop.external_id.split('block')[0].slice(-6)) : (prop.id.toString().slice(-6))}
                    </span>
                </div>

                <div className="relative group/title inline-block">
                    <div className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2 leading-tight group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
                        {(prop.title?.split('#')[0].trim()) ||
                            (`${prop.district} ${prop.rooms} ${prop.category}`.trim()) ||
                            'İsimsiz Portföy'}
                        {prop.has_recent_price_drop && (
                            <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-bounce">
                                <TrendingDown size={14} strokeWidth={3} />
                            </div>
                        )}
                    </div>

                    {prop.images && prop.images.length > 0 && (
                        <div className="absolute left-0 top-full mt-3 z-50 invisible group-hover/title:visible opacity-0 group-hover/title:opacity-100 transition-all duration-500 pointer-events-none scale-95 group-hover/title:scale-100">
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-blue-900/20 border border-white dark:border-slate-800 p-3 w-72 overflow-hidden translate-y-4 group-hover/title:translate-y-0 transition-all">
                                <div className="relative">
                                    <img
                                        src={prop.images[0]}
                                        className="w-full h-44 object-cover rounded-3xl"
                                        alt="Preview"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/20">
                                        GÖRSEL ÖNİZLEME
                                    </div>
                                </div>
                                <div className="mt-3 px-1 flex items-center justify-between">
                                    <div className="flex gap-1.5 no-scrollbar overflow-x-auto">
                                        {prop.images.slice(1, 4).map((img, i) => (
                                            <img key={i} src={img} className="w-12 h-12 object-cover rounded-xl border-2 border-white dark:border-slate-800 shadow-sm flex-shrink-0" />
                                        ))}
                                    </div>
                                    <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center text-white dark:text-slate-900 text-[10px] font-black">
                                        +{prop.images.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-3">
                    {prop.seller_name && prop.seller_name !== 'Bilinmiyor' ? (
                        <span className={`text-[10px] font-black px-3 py-1 rounded-xl border-2 uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95 cursor-default ${(prop.url.includes('sahibinden') || prop.seller_type === 'owner')
                            ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-800/50'
                            : 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50'
                            }`}>
                            <span className="opacity-60 mr-1.5 font-black">{prop.seller_type === 'owner' ? 'S' : 'E'}:</span>
                            {prop.seller_name}
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest italic opacity-50">Sahİpsİz Verİ</span>
                    )}

                    <div className="flex gap-2">
                        {prop.opportunity_score > 85 && (
                            <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1 rounded-xl text-[9px] font-black tracking-[0.1em] flex items-center gap-1.5 glow-blue">
                                <Flame size={10} className="text-amber-500 fill-amber-500" /> TOP RATED
                            </div>
                        )}
                        {prop.has_recent_price_drop && (
                            <div className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase">Krİtİk Düşüş</div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-6 whitespace-nowrap">
                <div className="flex flex-col">
                    <div className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {parseFloat(prop.price).toLocaleString('tr-TR')} <span className="text-xs font-black text-slate-400 dark:text-slate-500 ml-0.5">₺</span>
                    </div>
                    {prop.opportunity_label && prop.opportunity_label !== 'Normal' && prop.opportunity_label !== 'Veri Yok' && (
                        <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black shadow-lg transition-all 
                        ${prop.opportunity_label.includes('Kelepir') ? 'bg-emerald-600 text-white shadow-emerald-500/20' :
                                prop.opportunity_label.includes('Fırsat') ? 'bg-blue-600 text-white shadow-blue-500/20' :
                                    prop.opportunity_label.includes('Uygun') ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50' :
                                        prop.opportunity_label.includes('pahalı') || prop.opportunity_label.includes('Yüksek') ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {prop.opportunity_label.toUpperCase()}
                            {prop.deviation > 0 && <span className="ml-1.5 opacity-70">%{prop.deviation}</span>}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-6 whitespace-nowrap">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase">{prop.district}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-3.5 italic">
                        {prop.neighborhood}
                    </div>
                </div>
            </td>
            <td className="px-6 py-6 whitespace-nowrap">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg text-[11px] font-black">{prop.rooms}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold text-sm tracking-tighter">{prop.size_m2} <span className="text-[10px]">m²</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                        <Activity size={12} className="text-slate-300 dark:text-slate-600" />
                        {prop.building_age || 'Yeni'} Yaş
                        <span className="opacity-20 mx-1">•</span>
                        {prop.floor_location?.toUpperCase() || 'ZB'}
                    </div>
                </div>
            </td>
            <td className="px-6 py-6 whitespace-nowrap">
                {prop.roi ? (
                    <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-100 dark:group-hover:border-blue-800/50 transition-colors">
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-1">
                            {prop.roi.estimatedMonthlyRent.toLocaleString('tr-TR')} ₺
                            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                            ROI: {prop.roi.amortizationYears} YIL
                        </div>
                    </div>
                ) : (
                    <div className="h-10 w-24 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 border-dashed rounded-2xl flex items-center justify-center opacity-40">
                        <span className="text-[10px] font-black text-slate-400 dak:text-slate-500">ANALİZ YOK</span>
                    </div>
                )}
            </td>
            <td className="px-6 py-6 text-right pr-6">
                <div className="flex justify-end gap-2 group-hover:translate-x-[-4px] transition-transform">
                    <button
                        onClick={() => navigate(`/property/${prop.id}`)}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white hover:border-blue-600 dark:hover:border-blue-600 transition-all active:scale-90"
                        title="Derinlemesine Analiz"
                    >
                        <Eye size={18} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => navigate(`/property-listing/${prop.id}`)}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white hover:border-indigo-600 dark:hover:border-indigo-600 transition-all active:scale-90"
                        title="Müşteri Sunumu Hazırla"
                    >
                        <FileText size={18} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => onGenerateStory(prop.id)}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white dark:hover:text-white hover:border-rose-600 dark:hover:border-rose-600 transition-all active:scale-90"
                        title="Hızlı Reklam (Story)"
                    >
                        <Instagram size={18} strokeWidth={2.5} />
                    </button>
                    <a
                        href={prop.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 hover:border-slate-900 dark:hover:border-slate-100 transition-all active:scale-90"
                        title="Kaynağı Görüntüle"
                    >
                        <ExternalLink size={18} strokeWidth={2.5} />
                    </a>
                </div>
            </td>
        </tr>
    );
});

const PropertyTable = ({ properties, currentSort, onSortChange, hasMore, onLoadMore, isLoadingMore }) => {
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState([]);
    const observer = useRef();

    const lastElementRef = useCallback(node => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                onLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, hasMore, onLoadMore]);

    const toggleSelectAll = () => {
        if (selectedIds.length === properties.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(properties.map(p => p.id));
        }
    };

    // ⚡ Bolt: Wrapped toggleSelectOne in useCallback to prevent re-creating the function on every render, which prevents unnecessary re-renders of PropertyRow components wrapped in React.memo.
    const toggleSelectOne = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const handleExport = async () => {
        const loadingToast = toast.loading('Excel hazırlanıyor...');
        try {
            const response = await api.get('/properties/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'trio_full_export.xlsx');
            document.body.appendChild(link);
            link.click();
            toast.success('Liste başarıyla indirildi.', { id: loadingToast });
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Excel indirilemedi.', { id: loadingToast });
        }
    };

    const handleBulkExport = async (ids) => {
        const loadingToast = toast.loading(`${ids.length} ilan paketleniyor...`);
        try {
            const response = await api.get(`/properties/export?ids=${ids.join(',')}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `trio_custom_export_${ids.length}.xlsx`);
            document.body.appendChild(link);
            link.click();
            toast.success(`${ids.length} ilan başarıyla dışa aktarıldı.`, { id: loadingToast });
        } catch (error) {
            console.error('Bulk export failed:', error);
            toast.error('Seçilenler indirilemedi.', { id: loadingToast });
        }
    };

    const handleGenerateStory = useCallback(async (id) => {
        try {
            toast.loading('Görsel oluşturuluyor...');
            const response = await api.get(`/images/story/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `trio_story_${id}.jpg`);
            document.body.appendChild(link);
            link.click();
            toast.dismiss();
        } catch (error) {
            console.error('Image generation failed:', error);
            toast.error('Görsel oluşturulamadı.');
        }
    }, []);

    const SortHeader = ({ label, sortKeyBase, currentSort, onSortChange }) => {
        const isCurrent = currentSort === `${sortKeyBase}_asc` || currentSort === `${sortKeyBase}_desc` || (sortKeyBase === 'date' && currentSort === 'newest');
        const isDesc = currentSort === `${sortKeyBase}_desc` || (sortKeyBase === 'date' && currentSort === 'newest');

        const handleClick = () => {
            if (!onSortChange) return;
            if (sortKeyBase === 'date') {
                onSortChange(currentSort === 'newest' ? 'date_asc' : 'newest');
            } else {
                onSortChange(isDesc ? `${sortKeyBase}_asc` : `${sortKeyBase}_desc`);
            }
        };

        return (
            <th
                className={`px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all relative group/th ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                onClick={handleClick}
            >
                <div className="flex items-center gap-2">
                    {label}
                    <div className={`transition-all duration-300 ${isCurrent ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover/th:opacity-50 group-hover/th:scale-100'}`}>
                        {isDesc ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronUp size={14} strokeWidth={3} />}
                    </div>
                </div>
                {isCurrent && <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full animate-in fade-in duration-500" />}
            </th>
        );
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Table Header Controls */}
            <div className="flex justify-between items-center px-6 py-5 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">İşlem Listesi</h2>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{properties.length} veri bloğu aktif</span>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 bg-blue-600 text-white px-4 py-2 rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 animate-in zoom-in duration-300 uppercase tracking-widest">
                            {selectedIds.length} DOSYA SEÇİLİ
                            <button onClick={() => setSelectedIds([])} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={14} strokeWidth={3} />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => handleBulkExport(selectedIds)}
                            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 px-5 py-2.5 rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                        >
                            <Layers size={16} />
                            Seçilenleri Dışa Aktar
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-all text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 group"
                    >
                        <FileSpreadsheet size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                        Tümünü İndir
                    </button>
                </div>
            </div>

            {/* Desktop Table View rendered with modern styling */}
            <div className="overflow-x-auto rounded-[2.5rem] glass dark:glass-dark shadow-2xl shadow-blue-900/5 dark:shadow-blue-900/20 border border-white dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800" id="property-table-main">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-5 text-left w-12">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 cursor-pointer checked:bg-blue-600 transition-all shadow-inner"
                                        checked={selectedIds.length > 0 && selectedIds.length === properties.length}
                                        onChange={toggleSelectAll}
                                    />
                                </div>
                            </th>
                            <SortHeader label="TARİH" sortKeyBase="date" currentSort={currentSort} onSortChange={onSortChange} />
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">PORTFÖY DETAYI</th>
                            <SortHeader label="FİYAT VE ANALİZ" sortKeyBase="price" currentSort={currentSort} onSortChange={onSortChange} />
                            <SortHeader label="LOKASYON" sortKeyBase="location" currentSort={currentSort} onSortChange={onSortChange} />
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">TEKNİK ÖZELLİKLER</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">AMORTİSMAN</th>
                            <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] pr-10">AKSİYONLAR</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/40 dark:bg-slate-900/20 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                        {properties.length > 0 ? (
                            properties.map((prop, index) => (
                                <PropertyRow
                                    key={prop.id}
                                    prop={prop}
                                    isSelected={selectedIds.includes(prop.id)}
                                    onToggleSelect={toggleSelectOne}
                                    onGenerateStory={handleGenerateStory}
                                    lastElementRef={index === properties.length - 1 ? lastElementRef : null}
                                />
                            ))
                        ) : isLoadingMore ? (
                            <PropertySkeleton />
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-32 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-b-[2.5rem]">
                                    <div className="flex flex-col items-center justify-center opacity-30 group">
                                        <Search size={64} className="mb-4 text-slate-200 dark:text-slate-700 group-hover:scale-110 transition-transform" />
                                        <div className="text-lg font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">VERİ SONUNA GELİNDİ</div>
                                        <div className="text-xs font-bold text-slate-300 dark:text-slate-600 mt-2">Daha fazla sonuç için filtreleri temizleyin.</div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Loading Status */}
            <div className="flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-3">
                    {isLoadingMore ? (
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aşağısı Getİrİlİyor...</span>
                        </div>
                    ) : (
                        <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic flex items-center gap-2">
                            <Activity size={12} className="opacity-50" />
                            {hasMore ? 'Daha Fazla İlan Kaydı Mevcut' : `Verİ Tabanı Sonu • ${properties.length} Kayıt`}
                        </div>
                    )}
                </div>

                {hasMore && !isLoadingMore && (
                    <button
                        onClick={onLoadMore}
                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] hover:tracking-[0.4em] transition-all flex items-center gap-2 group"
                    >
                        Daha Fazlasını Keşfet
                        <ChevronDown size={14} className="group-hover:translate-y-1 transition-transform" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PropertyTable;
