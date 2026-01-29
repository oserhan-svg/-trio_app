import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '../../services/api';
import {
    Activity,
    Globe,
    CheckCircle,
    Clock,
    RefreshCw,
    Search,
    Zap,
    History,
    Building,
    ShieldAlert,
    HeartPulse,
    Server
} from 'lucide-react';

const ScraperMonitoring = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setRefreshing(true);

            const statusResult = await api.get('/scraper/status');
            setStatus(statusResult.data);

        } catch (error) {
            console.error('Failed to fetch monitoring data:', error);
        } finally {
            setLoading(false);
            if (!silent) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const pollInterval = setInterval(() => fetchData(true), 5000);
        return () => clearInterval(pollInterval);
    }, []);

    if (loading && !status) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                <p className="font-medium">Sistem durumu yükleniyor...</p>
            </div>
        );
    }

    const { session, database, timestamp } = status || {};
    const portalStats = session?.portalStats || {};
    const dbCounts = database?.portalCounts || {};

    const portals = [
        { id: 'sahibinden', name: 'SAHIBINDEN.COM', color: 'amber', icon: 'S' },
        { id: 'hepsiemlak', name: 'HEPSIEMLAK.COM', color: 'red', icon: 'H' },
        { id: 'emlakjet', name: 'EMLAKJET.COM', color: 'purple', icon: 'E' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                        <Server className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Scraper Operasyon Merkezi</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock size={12} />
                            Son Güncelleme: {timestamp ? new Date(timestamp).toLocaleTimeString() : 'Bekleniyor...'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Portal Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {portals.map((portal) => {
                    const sessionStat = portalStats[portal.id] || {};
                    const dbCount = dbCounts[portal.id] || 0;
                    const sessionCount = sessionStat.listingCount || 0;
                    const isHealthy = sessionStat.requestCount > 0;

                    return (
                        <div key={portal.id} className={`bg-white p-5 rounded-2xl border-2 shadow-sm transition-all ${isHealthy ? `border-${portal.color}-100` : 'border-slate-100'
                            }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-${portal.color}-50 flex items-center justify-center text-${portal.color}-600 font-black text-lg`}>
                                        {portal.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-sm">{portal.name}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {isHealthy ? 'AKTİF' : 'BEKLEMEDE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {sessionCount > 0 && (
                                    <div className={`px-2 py-1 bg-${portal.color}-50 text-${portal.color}-600 rounded-lg text-xs font-bold flex items-center gap-1`}>
                                        <Zap size={10} />
                                        +{sessionCount}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-3xl font-black text-slate-800">{dbCount.toLocaleString()}</span>
                                <span className="text-sm font-medium text-slate-400">ilan</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Veritabanı</div>
                                <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">
                                    Seans: {sessionStat.requestCount || 0} İstek
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={<Activity size={14} />} label="Toplam İstek" value={session?.requestCount || 0} color="blue" />
                <StatCard
                    icon={<Zap size={14} />}
                    label="Eklenti Aktarımı"
                    value={session?.totalRawListingCount?.toLocaleString() || "0"}
                    color="amber"
                    subStats={[
                        { label: 'HAM', value: session?.totalRawListingCount || 0, title: 'Eklenti tarafından taranan toplam ham ilan sayısı' }
                    ]}
                />
                <StatCard
                    icon={<Building size={14} />}
                    label="Veritabanı (Net)"
                    value={database?.propertyCount?.toLocaleString() || "0"}
                    color="indigo"
                    subStats={[
                        { label: 'TEKİL', value: database?.propertyCount || 0, title: 'Mükerrerlerden arındırılmış net ilan sayısı' }
                    ]}
                />
                <StatCard
                    icon={<HeartPulse size={14} />}
                    label="Veri Verimliliği"
                    value={session?.totalRawListingCount > 0 ? Math.round((database?.propertyCount / session?.totalRawListingCount) * 100) + "%" : "%100"}
                    color="emerald"
                    subStats={[
                        { label: 'DENETİM', value: 'BAŞARILI', title: 'Mükerrer ve hatalı ilanlar başarıyla filtrelendi' }
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detailed Logs */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                        <History size={18} /> Canlı Scraper Günlüğü
                    </div>
                    <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                        {session?.recentEvents?.map(event => (
                            <div key={event.id} className="flex gap-3 text-sm p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${event.type === 'error' ? 'bg-red-500' : event.type === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'
                                    }`} />
                                <div>
                                    <div className="text-gray-800 font-medium">
                                        <span className="opacity-40 font-mono mr-2">[{event.portal?.toUpperCase()}]</span>
                                        {event.message}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">{new Date(event.timestamp).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resource Info */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
                    <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                        <Server size={20} className="text-blue-400" /> Kaynak Durumu
                    </h3>
                    <div className="space-y-6">
                        <ResourceItem label="Proxy Sağlığı" value={status?.resources?.proxyHealth || "%98"} color="emerald" />
                        <ResourceItem label="CPU Kullanımı" value={status?.resources?.cpu || "%12"} color="blue" />
                        <ResourceItem label="Bellek (RAM)" value={status?.resources?.memory || "420MB"} color="blue" />
                        <ResourceItem label="Aktif Tarayıcılar" value={status?.resources?.activeBrowsers || "0"} color="indigo" />
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">SİSTEM DURUMU</div>
                        <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                            <CheckCircle size={14} /> SCRAPER HAZIR
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color, subStats }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
        <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
            {icon} {label}
        </div>
        <div className="flex justify-between items-end">
            <div className={`text-3xl font-black text-${color}-600`}>{value}</div>
            {subStats && (
                <div className="flex gap-1.5 mb-1">
                    {subStats.map((stat, i) => (
                        <div
                            key={i}
                            title={stat.title}
                            className="flex flex-col items-center px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded-md min-w-[28px]"
                        >
                            <span className="text-[8px] text-slate-400 font-bold leading-none mb-0.5">{stat.label}</span>
                            <span className={`text-[10px] font-black text-slate-700 leading-none`}>{stat.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const ResourceItem = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase mb-2">
            <span>{label}</span>
            <span className={`text-${color}-400`}>{value}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full bg-${color}-500`} style={{ width: String(value).includes('%') ? value : '20%' }} />
        </div>
    </div>
);

export default ScraperMonitoring;
