import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, ArrowRight, Home, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import api from '../services/api';

const OpportunityCarousel = ({ compact = false }) => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const itemsPerSlide = compact ? 1 : 3;

    useEffect(() => {
        const fetchOpportunities = async () => {
            try {
                const response = await api.get('/properties');
                const allProps = response.data;
                // Filter for high-score deals AND Owner listings (from ANY portal)
                const ops = allProps
                    .filter(p =>
                        p.opportunity_score >= 8 &&
                        p.seller_type === 'owner'
                    )
                    .sort((a, b) => b.opportunity_score - a.opportunity_score || b.deviation - a.deviation)
                    .slice(0, 10);
                setOpportunities(ops);
            } catch (error) {
                console.error('Failed to fetch opportunities:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOpportunities();
    }, []);

    const getCategory = (p) => {
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const category = p.category || '';
        if (title.includes('zeytin') || desc.includes('zeytinlik')) return { label: 'Zeytinlik', icon: Palmtree, color: 'text-olive-600' };
        if (title.includes('villa') || title.includes('müstakil')) return { label: 'Villa', icon: Home, color: 'text-purple-600' };
        if (category === 'land' || title.includes('arsa')) return { label: 'Arsa', icon: TreeDeciduous, color: 'text-emerald-600' };
        return { label: 'Daire', icon: Building, color: 'text-blue-600' };
    };

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % Math.ceil(opportunities.length / itemsPerSlide));
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + Math.ceil(opportunities.length / itemsPerSlide)) % Math.ceil(opportunities.length / itemsPerSlide));

    if (loading) return null;
    if (opportunities.length === 0) return null;

    return (
        <div className={`relative group h-full flex flex-col ${compact ? '' : 'mb-8'}`}>
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="bg-emerald-100 p-1 rounded-md text-emerald-600">
                        <TrendingDown size={compact ? 14 : 20} />
                    </div>
                    <div>
                        <h2 className={`${compact ? 'text-xs' : 'text-lg'} font-bold text-gray-900 leading-none`}>Fırsatlar</h2>
                        {!compact && <span className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">Ayvalık'ın En İyi Portföyleri</span>}
                    </div>
                </div>

                {opportunities.length > itemsPerSlide && (
                    <div className="flex gap-1">
                        <button onClick={prevSlide} className="p-0.5 rounded border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                            <ChevronLeft size={12} className="text-gray-600" />
                        </button>
                        <button onClick={nextSlide} className="p-0.5 rounded border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                            <ChevronRight size={12} className="text-gray-600" />
                        </button>
                    </div>
                )}
            </div>

            <div className={`grid ${compact ? 'grid-cols-1 h-full min-h-0' : 'grid-cols-1 md:grid-cols-3'} gap-4 flex-1`}>
                {opportunities.slice(currentIndex * itemsPerSlide, (currentIndex * itemsPerSlide) + itemsPerSlide).map((prop) => {
                    const cat = getCategory(prop);
                    const Icon = cat.icon;
                    const isKelepir = prop.opportunity_score >= 9 || prop.deviation >= 20;

                    return (
                        <Link
                            to={`/property/${prop.id}`}
                            key={prop.id}
                            className={`bg-white rounded-xl border transition-all group/card overflow-hidden flex h-full ${isKelepir ? 'border-orange-200 shadow-orange-50 shadow-lg' : 'border-gray-200 shadow-sm hover:shadow-md'
                                }`}
                        >
                            {/* Compact Image */}
                            <div className={`${compact ? 'w-24' : 'w-24'} h-full bg-gray-100 flex-shrink-0 relative overflow-hidden border-r border-gray-100`}>
                                {prop.images && prop.images.length > 0 ? (
                                    <img
                                        src={prop.images[0]}
                                        alt={prop.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Home size={20} className="text-gray-300" />
                                    </div>
                                )}
                                <div className={`absolute top-1 left-1 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow-sm ${isKelepir ? 'bg-orange-600 animate-pulse' : 'bg-red-600'
                                    }`}>
                                    -%{prop.deviation}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-2 flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    <div className="flex justify-between items-start gap-1 mb-1">
                                        <div className="flex flex-col gap-0.5">
                                            {prop.url && prop.url.includes('sahibinden') ? (
                                                <span className="text-[7px] bg-yellow-50 text-yellow-800 px-1 py-0.5 rounded border border-yellow-200 font-bold w-fit">SAHİBİNDEN</span>
                                            ) : (
                                                <span className="text-[7px] bg-red-50 text-red-800 px-1 py-0.5 rounded border border-red-200 font-bold w-fit">HEPSİEMLAK</span>
                                            )}
                                            <div className={`flex items-center gap-0.5 text-[8px] font-bold uppercase ${cat.color}`}>
                                                <Icon size={8} />
                                                {cat.label}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500">
                                            {prop.rooms} • {prop.size_m2} m²
                                        </span>
                                    </div>
                                    <h3 className={`font-bold text-gray-800 ${compact ? 'text-xs' : 'text-sm'} leading-tight truncate`} title={prop.title}>
                                        {prop.neighborhood}
                                    </h3>

                                    {/* Rationale Badge */}
                                    <div className={`mt-1 text-[9px] font-bold inline-flex items-center gap-0.5 px-1 rounded ${isKelepir ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                        <ChevronRight size={8} />
                                        {prop.deviation >= 15 ? 'Bölge Ort. %15+ Altında' : 'Piyasanın Altında'}
                                    </div>
                                </div>

                                <div className="mt-2 text-right">
                                    <div className={`font-extrabold text-sm ${isKelepir ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        {parseInt(prop.price).toLocaleString()} ₺
                                    </div>
                                    <div className="text-[9px] text-gray-400">
                                        {Math.round(parseInt(prop.price) / (prop.size_m2 || 1)).toLocaleString()} ₺/m²
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default OpportunityCarousel;
