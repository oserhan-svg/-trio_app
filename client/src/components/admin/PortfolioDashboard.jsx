import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building, TrendingUp, Clock, Wallet, ExternalLink, FileText, Upload } from 'lucide-react';

const PortfolioDashboard = ({ mode = 'agency', userId }) => {
    // mode: 'agency' (Admin view - all assigned) or 'mine' (Consultant view - only theirs)
    const [stats, setStats] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewStatus, setViewStatus] = useState('active'); // 'active' or 'removed'
    const [editingProp, setEditingProp] = useState(null);

    const openEditModal = (prop) => setEditingProp(prop);

    useEffect(() => {
        fetchPortfolio();
    }, [mode, userId, viewStatus]);

    const fetchPortfolio = async () => {
        try {
            setLoading(true);
            const params = {
                portfolio: mode,
                status: viewStatus,
                limit: 500,
                ...(mode === 'mine' && { assigned_user_id: userId })
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

    const handleUpload = async (id, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload File
            const uploadRes = await api.post('/upload/document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileUrl = uploadRes.data.url;

            // 2. Update Property with URL (and default 3 month duration if not set)
            const today = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            await api.put(`/properties/${id}`, {
                auth_doc_url: fileUrl,
                auth_start_date: today,
                auth_end_date: endDate
            });

            // Refresh
            fetchPortfolio();
            alert('Yetki belgesi yüklendi.');
        } catch (error) {
            console.error(error);
            alert('Yükleme başarısız');
        }
    };

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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    {/* Decorative bg */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full translate-x-4 -translate-y-4 opacity-50"></div>

                    <div className="text-sm text-gray-500 mb-1 font-medium">Toplam Portföy</div>
                    <div className="text-2xl font-black text-gray-800">{stats.totalListings}</div>
                    <div className="text-xs text-gray-400 mt-1">Aktif ilan sayısı</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 p-2 opacity-5">
                        <b className="text-4xl text-yellow-600">S</b>
                    </div>
                    <div className="text-sm text-gray-500 mb-1 font-medium">Sahibinden.com</div>
                    <div className="text-2xl font-black text-yellow-600">{stats.sahibindenCount}</div>
                    <div className="text-xs text-yellow-600/70 mt-1 bg-yellow-50 inline-block px-1 rounded">Yayındaki İlanlar</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 p-2 opacity-5">
                        <b className="text-4xl text-rose-600">H</b>
                    </div>
                    <div className="text-sm text-gray-500 mb-1 font-medium">Hepsiemlak</div>
                    <div className="text-2xl font-black text-rose-600">{stats.hepsiemlakCount}</div>
                    <div className="text-xs text-rose-600/70 mt-1 bg-rose-50 inline-block px-1 rounded">Yayındaki İlanlar</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1 font-medium">Toplam Değer</div>
                    <div className="text-xl font-black text-emerald-600 truncate" title={`${stats.totalValue.toLocaleString()} ₺`}>
                        {(stats.totalValue / 1000000).toFixed(1)} M ₺
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1 font-medium">Ort. İlan Süresi</div>
                    <div className="text-2xl font-black text-blue-600">{stats.avgDays} Gün</div>
                </div>
            </div>

            {/* Recent Listings Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-gray-700 flex justify-between items-center">
                    <span>Portföy Listesi</span>
                    <span className="text-xs font-normal text-gray-500">
                        {loading ? 'Yükleniyor...' : `${stats?.totalListings || 0} ilan listeleniyor`}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-medium">İlan</th>
                                <th className="px-4 py-3 font-medium">Site</th>
                                <th className="px-4 py-3 font-medium">Yetki Belgesi</th>
                                <th className="px-4 py-3 font-medium">Yetki Süresi</th>
                                <th className="px-4 py-3 font-medium text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {listings.slice(0, 500).map(p => {
                                // Duration Calc
                                const now = new Date();
                                let expiryText = '-';
                                let expiryColor = 'text-gray-400';

                                if (p.auth_end_date) {
                                    const end = new Date(p.auth_end_date);
                                    const diffTime = end - now;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    if (diffDays < 0) {
                                        expiryText = 'Süresi Doldu';
                                        expiryColor = 'text-red-600 font-bold';
                                    } else {
                                        expiryText = `${diffDays} Gün Kaldı`;
                                        expiryColor = diffDays < 15 ? 'text-orange-600 font-bold' : 'text-emerald-600';
                                    }
                                }

                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800 max-w-xs truncate">{p.title?.split('#')[0].trim()}</div>
                                            <div className="text-xs text-gray-500">{parseFloat(p.price).toLocaleString()} ₺</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.url.includes('sahibinden')
                                                ? <span className="text-yellow-600 text-[10px] font-bold bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">Sahibinden</span>
                                                : <span className="text-rose-600 text-[10px] font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Hepsiemlak</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.auth_doc_url ? (
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`${api.defaults.baseURL.replace('/api', '')}${p.auth_doc_url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                                                    >
                                                        <FileText size={14} /> Gör
                                                    </a>
                                                    <button
                                                        onClick={() => openEditModal(p)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                        title="Düzenle"
                                                    >
                                                        <Upload size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => openEditModal(p)}
                                                    className="cursor-pointer flex items-center gap-1 text-gray-400 hover:text-blue-600 text-xs transition-colors"
                                                >
                                                    <Upload size={14} />
                                                    <span>Yükle</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs ${expiryColor}`}>{expiryText}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <a href={p.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 inline-flex items-center justify-center p-1.5 rounded-full hover:bg-blue-50 transition-all">
                                                <ExternalLink size={16} />
                                            </a>
                                        </td>
                                    </tr>
                                )
                            })}
                            {listings.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">Bu kategoride ilan bulunamadı.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingProp && (
                <AuthEditModal
                    property={editingProp}
                    onClose={() => setEditingProp(null)}
                    onSuccess={() => {
                        setEditingProp(null);
                        fetchPortfolio();
                    }}
                />
            )}
        </div>
    );
};

// Modal Component
const AuthEditModal = ({ property, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        auth_doc_url: property.auth_doc_url || '',
        auth_start_date: property.auth_start_date ? property.auth_start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        auth_end_date: property.auth_end_date ? property.auth_end_date.split('T')[0] : ''
    });
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await api.post('/upload/document', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, auth_doc_url: res.data.url }));
        } catch (err) {
            alert('Dosya yüklenemedi');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/properties/${property.id}`, formData);
            onSuccess();
        } catch (error) {
            alert('Güncelleme başarısız');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Yetki Belgesi Yönetimi</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Yetki Belgesi</label>
                        <div className="flex gap-2 items-center">
                            <label className="flex-1 cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed rounded-lg p-3 text-center transition-colors">
                                <span className="text-sm font-medium">{uploading ? 'Yükleniyor...' : 'Dosya Seç & Yükle (PDF/Resim)'}</span>
                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                            </label>
                        </div>
                        {formData.auth_doc_url && (
                            <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                                <FileText size={12} /> Dosya yüklü: ...{formData.auth_doc_url.slice(-15)}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Başlangıç</label>
                            <input
                                type="date"
                                required
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                value={formData.auth_start_date}
                                onChange={e => setFormData({ ...formData, auth_start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Bitiş</label>
                            <input
                                type="date"
                                required
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                value={formData.auth_end_date}
                                onChange={e => setFormData({ ...formData, auth_end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm shadow-blue-200">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PortfolioDashboard;
