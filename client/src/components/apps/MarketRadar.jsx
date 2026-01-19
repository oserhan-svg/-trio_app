import React, { useState, useEffect } from 'react';
import { ArrowLeft, Home, Building, TreeDeciduous, ExternalLink, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const MarketRadar = ({ onBack }) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('daire'); // 'daire', 'villa', 'arsa', 'zeytinlik'

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await api.get('/properties');
            setProperties(response.data);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    // Categorization Logic
    const getCategory = (p) => {
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const category = p.category || '';

        // Zeytinlik check first (usually subsets of Land)
        if (title.includes('zeytin') || desc.includes('zeytinlik')) return 'zeytinlik';

        // Villa / Müstakil
        if (title.includes('villa') || title.includes('müstakil') || title.includes('yalı') || title.includes('köşk')) return 'villa';

        // Arsa (Land that isn't zeytinlik)
        if (category === 'land' || title.includes('arsa') || title.includes('arazi') || title.includes('imar')) return 'arsa';

        if (category === 'tarla' || title.includes('tarla') || title.includes('bağ')) return 'tarla';

        if (category === 'commercial' || title.includes('dükkan') || title.includes('mağaza') || title.includes('ofis') || title.includes('işyeri')) return 'commercial';

        if (category === 'tourism' || title.includes('otel') || title.includes('pansiyon') || title.includes('apart')) return 'tourism';

        // Daire (Default residential)
        return 'daire';
    };

    const categories = [
        { id: 'daire', label: 'Daire', icon: Building, color: 'blue' },
        { id: 'villa', label: 'Villa', icon: Home, color: 'purple' },
        { id: 'arsa', label: 'Arsa', icon: TreeDeciduous, color: 'emerald' },
        { id: 'zeytinlik', label: 'Zeytinlik', icon: TreeDeciduous, color: 'lime' }, // Olive -> Lime
        { id: 'tarla', label: 'Tarla', icon: TreeDeciduous, color: 'amber' },
        { id: 'commercial', label: 'İşyeri', icon: Building, color: 'gray' },
        { id: 'tourism', label: 'Turizm', icon: Home, color: 'orange' }
    ];

    const filteredProperties = properties
        .filter(p => getCategory(p) === activeCategory)
        .sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
        .slice(0, 20); // Top 20

    if (loading) return <div className="p-8 text-center text-gray-500">Piyasa verileri taranıyor...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-600"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="text-rose-500" />
                            Fırsat Radarı
                        </h2>
                        <p className="text-sm text-gray-500">Kategorilere göre en yüksek puanlı fırsatlar</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1">
                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left whitespace-nowrap ${isActive
                                    ? 'bg-white shadow-sm text-gray-900 font-bold ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${isActive ? `bg-${cat.color}-50 text-${cat.color}-600` : 'bg-transparent'
                                    }`}>
                                    <Icon size={20} className={isActive ? '' : 'opacity-70'} />
                                </div>
                                <span>{cat.label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 bg-slate-50 overflow-y-auto h-[600px]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredProperties.length > 0 ? filteredProperties.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow group flex gap-4">
                                {/* Image */}
                                <div className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                                    {p.images && p.images[0] ? (
                                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                                        {p.district}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                                            {p.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                            <span>{p.rooms || '-'}</span>
                                            <span>•</span>
                                            <span>{p.size_m2}m²</span>
                                            <span>•</span>
                                            <span>{p.neighborhood}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-lg font-bold text-emerald-600">
                                                {parseFloat(p.price).toLocaleString()} ₺
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {Math.round(p.price / p.size_m2).toLocaleString()} ₺/m²
                                            </div>
                                        </div>

                                        {/* Score Badge */}
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${p.opportunity_score >= 8 ? 'bg-emerald-100 text-emerald-700' :
                                                p.opportunity_score >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                <span>Puan: {p.opportunity_score}</span>
                                            </div>
                                            <a
                                                href={p.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="İlana Git"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-12 text-center text-gray-500 flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <TreeDeciduous className="text-gray-400" size={32} />
                                </div>
                                <p>Bu kategoride şu an fırsat listelenecek ilan bulunamadı.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketRadar;
