import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building, TrendingUp, Clock, Wallet, ExternalLink, MessageCircle, RefreshCw, FileText, Upload, Sparkles, AlertCircle, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthEditModal from '../modals/AuthEditModal';

const PortfolioDashboard = ({ mode: initialMode = 'agency', user }) => {
    const [stats, setStats] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewStatus, setViewStatus] = useState('active');
    const [mode, setMode] = useState(initialMode);
    const [editingProp, setEditingProp] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statsError, setStatsError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 15;

    const userId = user?.id;
    const isAdmin = user?.role === 'admin';

    const fetchPortfolio = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                portfolio: mode,
                status: viewStatus,
                limit: itemsPerPage,
                page: page,
                ...(mode === 'mine' && { assigned_user_id: userId }),
                ...(searchQuery && { search: searchQuery })
            };
            const response = await api.get('/properties', { params });
            const data = response.data.data || [];
            setListings(data);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
            toast.error('İlanlar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setStatsError(null);
            const params = {
                portfolio: mode,
                status: viewStatus,
                ...(mode === 'mine' && { assigned_user_id: userId })
            };
            const response = await api.get('/properties/stats', { params });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                setStatsError('Oturum Süresi Doldu');
            } else {
                const msg = error.response?.data?.details || error.response?.data?.error || error.message;
                setStatsError(msg);
            }
        }
    };

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchPortfolio(currentPage);
        }
    }, [mode, viewStatus, user?.id, currentPage, searchQuery]);

    const handleSync = async () => {
        if (!window.confirm('Verileri güncellemek istediğinize emin misiniz?')) return;
        try {
            setSyncing(true);
            await api.post('/properties/sync-portfolio');
            toast.success('İşlem başlatıldı.');
        } catch (error) {
            toast.error('Hata oluştu.');
        } finally {
            setSyncing(false);
        }
    };

    const currentStats = stats || { totalListings: 0, totalValue: 0, avgPrice: 0, avgDays: 0, sahibindenCount: 0, hepsiemlakCount: 0 };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header Diagnostics */}
            <div className="mb-6 bg-slate-900 rounded-xl p-4 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black flex items-center gap-2">
                            <span className="text-blue-500">TRIO</span>
                            {mode === 'agency' ? 'OFİS PORTFÖYÜ' : 'KİŞİSEL PORTFÖY'}
                        </h1>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                            Status: {loading ? 'Loading...' : 'Ready'} |
                            API: {api.defaults.baseURL} |
                            Build: 1.37 |
                            Backend: {stats?._v || (statsError ? 'ERROR' : 'Searching...')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {statsError && statsError !== 'Oturum Süresi Doldu' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-500/50 text-rose-400 rounded text-[10px] font-bold">
                                <AlertCircle size={10} />
                                BACKEND ERROR: {statsError ? statsError.toUpperCase() : 'UNKNOWN'}
                            </div>
                        )}
                        <button
                            onClick={() => { fetchStats(); fetchPortfolio(1); }}
                            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            ŞİMDİ YENİLE
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
                    <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Toplam Kayıt</div>
                        <div className="text-xl font-black text-blue-400">{currentStats.totalListings}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Sahibinden</div>
                        <div className="text-xl font-black text-amber-400">{currentStats.sahibindenCount}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Hepsiemlak</div>
                        <div className="text-xl font-black text-rose-400">{currentStats.hepsiemlakCount}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Hata / Log Paneli</div>
                        <div className="text-[9px] font-mono text-slate-500 truncate max-w-[200px]" title={statsError}>
                            {statsError ? statsError : (stats?._v ? 'Bağlantı Başarılı' : 'Bekleniyor...')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Search and Filters */}
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setViewStatus('active'); setCurrentPage(1); }}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${viewStatus === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            AKTİF İLANLAR
                        </button>
                        <button
                            onClick={() => { setViewStatus('removed'); setCurrentPage(1); }}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${viewStatus === 'removed' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            PASİF / ARŞİV
                        </button>
                    </div>

                    <div className="relative w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="İlanlarda ara..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                            <p className="text-slate-800 font-black tracking-tight uppercase">Veriler Hazırlanıyor...</p>
                        </div>
                    )}

                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">İlan Detayı</th>
                                <th className="px-6 py-4">Fiyat</th>
                                <th className="px-6 py-4">Bölge</th>
                                <th className="px-6 py-4">Platform</th>
                                <th className="px-6 py-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {listings.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 line-clamp-1">{item.title}</span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase">{item.external_id || item.id}</span>
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">{item.category}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-lg font-black text-slate-900">
                                            {new Intl.NumberFormat('tr-TR').format(item.price)} ₺
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col text-xs font-semibold text-slate-500 uppercase">
                                            <span>{item.district}</span>
                                            <span className="text-[10px] font-normal lowercase opacity-70">{item.neighborhood}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-2">
                                            {item.url?.includes('sahibinden') && <span className="bg-[#ffdb15] px-2 py-1 rounded text-[9px] font-black uppercase">Sahibinden</span>}
                                            {item.url?.includes('hemlak') && <span className="bg-rose-500 text-white px-2 py-1 rounded text-[9px] font-black uppercase">Hepsiemlak</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <a href={item.url} target="_blank" rel="noreferrer" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {listings.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                            <Building size={48} className="opacity-20" />
                            <p className="font-bold">Eşleşen ilan bulunamadı.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-400 uppercase">
                            Sayfa <span className="text-slate-900">{currentPage}</span> / {totalPages}
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-white border border-slate-200 rounded-xl hover:shadow-sm disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 bg-white border border-slate-200 rounded-xl hover:shadow-sm disabled:opacity-30 transition-all font-bold"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioDashboard;
