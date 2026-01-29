import React, { useState, useEffect } from 'react';
import { Share2, Instagram, Facebook, MessageCircle, Zap, Image as ImageIcon, Download, Copy, Check } from 'lucide-react';
import api from '../../services/api';

const MediaDistributionWidget = ({ propertyId }) => {
    const [socialContent, setSocialContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateContent = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/media/social-teaser/${propertyId}`);
            setSocialContent(res.data);
        } catch (error) {
            console.error('Failed to generate social content:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!socialContent) return;
        navigator.clipboard.writeText(socialContent.caption);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Share2 size={18} />
                    Medya & Sosyal Dağıtım Merkezi
                </h3>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-blue-400 transition group">
                        <ImageIcon size={24} className="text-slate-400 group-hover:text-blue-500 mb-2" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Görsel Optimizasyon</span>
                        <span className="text-[8px] text-slate-400">WebP + Watermark</span>
                    </button>
                    <button
                        onClick={generateContent}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-pink-400 transition group"
                    >
                        <Zap size={24} className={`${loading ? 'animate-pulse text-amber-500' : 'text-slate-400 group-hover:text-pink-500'} mb-2`} />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">AI Social Caption</span>
                        <span className="text-[8px] text-slate-400">Tek Tıkla Hazırla</span>
                    </button>
                </div>

                {socialContent && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                        <div className="bg-slate-900 rounded-xl p-4 relative group">
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                            >
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2 tracking-widest">Instagram / Facebook Caption</div>
                            <div className="text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto pr-8 scrollbar-thin scrollbar-thumb-white/10">
                                {socialContent.caption}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <SocialButton icon={<Instagram size={14} />} label="Instagram" color="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" />
                            <SocialButton icon={<Facebook size={14} />} label="Facebook" color="bg-blue-600" />
                            <SocialButton icon={<MessageCircle size={14} />} label="WhatsApp" color="bg-emerald-500" />
                        </div>

                        <div className="text-center">
                            <div className="text-[9px] text-gray-400 font-bold uppercase mb-2">ÖNERİLEN PAYLAŞIM SAATİ</div>
                            <div className="inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black border border-amber-100 italic">
                                🕒 {socialContent.suggestedBestTime}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 text-[9px] text-gray-400 text-center">
                    * Görseller otomatik olarak WebP formatına dönüştürülür ve Trio watermark eklenir.
                </div>
            </div>
        </div>
    );
};

const SocialButton = ({ icon, label, color }) => (
    <button className={`flex-1 ${color} text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-lg opacity-90 hover:opacity-100 transition`}>
        {icon} {label}
    </button>
);

export default MediaDistributionWidget;
