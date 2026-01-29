import React, { useState, useEffect } from 'react';
import { Target, Send, Calendar, Star, Info, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const DailySalesActionsWidget = () => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/sales/daily-actions');
            setActions(res.data);
        } catch (error) {
            console.error('Failed to fetch sales actions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = (phone, msg) => {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        // Future: Track that this action was performed
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Günün satış fırsatları hazırlanıyor...</div>;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Target size={20} className="text-blue-200" />
                    Günlük Satış Aksiyonları (AI Driven)
                </h3>
                <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                        {actions.length} ÖNCELİKLİ
                    </span>
                </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100 bg-gray-50/30">
                {actions.length > 0 ? (
                    actions.map((action, idx) => (
                        <div key={idx} className="p-5 hover:bg-white transition relative group">
                            {/* Match Score Badge */}
                            <div className="absolute top-4 right-4 text-center">
                                <div className="text-xl font-black text-indigo-600 leading-none">%{action.matchScore}</div>
                                <div className="text-[8px] font-bold text-gray-400 uppercase">Uyum</div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${action.reason === 'YENİ İLAN' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {action.reason}
                                </span>
                                <div className="text-xs font-black text-gray-800 flex items-center gap-1">
                                    <Star size={12} className="text-yellow-400 fill-current" />
                                    {action.clientName}
                                </div>
                            </div>

                            {/* Property Context */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                                    <img src={action.propertyThumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-800 truncate">{action.propertyTitle}</div>
                                    <div className="text-[10px] text-gray-400">{action.propertyDistrict}</div>
                                </div>
                            </div>

                            {/* The Pitch */}
                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mb-4 relative">
                                <Info size={14} className="absolute -top-1 -right-1 text-indigo-400" />
                                <div className="text-xs text-indigo-900 leading-relaxed italic">
                                    "{action.pitch}"
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSend(action.clientPhone, action.pitch)}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition"
                                >
                                    <Send size={14} />
                                    WhatsApp ile Gönder
                                </button>
                                <button className="px-3 bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 rounded-lg transition">
                                    <Calendar size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-20 text-center text-gray-400">
                        <Target size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-medium">Satış ekibi için şu an aktif bir aksiyon bulunmuyor.</p>
                        <p className="text-[10px] mt-1">İlanlar güncellendiğinde burası dolacaktır.</p>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                <button onClick={fetchActions} className="text-xs text-gray-500 font-bold hover:text-indigo-600 transition flex items-center gap-1 mx-auto">
                    <RefreshCw size={12} /> Listeyi Güncelle
                </button>
            </div>
        </div>
    );
};

export default DailySalesActionsWidget;
