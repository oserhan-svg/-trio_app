import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MatchCard from './MatchCard';

const MatchNewsfeed = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'high_score'
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRecentMatches();
    }, []);

    // OPTIMIZATION: useCallback to prevent unnecessary re-creation
    const fetchRecentMatches = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/clients/recent-matches');
            setMatches(response.data);
        } catch (error) {
            console.error('Failed to fetch recent matches:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // OPTIMIZATION: Debounced refresh to prevent spam clicks
    const handleRefresh = useCallback(() => {
        if (refreshing) return;
        setRefreshing(true);
        fetchRecentMatches().finally(() => {
            setTimeout(() => setRefreshing(false), 1000);
        });
    }, [refreshing, fetchRecentMatches]);

    // OPTIMIZATION: Memoize filtered results to prevent recalculation on every render
    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            if (m.property?.status === 'removed') return false;
            if (filter === 'high_score') return (m.score || 0) >= 90;
            return true;
        });
    }, [matches, filter]);

    if (loading) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse h-[600px]">
            <div className="flex justify-between mb-6">
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-4 bg-gray-100 rounded w-16"></div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-50 rounded-xl"></div>
                ))}
            </div>
        </div>
    );

    if (matches.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-white/90">
                <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Sparkles size={18} />
                        </div>
                        Eşleşme Akışı
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 ml-11">
                        Son 24 saatteki potansiyel fırsatlar
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setFilter('high_score')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${filter === 'high_score' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <Sparkles size={12} />
                        %90+
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`p-2 rounded-lg transition-all ${refreshing
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                            }`}
                        title="Yenile"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Feed Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                <div className="grid grid-cols-1 gap-4">
                    {filteredMatches.length > 0 ? (
                        filteredMatches.map(match => (
                            <MatchCard key={match.id} match={match} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <Filter size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">Bu kriterde eşleşme yok.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Status */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Toplam {filteredMatches.length} Fırsat Gösteriliyor
                </p>
            </div>
        </div>
    );
};

// OPTIMIZATION: React.memo to prevent unnecessary re-renders
export default React.memo(MatchNewsfeed);
