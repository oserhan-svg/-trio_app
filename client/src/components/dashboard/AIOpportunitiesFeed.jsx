import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, Brain, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AIOpportunitiesFeed = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await api.get('/whatsapp/recommendations/active');
                setRecommendations(res.data);
            } catch (err) {
                console.error('Failed to fetch AI recommendations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();

        // Refresh every 5 minutes or based on socket event later
        const interval = setInterval(fetchRecommendations, 300000);
        return () => clearInterval(interval);
    }, []);

    if (loading && recommendations.length === 0) return null;
    if (!loading && recommendations.length === 0) return null;

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Brain size={120} />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tight">AI Fırsatları</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gerçek Zamanlı Takip</p>
                    </div>
                </div>
                <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    <span className="text-[10px] font-bold text-blue-400">{recommendations.length} Yeni Bildirim</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {recommendations.map((rec) => (
                    <div
                        key={rec.id}
                        onClick={() => navigate(`/clients/${rec.client_id}`)}
                        className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-3xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group/item hover:translate-x-1"
                    >
                        <div className="flex items-start gap-4">
                            <div className="relative">
                                {rec.client?.profile_pic_url ? (
                                    <img src={rec.client.profile_pic_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                        <User size={18} />
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-slate-800">
                                    <TrendingUp size={8} />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold truncate group-hover/item:text-blue-400 transition-colors">
                                        {rec.client?.name || 'Bilinmeyen Müşteri'}
                                    </h4>
                                    <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                        %{rec.score}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                    {rec.client?.ai_summary || rec.recommendation}
                                </p>
                            </div>

                            <div className="self-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <ArrowRight size={16} className="text-slate-500" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors border border-slate-700/50">
                Tüm Analizleri Gör
            </button>
        </div>
    );
};

export default AIOpportunitiesFeed;
