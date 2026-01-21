import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building, TrendingUp, Clock, Wallet, ExternalLink } from 'lucide-react';

const PortfolioDashboard = ({ mode = 'agency', userId }) => {
    // mode: 'agency' (Admin view - all assigned) or 'mine' (Consultant view - only theirs)
    const [stats, setStats] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewStatus, setViewStatus] = useState('active'); // 'active' or 'removed'

    useEffect(() => {
        fetchPortfolio();
    }, [mode, userId, viewStatus]);

    const fetchPortfolio = async () => {
        try {
            setLoading(true);
            const params = {
                portfolio: mode,
                status: viewStatus,
                ...(mode === 'mine' && { user_id: userId })
            };
            const response = await api.get('/properties', { params });
            const responseData = response.data;
            const data = Array.isArray(responseData) ? responseData : (responseData.data || []);

            // Calculate Stats
            const totalValue = data.reduce((acc, curr) => acc + parseFloat(curr.price), 0);
            const avgPrice = totalValue / (data.length || 1);

            // Calculate Avg Days on Market
            const now = new Date();
            const totalDays = data.reduce((acc, curr) => {
                const listDate = curr.listing_date ? new Date(curr.listing_date) : new Date(curr.created_at);
                const diffTime = Math.abs(now - listDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return acc + diffDays;
            }, 0);
            const avgDays = Math.round(totalDays / (data.length || 1));

            // Platform Distribution
            const sahibindenCount = data.filter(p => p.url.includes('sahibinden')).length;
            const hepsiemlakCount = data.filter(p => p.url.includes('hepsiemlak')).length;

            setStats({
                totalListings: data.length,
                totalValue,
                avgPrice,
                avgDays,
                sahibindenCount,
                hepsiemlakCount
            });
            setListings(data);
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Portföy verileri yükleniyor...</div>;

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Building className="text-blue-600" />
                    {mode === 'agency' ? 'Genel Portföy Durumu' : 'Portföyüm'}
                </h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewStatus('active')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewStatus === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Aktif İlanlar
                    </button>
                    <button
                        onClick={() => setViewStatus('removed')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewStatus === 'removed' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Yayından Kalkanlar
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Toplam İlan</div>
                    <div className="text-2xl font-black text-gray-800">{stats.totalListings}</div>
                    <div className="flex gap-2 mt-2 text-xs">
                        <span className="text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">SHB: {stats.sahibindenCount}</span>
                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">HE: {stats.hepsiemlakCount}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Toplam Değer</div>
                    <div className="text-xl font-black text-emerald-600 truncate" title={`${stats.totalValue.toLocaleString()} ₺`}>
                        {(stats.totalValue / 1000000).toFixed(1)} M ₺
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Ort. Fiyat</div>
                    <div className="text-xl font-bold text-gray-700">
                        {stats.avgPrice.toLocaleString()} ₺
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Ort. İlan Süresi</div>
                    <div className="text-2xl font-black text-blue-600">{stats.avgDays} Gün</div>
                </div>
            </div>

            {/* Recent Listings Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-gray-700">
                    Son Eklenen Portföy İlanları
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-medium">Başlık</th>
                                <th className="px-4 py-3 font-medium">Fiyat</th>
                                <th className="px-4 py-3 font-medium">Site</th>
                                <th className="px-4 py-3 font-medium text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {listings.slice(0, 5).map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{p.title?.split('#')[0].trim()}</td>
                                    <td className="px-4 py-3 text-emerald-600 font-bold">{parseFloat(p.price).toLocaleString()} ₺</td>
                                    <td className="px-4 py-3">
                                        {p.url.includes('sahibinden')
                                            ? <span className="text-yellow-600 text-xs font-bold bg-yellow-50 px-2 py-1 rounded">Sahibinden</span>
                                            : <span className="text-rose-600 text-xs font-bold bg-rose-50 px-2 py-1 rounded">Hepsiemlak</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <a href={p.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 inline-flex items-center gap-1">
                                            Git <ExternalLink size={12} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {listings.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-6 text-center text-gray-400">Henüz portföy ilanı bulunmuyor.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PortfolioDashboard;
