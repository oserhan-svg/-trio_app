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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" />
                    Taze Eşleşmeler
                </h3>
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                    {matches.length} Yeni
                </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {matches.map((m) => (
                    <div
                        key={m.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/client/${m.client_id}`)}
                    >
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                                <User size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{m.client.name}</h4>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                        <Clock size={10} />
                                        {new Date(m.added_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                    <Home size={10} />
                                    {m.property.neighborhood} %85+ Uyum
                                </p>

                                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 group-hover:border-emerald-200 group-hover:bg-emerald-50/30 transition-all">
                                    <p className="text-[10px] text-gray-600 font-medium truncate">{m.property.title}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs font-bold text-emerald-700">
                                            {parseInt(m.property.price).toLocaleString()} ₺
                                        </span>
                                        <ChevronRight size={12} className="text-gray-400 group-hover:text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => navigate('/clients')}
                className="p-3 text-xs font-bold text-gray-500 hover:text-emerald-600 border-t border-gray-50 text-center flex items-center justify-center gap-1 hover:bg-gray-50 transition-all"
            >
                Tüm Müşterileri Yönet
                <ArrowRight size={12} />
            </button>
        </div>
    );
};

export default MatchNewsfeed;
