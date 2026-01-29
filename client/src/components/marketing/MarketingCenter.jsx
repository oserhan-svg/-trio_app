import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Instagram,
    MessageCircle,
    Copy,
    Share2,
    Check,
    Loader2,
    Zap,
    Layout,
    ArrowRight,
    Eye
} from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

const MarketingCenter = ({ propertyId, onUpdate }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [marketingPackage, setMarketingPackage] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

    useEffect(() => {
        if (propertyId) {
            fetchMarketingPackage();
        }
    }, [propertyId]);

    const fetchMarketingPackage = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/listings/${propertyId}/marketing-package`);
            setMarketingPackage(response.data.data);
        } catch (error) {
            console.error('Fetch Marketing Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await api.get(`/listings/${propertyId}/marketing-package`);
            setMarketingPackage(response.data.data);
            addToast('Pazarlama paketi başarıyla güncellendi', 'success');
        } catch (error) {
            addToast('İçerik üretilemedi', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        addToast('Kopyalandı');
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-medium">Pazarlama verileri yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-amber-500" size={24} />
                        AI Pazarlama Merkezi
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Mülkünüz için LLM tarafından üretilmiş çok kanallı içerikler.
                    </p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-2.5 rounded-2xl font-black text-sm shadow-sm hover:shadow-md transition-all border border-indigo-100 disabled:opacity-50"
                >
                    {generating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="fill-current" />}
                    Yeniden Üret (LLM)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Instagram Package */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                                <Instagram size={20} />
                            </div>
                            <h4 className="font-black text-slate-800">Instagram Paketi</h4>
                        </div>
                        <button
                            onClick={() => copyToClipboard(marketingPackage?.instagram?.caption + '\n\n' + marketingPackage?.instagram?.hashtags, 'ig')}
                            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        >
                            {copiedField === 'ig' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-700 italic leading-relaxed">
                            {marketingPackage?.instagram?.caption || 'İçerik hazırlanıyor...'}
                        </div>
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] font-bold text-blue-600 tracking-wide">
                            {marketingPackage?.instagram?.hashtags}
                        </div>
                    </div>
                </div>

                {/* WhatsApp Pitch */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <MessageCircle size={20} />
                            </div>
                            <h4 className="font-black text-slate-800">WhatsApp Paylaşımı</h4>
                        </div>
                        <button
                            onClick={() => copyToClipboard(marketingPackage?.whatsapp_pitch, 'wa')}
                            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        >
                            {copiedField === 'wa' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                    </div>
                    <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {marketingPackage?.whatsapp_pitch || 'İçerik hazırlanıyor...'}
                    </div>
                </div>
            </div>

            {/* Premium Web Description */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Layout size={20} />
                        </div>
                        <h4 className="font-black text-slate-800">Premium İlan Açıklaması (Public)</h4>
                    </div>
                    <button
                        onClick={() => copyToClipboard(marketingPackage?.premium_description, 'web')}
                        className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                    >
                        {copiedField === 'web' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                    {marketingPackage?.premium_description || 'İçerik hazırlanıyor...'}
                </div>
            </div>

            {/* Footer / Quick Navigation */}
            <div className="flex items-center justify-center pt-4">
                <button
                    onClick={() => window.open(`/property-listing/${propertyId}`, '_blank')}
                    className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:gap-3 transition-all"
                >
                    İlan Yönetim Sayfasına Git <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default MarketingCenter;
