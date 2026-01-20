import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Home, TrendingDown, Archive, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ClientMatchesModal = ({ isOpen, onClose, client, onUpdate }) => {
    const { addToast } = useToast();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && client) {
            fetchMatches();
        }
    }, [isOpen, client]);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/clients/${client.id}/matches`);
            setMatches(response.data);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSourceType = (url) => {
        if (!url) return null;
        if (url.includes('sahibinden.com')) return 'sahibinden';
        if (url.includes('hepsiemlak.com')) return 'hepsiemlak';
        return 'other';
    };

    const SourceBadge = ({ url }) => {
        const type = getSourceType(url);
        if (!type || type === 'other') return null;

        const styles = {
            sahibinden: 'bg-yellow-400 text-yellow-900',
            hepsiemlak: 'bg-red-500 text-white'
        };
        const labels = {
            sahibinden: 'Sahibinden',
            hepsiemlak: 'Hepsiemlak'
        };

        return (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 ${styles[type]}`}>
                {labels[type]}
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-0 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            ✨ Eşleşen İlanlar
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
                                {matches.length} İlan
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            <span className="font-semibold text-gray-700">{client?.name}</span> için otomatik öneriler
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/50">
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Olası eşleşmeler aranıyor...</div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-20">
                            <Home className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Eşleşme Bulunamadı</h3>
                            <p className="text-gray-500">Müşteri kriterlerine uygun ilan şu an yok.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matches.map(prop => (
                                <div key={prop.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group flex gap-4">
                                    {/* Image Thumb */}
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                                        {prop.images && prop.images.length > 0 ? (
                                            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <Home className="w-8 h-8 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        )}
                                        {prop.opportunity_score >= 8 && (
                                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-bl">
                                                ★ Fırsat
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900 line-clamp-1 text-sm group-hover:text-emerald-600 transition flex items-center">
                                                {prop.district} / {prop.neighborhood}
                                                <SourceBadge url={prop.url} />
                                            </h4>
                                            <span className="text-emerald-700 font-bold text-sm">
                                                {parseInt(prop.price).toLocaleString()} ₺
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2.5em]">
                                            {prop.rooms} • {prop.size_m2}m² • {prop.title?.split('#')[0].trim()}
                                        </p>

                                        {/* Match Badge */}
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded border border-blue-100 inline-flex items-center gap-1">
                                                <TrendingDown size={10} />
                                                Uygunluk: %{(prop.match_quality || 90)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-3 flex justify-between items-center border-t border-gray-100 pt-2">
                                            {client?.saved_properties?.some(saved => saved.property_id === prop.id) ? (
                                                <button
                                                    disabled
                                                    className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded flex items-center gap-1 font-medium cursor-not-allowed"
                                                >
                                                    <CheckCircle size={12} /> Listede Ekli
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await api.post(`/clients/${client.id}/properties`, {
                                                                propertyId: prop.id,
                                                                status: 'suggested'
                                                            });
                                                            addToast('İlan portföye eklendi');
                                                            if (onUpdate) onUpdate();
                                                        } catch (e) {
                                                            const errorMsg = e.response?.data?.error || 'Bir hata oluştu';
                                                            addToast(errorMsg, 'error');
                                                            console.error('Add Prop Error:', e);
                                                        }
                                                    }}
                                                    className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1 font-medium transition-colors"
                                                >
                                                    <Archive size={12} /> Listeye Ekle
                                                </button>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.open(`/property-listing/${prop.id}`, '_blank')}
                                                    className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 flex items-center gap-1 font-medium transition-colors"
                                                    title="İlan Sayfası Oluştur"
                                                >
                                                    <FileText size={12} /> Sayfa
                                                </button>

                                                <Link
                                                    to={`/property/${prop.id}`}
                                                    target="_blank"
                                                    className="text-gray-400 hover:text-emerald-600 text-xs flex items-center gap-1 font-medium transition-colors"
                                                >
                                                    İlanı Gör <ExternalLink size={12} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientMatchesModal;
