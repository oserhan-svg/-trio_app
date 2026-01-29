import React, { useState } from 'react';
import { Megaphone, Facebook, Instagram, Search, Copy, Check, Zap, Rocket, Download } from 'lucide-react';
import api from '../../services/api';

const AdCampaignWidget = ({ propertyId }) => {
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateCampaign = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/marketing/ad-architect/${propertyId}`);
            setCampaign(res.data);
        } catch (error) {
            console.error('Campaign generation error:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!campaign) return;
        navigator.clipboard.writeText(campaign.assets);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-rose-600 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2 text-sm italic">
                    <Megaphone size={18} />
                    AI Ad Campaign Architect
                </h3>
                {campaign && <Rocket size={16} className="animate-bounce" />}
            </div>

            <div className="p-6">
                {!campaign ? (
                    <div className="text-center py-4">
                        <Zap size={32} className="mx-auto text-amber-400 mb-3 opacity-30" />
                        <p className="text-[10px] text-gray-500 mb-4 font-bold uppercase tracking-widest">
                            Ready to promote this property?
                        </p>
                        <button
                            onClick={generateCampaign}
                            disabled={loading}
                            className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 mx-auto"
                        >
                            {loading ? 'Analyzing Market...' : 'Generate Campaign Assets'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <PlatformBadge icon={<Facebook size={12} />} label="Facebook / IG" color="bg-blue-50 text-blue-700" />
                            <PlatformBadge icon={<Search size={12} />} label="Google Search" color="bg-red-50 text-red-700" />
                        </div>

                        {/* Ad Body */}
                        <div className="relative group">
                            <div className="bg-slate-900 text-white rounded-xl p-4 text-[11px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-mono scrollbar-thin">
                                {campaign.assets}
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition active:scale-95"
                            >
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                        </div>

                        {/* Keywords */}
                        <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Recommended Targeting</div>
                            <div className="flex flex-wrap gap-2">
                                {campaign.suggestedKeywords.map((kw, idx) => (
                                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold border border-gray-200">
                                        #{kw.replace(/\s+/g, '')}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                            <Download size={14} />
                            Marketing Assets Pack (.zip)
                        </button>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-[9px] text-gray-400 italic">
                    <Rocket size={12} />
                    "AI campaigns are optimized for CTR (Click-Through Rate) based on local data."
                </div>
            </div>
        </div>
    );
};

const PlatformBadge = ({ icon, label, color }) => (
    <div className={`${color} px-3 py-1.5 rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-tighter`}>
        {icon} {label}
    </div>
);

export default AdCampaignWidget;
