import React, { useState, useEffect } from 'react';
import { Sparkles, User, Home, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const MatchNewsfeed = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRecentMatches();
    }, []);

    const fetchRecentMatches = async () => {
        try {
            setLoading(true);
            const response = await api.get('/clients/recent-matches');
            setMatches(response.data);
        } catch (error) {
            console.error('Failed to fetch recent matches:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-50 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-50 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (matches.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 flex justify-between items-center">
                <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-600" />
                    Taze Eşleşmeler
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    {matches.length} Yeni
                </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                {matches.filter(m => m.property?.status !== 'removed').map((m) => (
                    <div
                        key={m.id}
                        className="px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group relative"
                        onClick={() => navigate(`/clients/${m.client_id}`)}
                    >
                        <div className="flex gap-2.5 items-start">
                            {/* Avatar */}
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5 border border-blue-100">
                                <User size={14} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Header: Name & Time */}
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-gray-900 text-xs truncate pr-2">{m.client.name}</h4>
                                    <span className="text-[9px] text-gray-400 flex items-center gap-0.5 whitespace-nowrap">
                                        {new Date(m.added_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Property Snippet */}
                                <div className="bg-white rounded border border-gray-100 p-1.5 group-hover:border-emerald-300 group-hover:shadow-sm transition-all">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1 truncate max-w-[60%]">
                                            <Home size={8} /> {m.property.district} / {m.property.neighborhood}
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                                            {parseInt(m.property.price).toLocaleString()} ₺
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-700 truncate font-medium">{m.property.title?.split('#')[0].trim()}</p>
                                </div>
                            </div>

                            {/* Hover Action Indicator */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white rounded-full p-1 shadow border border-gray-200 text-emerald-600">
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => navigate('/clients')}
                className="py-2 text-[10px] font-bold text-gray-500 hover:text-emerald-700 border-t border-gray-100 text-center flex items-center justify-center gap-1 hover:bg-gray-50 transition-all bg-gray-50/50"
            >
                Tümünü Gör
                <ArrowRight size={10} />
            </button>
        </div>
    );
};

export default MatchNewsfeed;
