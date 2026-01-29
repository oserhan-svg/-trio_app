import React, { useState, useEffect } from 'react';
import { Ghost, Zap, MessageCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const LeadRevivalWidget = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const res = await api.get('/leads/revival-opportunities');
            setOpportunities(res.data);
        } catch (error) {
            console.error('Failed to fetch revival opportunities:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendWhastapp = (phone, msg) => {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Uyuyan fırsatlar uyandırılıyor...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Ghost size={20} className="text-blue-300" />
                    Uyuyan Fırsatlar (Lead Revival)
                </h3>
                <span className="bg-blue-500 text-[10px] font-black px-2 py-1 rounded-full">
                    {opportunities.length} POTANSİYEL
                </span>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                {opportunities.length > 0 ? (
                    opportunities.map((opt, idx) => (
                        <div key={idx} className="p-4 hover:bg-gray-50 transition">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-sm font-black text-gray-800">{opt.clientName}</div>
                                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Clock size={10} /> Son Etkileşim: {new Date(opt.lastInteraction).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                                    %{opt.matchScore} Uyum
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                                <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Eşleşen Yeni İlan</div>
                                <div className="text-xs font-bold text-gray-700">{opt.propertyTitle}</div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3 italic text-xs text-gray-600">
                                "{opt.revivalHook}"
                            </div>

                            <button
                                onClick={() => sendWhastapp(opt.clientPhone, opt.revivalHook)}
                                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition"
                            >
                                <MessageCircle size={14} />
                                WhatsApp ile Canlandır
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="p-10 text-center text-gray-400">
                        <Zap size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Şu an canlandırılabilecek "soğuk" lead bulunamadı.</p>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                <button onClick={fetchOpportunities} className="text-xs text-blue-600 font-bold flex items-center gap-1 mx-auto hover:underline">
                    <RefreshCw size={12} /> Listeyi Yenile
                </button>
            </div>
        </div>
    );
};

export default Lead RevivalWidget;
