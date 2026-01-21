import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Link as LinkIcon, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const MyListings = ({ userId }) => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchListings();
        }
    }, [userId]);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/properties?assigned_user_id=${userId}&limit=100`);

            if (response.data && response.data.data) {
                setListings(response.data.data);
            } else {
                setListings([]);
            }
        } catch (error) {
            console.error('Error fetching listings:', error);
            toast.error('İlanlar yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (property) => {
        setSelectedProperty(property);
        setIsModalOpen(true);
    };

    const handleUpdateSuccess = () => {
        setIsModalOpen(false);
        setSelectedProperty(null);
        fetchListings(); // Refresh list
    };

    const getRemainingDays = (endDate) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusBadge = (endDate, docUrl) => {
        if (!docUrl) return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Belge Yok</span>;

        const days = getRemainingDays(endDate);

        if (days === null) return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Süresiz/Belirsiz</span>;

        if (days < 0) return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded"><AlertCircle size={12} /> Süresi Dolmuş</span>;
        if (days <= 7) return <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded"><Clock size={12} /> Süre Az ({days} gün)</span>;

        return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><CheckCircle size={12} /> Aktif ({days} gün)</span>;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">İlanlarım ve Yetki Belgeleri</h2>
                <div className="text-sm text-gray-500">Toplam {listings.length} ilan</div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">İlan</th>
                            <th className="px-4 py-3">Fiyat</th>
                            <th className="px-4 py-3">Yetki Durumu</th>
                            <th className="px-4 py-3">Belge</th>
                            <th className="px-4 py-3 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {listings.map(property => (
                            <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 max-w-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                            {property.images && property.images[0] ? (
                                                <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 truncate" title={property.title}>{property.title}</div>
                                            <div className="text-xs text-gray-500">{property.district} / {property.neighborhood}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(property.price)}
                                </td>
                                <td className="px-4 py-3">
                                    {getStatusBadge(property.auth_end_date, property.auth_doc_url)}
                                </td>
                                <td className="px-4 py-3">
                                    {property.auth_doc_url ? (
                                        <a href={property.auth_doc_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                                            <LinkIcon size={12} /> Belgeyi Aç
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleEditClick(property)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition"
                                    >
                                        <FileText size={14} /> Yetki Düzenle
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {listings.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    Size atanmış ilan bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedProperty && (
                <AuthEditModal
                    property={selectedProperty}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleUpdateSuccess}
                />
            )}
        </div>
    );
};

const AuthEditModal = ({ property, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        auth_doc_url: property.auth_doc_url || '',
        auth_start_date: property.auth_start_date ? property.auth_start_date.split('T')[0] : '',
        auth_end_date: property.auth_end_date ? property.auth_end_date.split('T')[0] : ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/properties/${property.id}`, {
                auth_doc_url: formData.auth_doc_url,
                auth_start_date: formData.auth_start_date || null,
                auth_end_date: formData.auth_end_date || null
            });

            toast.success('Yetki bilgileri güncellendi');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Hata: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Yetki Belgesi Düzenle</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Belge Linki (Drive/Dropbox vb.)</label>
                        <input
                            type="url"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red text-sm p-2 border"
                            placeholder="https://..."
                            value={formData.auth_doc_url}
                            onChange={e => setFormData({ ...formData, auth_doc_url: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                            <input
                                type="date"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red text-sm p-2 border"
                                value={formData.auth_start_date}
                                onChange={e => setFormData({ ...formData, auth_start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                            <input
                                type="date"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red text-sm p-2 border"
                                value={formData.auth_end_date}
                                onChange={e => setFormData({ ...formData, auth_end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                        <p>Yetki belgesi süresi dolduğunda size bildirim gönderilecektir.</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">İptal</button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm bg-brand-red text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyListings;
