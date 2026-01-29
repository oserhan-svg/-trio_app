import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Brain, TrendingUp, CheckCircle, Clock, Zap, BookOpen, PlayCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const AILearningStatus = () => {
    const [stats, setStats] = useState(null);
    const [learnedRules, setLearnedRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchLearnedRules();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/ai-learning/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching AI stats:', error);
        }
    };

    const fetchLearnedRules = async () => {
        try {
            const response = await api.get('/ai-learning/insights');
            setLearnedRules(response.data.slice(0, 3)); // Show fewer in compact view
            setLoading(false);
        } catch (error) {
            console.error('Error fetching learned rules:', error);
            setLoading(false);
        }
    };

    const handleApprove = async (id, e) => {
        e.stopPropagation();
        try {
            await api.patch(`/ai-learning/insights/${id}/approve`);
            toast.success('Kural onaylandı ve aktif edildi!');
            fetchLearnedRules();
        } catch (error) {
            toast.error('Hata: ' + error.message);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/ai-learning/insights/${id}`);
            toast.success('Kural silindi.');
            fetchLearnedRules();
        } catch (error) {
            toast.error('Hata: ' + error.message);
        }
    };

    const runOptimization = async (e) => {
        e.stopPropagation();
        try {
            setIsOptimizing(true);
            await api.post('/ai-learning/optimize');
            toast.success('Optimizasyon tamamlandı!');
            fetchStats();
            fetchLearnedRules();
        } catch (error) {
            toast.error('Hata: ' + error.message);
        } finally {
            setIsOptimizing(false);
        }
    };

    if (loading) return null;

    return (
        <div
            className={`transition-all duration-300 overflow-hidden cursor-pointer ${isExpanded ? 'bg-gradient-to-br from-indigo-50 to-purple-50 p-3' : 'bg-indigo-50/50 p-1.5'
                } rounded-xl border border-indigo-100 shadow-sm`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Header / Compact View */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'w-8 h-8 bg-indigo-500' : 'w-6 h-6 bg-indigo-400'
                        }`}>
                        <Brain className="text-white" size={isExpanded ? 16 : 12} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-gray-900 transition-all ${isExpanded ? 'text-sm' : 'text-xs'}`}>
                            {isExpanded ? 'AI Öğrenme Merkezi' : 'AI Durumu'}
                        </h3>
                        {!isExpanded && stats && (
                            <div className="flex gap-2 mt-0.5 text-[10px] text-indigo-600 font-semibold">
                                <span>{stats.totalRules} Kural</span>
                                <span>•</span>
                                <span>{stats.successfulDeals} Satış</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isExpanded && (
                        <button
                            onClick={runOptimization}
                            disabled={isOptimizing}
                            className="p-1.5 hover:bg-white rounded-lg text-indigo-500 transition-colors"
                            title="Hızlı Optimize"
                        >
                            <Zap size={14} className={isOptimizing ? 'animate-pulse' : ''} />
                        </button>
                    )}
                    <div className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2.5 rounded-lg border border-indigo-50 shadow-sm">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Kurallar</span>
                            <div className="text-lg font-bold text-gray-800">{stats?.totalRules || 0}</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-indigo-50 shadow-sm">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Başarı</span>
                            <div className="text-lg font-bold text-gray-800">{stats?.successfulDeals || 0}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Öğrenilen Bilgiler</h4>
                            <span className="text-[10px] text-indigo-400 font-medium">Son 3</span>
                        </div>
                        {learnedRules.length === 0 ? (
                            <div className="text-[10px] text-gray-400 italic text-center py-4 bg-white/40 rounded-lg">Henüz öğrenilmiş bir kural yok.</div>
                        ) : learnedRules.map((rule) => (
                            <div key={rule.id} className="bg-white/70 p-2.5 rounded-xl border border-indigo-50 shadow-sm animate-in slide-in-from-right-2 duration-300">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full w-fit ${rule.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {rule.status === 'active' ? 'Aktif' : 'Öneri'}
                                        </span>
                                        <p className="text-[11px] font-bold text-gray-800 leading-relaxed">
                                            <span className="text-indigo-600 font-extrabold">[{rule.category === 'regional' ? 'Bölge' : 'Kural'}]</span> {rule.content}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {rule.status === 'proposed' && (
                                            <button
                                                onClick={(e) => handleApprove(rule.id, e)}
                                                className="p-1 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-colors border border-emerald-100"
                                                title="Onayla"
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(rule.id, e)}
                                            className="p-1 hover:bg-rose-50 text-rose-400 rounded-lg transition-colors border border-rose-100"
                                            title="Sil"
                                        >
                                            <Clock size={14} className="rotate-45" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={runOptimization}
                            disabled={isOptimizing}
                            className="flex-1 text-[10px] bg-indigo-500 text-white py-2 rounded-lg font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-1"
                        >
                            <Zap size={12} /> Optimize Et
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AILearningStatus;
