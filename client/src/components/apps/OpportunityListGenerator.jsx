import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, Printer, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const OpportunityListGenerator = ({ onBack }) => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [filter, setFilter] = useState('opportunity'); // 'opportunity' or 'all'
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchProperties = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 50,
                status: 'active',
                radar_category: selectedCategory !== 'all' ? selectedCategory : undefined,
            };

            if (filter === 'opportunity') {
                params.opportunity_filter = 'opportunity';
            }

            const response = await api.get('/properties', { params });
            const raw = response.data;
            const data = raw.data || [];
            const meta = raw.meta || {};

            setProperties(data);
            setTotalPages(meta.totalPages || 1);
            setTotalResults(meta.total || 0);

        } catch (error) {
            console.error('Failed to fetch properties:', error);
            toast.error('İlanlar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [page, filter, selectedCategory]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [filter, selectedCategory]);

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSelectCurrentPage = () => {
        const newSet = new Set(selectedIds);
        const allInPageSelected = properties.every(p => newSet.has(p.id));

        if (allInPageSelected) {
            properties.forEach(p => newSet.delete(p.id));
        } else {
            properties.forEach(p => newSet.add(p.id));
        }
        setSelectedIds(newSet);
    };

    const handleClearSelection = () => {
        if (window.confirm('Tüm seçimi temizlemek istediğinize emin misiniz?')) {
            setSelectedIds(new Set());
        }
    };

    const handleCreateList = () => {
        if (selectedIds.size === 0) return toast.error('Lütfen en az bir ilan seçin.');

        if (selectedIds.size > 20) {
            const confirmed = window.confirm(`${selectedIds.size} adet ilan seçtiniz. Bülteni oluşturmak istediğinize emin misiniz?`);
            if (!confirmed) return;
        }

        const idsString = Array.from(selectedIds).join(',');
        window.open(`/reports/opportunities?ids=${idsString}`, '_blank');
    };

    const handleScrapeDetails = async (id, e) => {
        e.stopPropagation();
        try {
            toast.loading('Veriler güncelleniyor...', { id: 'scrape-loading' });
            await api.post(`/properties/${id}/scrape-details`);
            toast.success('İlan verileri güncellendi.', { id: 'scrape-loading' });
            fetchProperties();
        } catch (error) {
            console.error('Scrape error:', error);
            toast.error('Veri güncellenirken hata oluştu.', { id: 'scrape-loading' });
        }
    };

    const handleBatchScrape = async () => {
        const missingDataIds = properties
            .filter(p => selectedIds.has(p.id))
            .filter(p => !p.images || p.images.length === 0 || !p.description || p.description.length < 50)
            .map(p => p.id);

        if (missingDataIds.length === 0) {
            return toast.error('Seçili ilanlar arasında verisi eksik olan bulunamadı.');
        }

        if (!window.confirm(`${missingDataIds.length} ilanın verileri güncellenecek. Devam edilsin mi?`)) return;

        setIsRefreshing(true);
        let completed = 0;
        const toastId = toast.loading(`${completed}/${missingDataIds.length} tamamlandı...`);

        for (const id of missingDataIds) {
            try {
                await api.post(`/properties/${id}/scrape-details`);
                completed++;
                toast.loading(`${completed}/${missingDataIds.length} tamamlandı...`, { id: toastId });
            } catch (err) {
                console.error(`Failed to scrape ${id}`, err);
            }
        }

        toast.success(`${completed} ilan güncellendi.`, { id: toastId });
        setIsRefreshing(false);
        fetchProperties();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white z-10">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="mr-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <FileText className="text-purple-600" />
                        Fırsat Bülteni Oluşturucu
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Danışmanlara göndermek için profesyonel fırsat listesi hazırlayın.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-purple-600">{selectedIds.size} ilan seçildi</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Maksimum 20 önerilir</span>
                    </div>

                    <Button
                        onClick={handleCreateList}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-purple-200 transition-all font-bold"
                        disabled={selectedIds.size === 0}
                    >
                        <Printer size={18} />
                        Bülteni Oluştur
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="p-4 bg-slate-50/80 backdrop-blur-sm flex flex-wrap gap-4 border-b border-gray-100 items-center justify-between sticky top-0 z-10">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setFilter('opportunity')}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'opportunity'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Fırsatlar
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'all'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Tümü
                        </button>
                    </div>

                    <div className="h-4 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                    >
                        <option value="all">TÜM TİPLER</option>
                        <option value="residence">🏠 KONUT / DAİRE</option>
                        <option value="villa">🏡 VİLLA / MÜSTAKİL</option>
                        <option value="land">🌳 ARSA / TARLA</option>
                        <option value="commercial">🏢 TİCARİ / TURİSTİK</option>
                    </select>

                    <span className="text-xs text-gray-400 font-bold ml-2">
                        {totalResults} ilan bulundu
                    </span>
                </div>

                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <>
                            <button
                                onClick={handleBatchScrape}
                                disabled={isRefreshing}
                                className="text-xs font-black text-orange-600 hover:text-orange-700 transition-all flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-50"
                            >
                                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                                EKSİK VERİLERİ ÇEK
                            </button>
                            <button
                                onClick={handleClearSelection}
                                className="text-xs font-black text-red-500 hover:text-red-600 transition-all flex items-center gap-2 px-4 py-2 rounded-xl border border-red-50 hover:bg-red-50"
                            >
                                <Trash2 size={14} />
                                SEÇİMİ SIFIRLA
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleSelectCurrentPage}
                        className="text-xs font-black text-gray-700 hover:text-purple-600 transition-all flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                    >
                        <Check size={14} />
                        SAYFAYI SEÇ/BIRAK
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-auto flex-grow relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Yükleniyor...</span>
                        </div>
                    </div>
                )}

                <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className="bg-white sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 w-12 border-b border-gray-100"></th>
                            <th className="px-4 py-4 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-wider">İlan Başlığı</th>
                            <th className="px-4 py-4 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-wider">Bölge</th>
                            <th className="px-4 py-4 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-wider">Fiyat</th>
                            <th className="px-4 py-4 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-wider text-center">Puan</th>
                            <th className="px-4 py-4 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-wider text-right">Detaylar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {properties.length > 0 ? (
                            properties.map(p => {
                                const isMissing = !p.images || p.images.length === 0 || !p.description || p.description.length < 50;
                                return (
                                    <tr
                                        key={p.id}
                                        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${selectedIds.has(p.id) ? 'bg-purple-50/40' : ''}`}
                                        onClick={() => toggleSelection(p.id)}
                                    >
                                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(p.id)}
                                                onChange={() => toggleSelection(p.id)}
                                                className="w-5 h-5 rounded-lg text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer transition-all"
                                            />
                                        </td>
                                        <td className="px-4 py-4 max-w-md">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate">{p.title}</span>
                                                    {isMissing && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">
                                                            <AlertTriangle size={10} /> Eksik Veri
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="text-[10px] text-black font-black px-1.5 py-0.5 rounded uppercase"
                                                        style={{ backgroundColor: '#ffdb15' }}
                                                    >
                                                        {p.seller_name || 'Sahibinden'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">#{p.external_id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col text-xs">
                                                <span className="font-bold text-gray-700">{p.district}</span>
                                                <span className="text-gray-500">{p.neighborhood}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-emerald-600 text-base">
                                                    {parseFloat(p.price).toLocaleString()} ₺
                                                </span>
                                                {p.deviation < 0 && (
                                                    <span className="text-[10px] font-bold text-emerald-500">
                                                        Piyasa altı: %{Math.abs(p.deviation)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-2xl font-black text-xs shadow-sm transition-all group-hover:scale-110 ${p.opportunity_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                p.opportunity_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                {p.opportunity_score || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {isMissing && (
                                                    <button
                                                        onClick={(e) => handleScrapeDetails(p.id, e)}
                                                        className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                                                        title="Verileri Güncelle"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                                <a
                                                    href={p.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <FileText size={48} className="text-gray-300" />
                                        <p className="text-sm font-bold text-gray-500">Bu filtreye uygun ilan bulunamadı.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Sayfa {page} / {totalPages}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>

                    <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum = page;
                            if (page <= 3) pageNum = i + 1;
                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = page - 2 + i;

                            if (pageNum <= 0 || pageNum > totalPages) return null;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === pageNum
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-110'
                                        : 'hover:bg-gray-50 text-gray-500'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpportunityListGenerator;
