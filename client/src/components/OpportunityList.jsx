import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, ArrowRight, Home } from 'lucide-react';
import api from '../services/api';

const OpportunityList = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOpportunities = async () => {
            try {
                // We reuse the main properties endpoint but filter client-side for now 
                // or we could add a specific endpoint. 
                // For MVP, filtering the existing "All" list is fast enough if < 1000 items.
                const response = await api.get('/properties');
                const allProps = response.data;

                // Filter for "Kelepir" (Super Opportunity) and "Fırsat" (Good Deal)
                // Sort by score (descending) or deviation/price ratio
                const ops = allProps
                    .filter(p => p.opportunity_score >= 8) // 8, 9, 10
                    .sort((a, b) => b.opportunity_score - a.opportunity_score || b.deviation - a.deviation)
                    .slice(0, 5);

                setOpportunities(ops);
            } catch (error) {
                console.error('Failed to fetch opportunities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOpportunities();
    }, []);

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
                                <h3 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-green-700 transition">
                                    {prop.district} / {prop.neighborhood}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    {/* Source Badge */}
                                    {prop.url && prop.url.includes('sahibinden') && (
                                        <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 font-bold">
                                            SAHİBİNDEN
                                        </span>
                                    )}
                                    {prop.url && prop.url.includes('hepsiemlak') && (
                                        <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded border border-red-200 font-bold">
                                            HEPSİEMLAK
                                        </span>
                                    )}

                                    <span>{prop.rooms}</span>
                                    <span>•</span>
                                    <span>{prop.size_m2} m²</span>
                                    <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                        {Math.round(parseInt(prop.price) / prop.size_m2).toLocaleString()} TL/m²
                                    </span>
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
};

export default OpportunityList;
