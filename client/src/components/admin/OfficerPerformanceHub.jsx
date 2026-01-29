import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Zap, Star, LayoutGrid, MessageSquare, DollarSign } from 'lucide-react';
import api from '../../services/api';

const OfficerPerformanceHub = ({ userId }) => {
    const [scorecard, setScorecard] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPerformanceData();
    }, [userId]);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const [scoreRes, activityRes] = await Promise.all([
                api.get(`/officers/${userId}/scorecard`),
                api.get('/officers/team-activity')
            ]);
            setScorecard(scoreRes.data);
            setActivities(activityRes.data);
        } catch (error) {
            console.error('Failed to fetch performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Performans verileri hesaplanıyor...</div>;
    if (!scorecard) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scorecard Column */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 text-center text-white">
                        <div className="inline-block p-4 bg-white/10 rounded-full mb-4 ring-4 ring-white/5">
                            <Trophy size={48} className="text-amber-400" />
                        </div>
                        <h3 className="text-xl font-black">{scorecard.rank}</h3>
                        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-1">GÜNCEL ÜNVAN</p>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-4">
                        <MetricBox icon={<DollarSign size={14} />} label="Hakediş" value={scorecard.totalRevenueAssigned.toLocaleString('tr-TR') + ' ₺'} />
                        <MetricBox icon={<Zap size={14} />} label="Kapanan" value={scorecard.dealsClosed} />
                        <MetricBox icon={<Users size={14} />} label="Aktif Lead" value={scorecard.activeLeads} />
                        <MetricBox icon={<TrendingUp size={14} />} label="Dönüşüm" value={`%${scorecard.conversionRate}`} />
                    </div>
                </div>
            </div>

            {/* Team Activity Feed */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[400px]">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-black text-gray-700 text-sm flex items-center gap-2">
                        <Users size={18} className="text-indigo-600" />
                        Ekip Aktivite Akışı
                    </h3>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">CANLI</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activities.length > 0 ? (
                        activities.map((act, idx) => (
                            <div key={idx} className="flex gap-4 items-start group">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-white shadow-sm font-black text-xs text-slate-500">
                                    {act.userName?.[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-gray-800 leading-tight">
                                        <span className="font-black text-indigo-700">{act.userName}</span> {act.message}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                                        <Clock size={10} /> {new Date(act.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                            <MessageSquare size={32} className="opacity-10 mb-2" />
                            <p className="text-xs">Henüz bir ekip hareketi kaydedilmedi.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricBox = ({ icon, label, value }) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 group hover:border-indigo-200 transition">
        <div className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
            {icon} {label}
        </div>
        <div className="text-sm font-black text-gray-800">{value}</div>
    </div>
);

export default OfficerPerformanceHub;
