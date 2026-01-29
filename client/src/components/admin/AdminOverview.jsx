import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Database, Users, AlertCircle,
    TrendingUp, ExternalLink, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';

const AdminOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await api.get('/analytics');
                if (res.data && res.data.adminStats) {
                    setStats(res.data.adminStats);
                } else if (res.data) {
                    // Fallback to top level if adminStats is missing but data exists
                    setStats({
                        totalProperties: res.data.totalProperties || 0,
                        assignedCount: 0,
                        pendingCount: 0,
                        sources: []
                    });
                } else {
                    setError('Sunucudan geçersiz veri yapısı döndü.');
                }
                setLoading(false);
            } catch (error) {
                console.error('Stats fetch error:', error);
                const msg = error.response?.data?.error || error.message;
                setError(msg);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
    if (error) return (
        <div className="p-8 text-center">
            <div className="text-red-500 font-bold mb-2">Veri Yüklenemedi</div>
            <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded inline-block">{error}</div>
        </div>
    );
    if (!stats) return <div className="p-8 text-center text-red-500">İstatistik verisi bulunamadı.</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-800">Genel Bakış</h2>
                <p className="text-sm text-gray-500">Sistem genel durumu ve güncel istatistikler.</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Toplam İlan</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.totalProperties}</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Aktif veritabanı kaydı</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Database size={20} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Atanan İlan</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.assignedCount}</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Danışmanlara dağıtılan</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Users size={20} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Bekleyen</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.pendingCount}</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Sahibinden düşen / Atanmamış</p>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <AlertCircle size={20} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Sistem Sağlığı</p>
                        <h3 className="text-lg font-bold text-gray-800 mt-1">%100</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Tüm servisler aktif</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle2 size={20} />
                    </div>
                </div>
            </div>

            {/* Portal Distribution */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                    <ExternalLink size={16} className="text-gray-400" />
                    Portal Bazlı Dağılım
                </h3>
                <div className="space-y-4">
                    {(stats.sources || []).map((source) => (
                        <div key={source.name}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className={`font-semibold ${source.color}`}>{source.name}</span>
                                <span className="text-gray-500 font-medium">{source.count} ilan</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${source.bg.replace('bg-', 'bg-').replace('-50', '-500')}`}
                                    style={{ width: `${(source.count / stats.totalProperties) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white flex items-center justify-between">
                    <div>
                        <h4 className="font-bold">Hızlı Rapor Oluştur</h4>
                        <p className="text-xs text-slate-400 mt-1">Tüm ilan verilerini Excel formatında indir.</p>
                        <button className="mt-3 bg-white/10 hover:bg-white/20 text-xs font-semibold px-3 py-1.5 rounded transition-colors">
                            Raporu Hazırla
                        </button>
                    </div>
                    <Database className="text-white/20" size={60} />
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
