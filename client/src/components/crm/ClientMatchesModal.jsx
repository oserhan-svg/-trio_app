import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Home, TrendingDown, Archive, FileText, CheckCircle, MapPin, Maximize2 } from 'lucide-react';
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

    const SourceBadge = ({ url }) => {
        if (!url) return null;
        let type = 'other';
        if (url.includes('sahibinden.com')) type = 'sahibinden';
        if (url.includes('hepsiemlak.com')) type = 'hepsiemlak';

        if (type === 'other') return null;

        const styles = {
            sahibinden: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            hepsiemlak: 'bg-red-100 text-red-800 border-red-200'
        };
        const labels = { sahibinden: 'S', hepsiemlak: 'H' };

        return (
            <span className={`text-[9px] w-4 h-4 flex items-center justify-center rounded-full border font-bold ${styles[type]}`} title={type === 'sahibinden' ? 'Sahibinden' : 'Hepsiemlak'}>
                {labels[type]}
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-t-xl">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            ✨ Eşleşen İlanlar
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-200">
                                {matches.length}
                            </span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            <span className="font-semibold">{client?.name}</span> için kriterlere uygun ilanlar
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
                    {loading ? (
                        <div className="text-center py-20 text-sm text-gray-500">Olası eşleşmeler aranıyor...</div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-20">
                            <Home className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <h3 className="text-sm font-medium text-gray-900">Eşleşme Bulunamadı</h3>
                            <p className="text-xs text-gray-500">Kriterlere uygun ilan yok.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {matches.map(prop => (
                                <div key={prop.id} className="flex gap-3 p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group relative">

                                    {/* Compact Thumbnail */}
                                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden relative border border-gray-100">
                                        {prop.images && prop.images.length > 0 ? (
                                            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Home size={16} /></div>
                                        )}
                                        {/* Verification / Opportunity Badge Overly */}
                                        {(prop.opportunity_score >= 8) && (
                                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1 rounded-bl shadow-sm">
                                                ★
                                            </div>
                                        )}
                                        {/* Match Score Overlay */}
                                        <div className={`absolute bottom-0 w-full text-[8px] font-bold text-center text-white py-0.5 ${(prop.match_quality || 90) >= 80 ? 'bg-emerald-500' : 'bg-orange-500'
                                            }`}>
                                            %{(prop.match_quality || 90)}
                                        </div>
                                    </div>

                                    {/* Info Columns */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900 text-sm truncate pr-2 flex items-center gap-1.5" title={prop.title}>
                                                <SourceBadge url={prop.url} />
                                                {prop.title?.split('#')[0].trim()}
                                            </h4>
                                            <span className="font-bold text-emerald-700 text-sm whitespace-nowrap">
                                                {parseInt(prop.price).toLocaleString()} ₺
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={10} /> {prop.district}/{prop.neighborhood}
                                            </div>
                                            <span className="text-gray-300">|</span>
                                            <span>{prop.rooms}</span>
                                            <span className="text-gray-300">|</span>
                                            <span>{prop.size_m2} m²</span>
                                        </div>

                                        {/* Action Bar (Hidden by default, shown on hover/focus) */}
                                        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-gray-50 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Add Button */}
                                            {client?.saved_properties?.some(saved => saved.property_id === prop.id) ? (
                                                <button disabled className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded flex items-center gap-1 cursor-default">
                                                    <CheckCircle size={10} /> Ekli
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await api.post(`/clients/${client.id}/properties`, {
                                                                propertyId: prop.id, status: 'suggested'
                                                            });
                                                            addToast('Eklendi');
                                                            if (onUpdate) onUpdate();
                                                        } catch (e) { addToast('Hata', 'error'); }
                                                    }}
                                                    className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 flex items-center gap-1 transition-colors shadow-sm"
                                                >
                                                    <Archive size={10} /> Listeye Ekle
                                                </button>
                                            )}

                                            <div className="w-px h-3 bg-gray-200 mx-1"></div>

                                            <button onClick={() => window.open(`/property-listing/${prop.id}`, '_blank')} className="text-[10px] text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded flex items-center gap-1 transition">
                                                <FileText size={10} /> Sayfa
                                            </button>
                                            <Link to={`/property/${prop.id}`} target="_blank" className="text-[10px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition ml-auto">
                                                Orjinal <ExternalLink size={10} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Compact Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-md transition">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientMatchesModal;
