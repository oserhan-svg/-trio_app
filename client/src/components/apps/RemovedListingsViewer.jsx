import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Calendar, Search } from 'lucide-react';
import api from '../../services/api';

const RemovedListingsViewer = ({ onBack }) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRemovedProperties();
    }, []);

    const fetchRemovedProperties = async () => {
        try {
            const response = await api.get('/properties', {
                params: {
                    status: 'removed',
                    limit: 500, // Fetch up to 500 removed listings
                    sort: 'newest'
                }
            });

            // Handle different response structures
            const raw = response.data;
            const data = Array.isArray(raw) ? raw : (raw.data || []);
            setProperties(data);
        } catch (error) {
            console.error('Failed to fetch removed properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPortalName = (url) => {
        if (!url) return 'Bilinmiyor';
        if (url.includes('sahibinden.com')) return 'Sahibinden';
        if (url.includes('hepsiemlak.com')) return 'Hepsiemlak';
        if (url.includes('emlakjet.com')) return 'Emlakjet';
        return 'Diğer';
    };

    const getPortalBadgeColor = (portal) => {
        switch (portal) {
            case 'Sahibinden': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Hepsiemlak': return 'bg-red-100 text-red-800 border-red-200';
            case 'Emlakjet': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatListingId = (id) => {
        if (!id) return 'Yok';
        // Remove known suffixes like 'block22' or similar internal tags
        // Hepsiemlak IDs are typically "12345-67"
        return id.replace(/block\d+$/i, '').replace(/-block.*$/i, '');
    };

    const filteredProperties = properties.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-2"></div>
            Yükleniyor...
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
                <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="mr-2 p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        Pasif İlanlar
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Portallardan silinen {filteredProperties.length} ilan.
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="İlan Ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-white text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-2">Portal / No</th>
                            <th className="px-4 py-2">Görsel</th>
                            <th className="px-4 py-2">Başlık / Bölge</th>
                            <th className="px-4 py-2">Son Fiyat</th>
                            <th className="px-4 py-2">Kaldırılma Tarihi</th>
                            <th className="px-4 py-2 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map(p => {
                                const portal = getPortalName(p.url);
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPortalBadgeColor(portal)} w-fit`}>
                                                    {portal}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    #{formatListingId(p.external_id)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {p.images && p.images[0] ? (
                                                <img
                                                    src={p.images[0]}
                                                    alt={p.title}
                                                    className="w-8 h-8 object-cover rounded border border-gray-200 opacity-60 grayscale group-hover:grayscale-0 transition-all"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-[8px] text-gray-400">
                                                    No Img
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="max-w-xs">
                                                <div className="font-medium text-gray-900 truncate" title={p.title}>
                                                    {p.title}
                                                </div>
                                                <div className="text-[10px] text-gray-500 truncate">
                                                    {p.neighborhood}, {p.district} • {p.rooms || '-'} Oda • {p.size_m2 || '-'} m²
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                                            {parseFloat(p.price).toLocaleString()} ₺
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5" title="Son Sinyal">
                                                {p.last_scraped ? new Date(p.last_scraped).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right whitespace-nowrap">
                                            <a
                                                href={p.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[10px] font-medium hover:underline bg-transparent"
                                            >
                                                <ExternalLink size={10} />
                                                Git
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                                    {searchTerm ? 'Arama kriterlerine uygun pasif ilan bulunamadı.' : 'Henüz tespit edilmiş pasif/silinen ilan yok.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RemovedListingsViewer;
