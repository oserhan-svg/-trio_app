import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Users, MessageSquare, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const PerformanceDetailModal = ({ consultant, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (consultant?.id) {
            fetchDetail();
        }
    }, [consultant]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/performance/${consultant.id}`);
            setDetails(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching details:', err);
            setLoading(false);
        }
    };

    if (!consultant) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">
                            {consultant.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{consultant.email}</h2>
                            <p className="text-sm text-slate-500">Detaylı Performans Analizi</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="flex justify-center p-12 text-slate-400">Veriler hazırlanıyor...</div>
                    ) : (
                        <>
                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Monthly Trends */}
                                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-500" />
                                        Portföy & Etkileşim Trendi (6 Ay)
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={details.monthlyStats}>
                                                <defs>
                                                    <linearGradient id="colorPort" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Area type="monotone" dataKey="portföy" stroke="#10b981" fillOpacity={1} fill="url(#colorPort)" strokeWidth={3} />
                                                <Area type="monotone" dataKey="etkileşim" stroke="#3b82f6" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Client Status Distribution */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Users size={16} className="text-blue-500" />
                                        Müşteri Durum Dağılımı
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={details.clientStatusDist}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {details.clientStatusDist.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activities */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-slate-800 font-bold">
                                    <Clock size={18} className="text-indigo-500" />
                                    Son Aktiviteler
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {details.recentInteractions.map((act) => (
                                        <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <MessageSquare size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{act.client.name} ile görüşme</p>
                                                    <p className="text-xs text-slate-400">{act.content || 'Not girilmedi'}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400">{new Date(act.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    ))}
                                    {details.recentInteractions.length === 0 && (
                                        <div className="p-8 text-center text-slate-400 text-sm">Henüz bir aktivite kaydı yok.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerformanceDetailModal;
