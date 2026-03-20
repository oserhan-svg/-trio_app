import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Calendar, Plus, Filter, Download, ArrowLeft, CheckCircle, Percent, DollarSign, User, MapPin } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const RevenueTracker = ({ onBack }) => {
    const [deals, setDeals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        property_id: '',
        client_id: '',
        sale_price: '',
        commission_rate: '3.0',
        deal_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [properties, setProperties] = useState([]);
    const [clients, setClients] = useState([]);

    useEffect(() => {
        fetchData();
        fetchHelpers();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dealsRes, statsRes] = await Promise.all([
                api.get('/deals'),
                api.get('/deals/stats')
            ]);
            setDeals(dealsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch financial data", error);
            toast.error("Finansal veriler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const fetchHelpers = async () => {
        try {
            const [propRes, clientRes] = await Promise.all([
                api.get('/properties?status=active'),
                api.get('/clients')
            ]);
            setProperties(propRes.data.properties || []);
            setClients(clientRes.data);
        } catch (e) {
            console.error("Helpers fetch failed", e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/deals', formData);
            toast.success("Satış başarıyla kaydedildi.");
            setShowAddModal(false);
            fetchData();
        } catch (error) {
            toast.error("Satış kaydedilemedi.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} aria-label="Geri Dön" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors focus:ring-2 focus:ring-indigo-500 outline-none">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Finansal Takip & Komisyon</h2>
                        <p className="text-sm text-gray-500">Kapatılan satışları ve hak edişleri yönetin.</p>
                    </div>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                    <Plus size={18} /> Yeni Satış Ekle
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                        <DollarSign size={24} />
                    </div>
                    <div className="text-gray-500 text-sm font-medium">Toplam Satış Hacmi</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">
                        {stats?.totalSalesVolume?.toLocaleString()} ₺
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                        <Percent size={24} />
                    </div>
                    <div className="text-gray-500 text-sm font-medium">Kazanılan Komisyon</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">
                        {stats?.totalRevenue?.toLocaleString()} ₺
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                        <TrendingUp size={24} />
                    </div>
                    <div className="text-gray-500 text-sm font-medium">Satış Adedi</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">
                        {stats?.dealCount} Adet
                    </div>
                </div>
            </div>

            {/* Deals List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-gray-700 flex justify-between items-center">
                    <span>Satış Geçmişi</span>
                    <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs">
                        <Download size={14} /> Dışa Aktar (Excel)
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Tarih</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">İlan / Müşteri</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Satış Bedeli</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Komisyon</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {deals.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                        Henüz kaydedilmiş bir satış bulunmuyor.
                                    </td>
                                </tr>
                            ) : deals.map(deal => (
                                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                        {new Date(deal.deal_date).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-bold text-gray-900">{deal.property?.title || 'Direkt Satış'}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <User size={12} /> {deal.client?.name || 'Bireysel'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-gray-900">
                                        {parseFloat(deal.sale_price).toLocaleString()} ₺
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="text-emerald-700 font-black">
                                            {parseFloat(deal.commission_amount).toLocaleString()} ₺
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold">
                                            %{deal.commission_rate} Oran
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded uppercase flex items-center gap-1 w-fit">
                                            <CheckCircle size={10} /> TAMAMLANDI
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Deal Modal - Simple implementation */}
            {showAddModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600">
                            <h3 className="text-white font-bold text-lg">Yeni Satış Kaydı</h3>
                            <button onClick={() => setShowAddModal(false)} aria-label="Kapat" className="text-white/80 hover:text-white focus:ring-2 focus:ring-white outline-none rounded"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">Satış Bedeli (₺)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.sale_price}
                                        onChange={e => setFormData({ ...formData, sale_price: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">Komisyon Oranı (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.commission_rate}
                                        onChange={e => setFormData({ ...formData, commission_rate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">İlişkili İlan (Opsiyonel)</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                                    value={formData.property_id}
                                    onChange={e => setFormData({ ...formData, property_id: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.title} - {p.price?.toLocaleString()} ₺</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">Müşteri (Opsiyonel)</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                                    value={formData.client_id}
                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">Notlar</label>
                                <textarea
                                    rows="3"
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Satışla ilgili detaylar..."
                                />
                            </div>

                            <Button type="submit" className="w-full py-3">Satışı Kaydet ve Kapat</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Lucide X import for modal
const X = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default RevenueTracker;
