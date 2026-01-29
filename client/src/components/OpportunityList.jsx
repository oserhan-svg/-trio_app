import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, ArrowRight, Home, MapPin } from 'lucide-react';
import useOpportunities from '../hooks/useOpportunities';

const OpportunityList = React.memo(() => {
    const { opportunities: allOpportunities, loading, filterOpportunities } = useOpportunities({
        minScore: 8,
        limit: 100 // Get more data, filter locally
    });

    // Memoize filtered and sorted opportunities
    const opportunities = useMemo(() => {
        return filterOpportunities(allOpportunities).slice(0, 5);
    }, [allOpportunities, filterOpportunities]);

    if (loading) return <div className="p-4 text-gray-500">Fırsatlar yükleniyor...</div>;
    if (opportunities.length === 0) return null; // Don't show if no deals

    return (
        <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white">
                    <TrendingDown size={24} className="animate-bounce" />
                    <h2 className="text-lg font-bold">Günün Fırsatları (Top 5)</h2>
                </div>
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    Bölge Ortalamasının Altında
                </span>
            </div>

            <div className="divide-y divide-gray-100">
                {opportunities.map((prop) => (
                    <div key={prop.id} className="p-4 hover:bg-green-50 transition flex justify-between items-center group">
                        <div className="flex gap-4 items-center">
                            {/* Thumb or Placeholder */}
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden relative">
                                {prop.images && prop.images.length > 0 ? (
                                    <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                ) : (
                                    <Home className="w-8 h-8 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                )}
                                <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1 rounded-br">
                                    %{prop.deviation}
                                </div>
                            </div>

                            <div>
                                <h3 className={`font-bold text-gray-800 text-xs leading-tight line-clamp-2`} title={prop.title}>
                                    {prop.title?.split('#')[0].trim()}
                                </h3>
                                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <MapPin size={14} /> {prop.district} / {prop.neighborhood}
                                    <span className="mx-1">•</span>
                                    <span>İlan No: {prop.external_id?.split('block')[0]}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    {/* Source Badge */}
                                    {prop.url && prop.url.includes('sahibinden') && (
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded shadow-sm font-bold"
                                            style={{ backgroundColor: '#ffdb15', color: '#000' }}
                                        >
                                            SAHİBİNDEN
                                        </span>
                                    )}
                                    {prop.url && prop.url.includes('hepsiemlak') && (
                                        <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded border border-red-200 font-bold">
                                            HEPSİEMLAK
                                        </span>
                                    )}

                                    {prop.seller_name && prop.seller_name !== 'Bilinmiyor' && (
                                        <span
                                            className={`text-[10px] px-1.5 py-0.5 rounded border ${prop.url.includes('sahibinden') ? 'border-yellow-400 font-black' : (prop.seller_type === 'owner' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-50 text-gray-600 border-gray-200')} font-bold`}
                                            style={prop.url.includes('sahibinden') ? { backgroundColor: '#ffdb15', color: '#000' } : {}}
                                        >
                                            {prop.seller_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                                {parseInt(prop.price).toLocaleString()} TL
                            </div>
                            <Link
                                to={`/property/${prop.id}`}
                                className="inline-flex items-center text-xs text-blue-500 hover:text-blue-700 font-medium mt-1"
                            >
                                Detay <ArrowRight size={12} className="ml-1" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default OpportunityList;
