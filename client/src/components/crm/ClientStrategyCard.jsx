import React, { useState, useEffect } from 'react';
import { X, Brain, Zap, Copy, MessageCircle, Loader2, Sparkles, TrendingUp, Target } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

const ClientStrategyCard = ({ isOpen, onClose, client }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState(null);

    useEffect(() => {
        if (isOpen && client) {
            fetchStrategy();
        } else {
            setStrategy(null);
        }
    }, [isOpen, client]);

    const fetchStrategy = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/clients/${client.id}/strategy`);
            setStrategy(response.data);
        } catch (error) {
            console.error('Strategy Fetch Error:', error);
            addToast('Strateji oluşturulamadı.', 'error');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!strategy?.suggested_draft) return;
        navigator.clipboard.writeText(strategy.suggested_draft);
        addToast('Taslak kopyalandı');
    };

    const handleWhatsApp = () => {
        if (!strategy?.suggested_draft) return;
        const text = encodeURIComponent(strategy.suggested_draft);
        window.open(`https://wa.me/${client.phone?.replace(/[^\d]/g, '')}?text=${text}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 ring-1 ring-slate-900/5">

                {/* Header - Premium Gradient */}
                <div className="p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                            <Brain size={24} className="animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">AI Takip Stratejisi</h3>
                    </div>
                    <p className="text-violet-100 text-sm font-medium">
                        {client?.name} için kişiselleştirilmiş satış rotası
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <Loader2 size={40} className="animate-spin text-violet-600" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-600">Veriler Analiz Ediliyor...</p>
                                <p className="text-xs">Müşteri geçmişi ve portföy uyumu kontrol ediliyor.</p>
                            </div>
                        </div>
                    ) : strategy ? (
                        <>
                            {/* Analysis Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                                    <TrendingUp size={14} /> Durum Analizi
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 leading-relaxed font-medium">
                                    "{strategy.analysis}"
                                </div>
                            </div>

                            {/* Next Step Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-violet-500">
                                    <Target size={14} /> Sıradaki En İyi Adım (Next Best Action)
                                </div>
                                <div className="p-4 bg-violet-50 border-2 border-violet-100 rounded-2xl text-sm font-black text-violet-700 shadow-sm flex items-start gap-3">
                                    <Zap size={18} className="shrink-0 mt-0.5" />
                                    {strategy.next_step}
                                </div>
                            </div>

                            {/* Suggested Draft */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                                        <Copy size={14} /> Önerilen Mesaj Taslağı
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="text-[10px] font-black text-violet-600 hover:text-violet-700 uppercase"
                                    >
                                        Kopyala
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="w-full min-h-[120px] p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm text-slate-800 italic leading-relaxed shadow-inner">
                                        {strategy.suggested_draft}
                                    </div>
                                    <div className="absolute inset-0 bg-violet-600/5 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        disabled={loading || !strategy}
                        className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <MessageCircle size={18} />
                        WhatsApp ile Başlat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientStrategyCard;
