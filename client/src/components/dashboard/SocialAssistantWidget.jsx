import React, { useState } from 'react';
import { Copy, Instagram, Camera, Wand2 } from 'lucide-react';
import api from '../../services/api';

const SocialAssistantWidget = ({ property }) => {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState(property.listing?.marketing_content || null);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            // Assuming this endpoint is exposed or will be
            const res = await api.post(`/properties/${property.id}/generate-marketing`);
            setContent(res.data);
        } catch (error) {
            alert('İçerik oluşturulamadı.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Kopyalandı!');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Wand2 size={20} />
                    Sosyal Medya Asistanı
                </h3>
                {!content && (
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-white/20 hover:bg-white/30 text-xs font-bold px-3 py-1.5 rounded-full transition backdrop-blur-sm"
                    >
                        {loading ? 'Yazılıyor...' : 'Otomatik Oluştur'}
                    </button>
                )}
            </div>

            {content ? (
                <div className="p-0">
                    {/* Tabs or Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        {/* Instagram Post */}
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                    <Instagram size={14} /> Gönderi Açıklaması
                                </span>
                                <button onClick={() => copyToClipboard(content.instagram)} aria-label="Instagram açıklamasını kopyala" className="text-gray-400 hover:text-blue-600">
                                    <Copy size={16} />
                                </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap font-medium leading-relaxed border border-gray-100 max-h-[300px] overflow-y-auto">
                                {content.instagram}
                            </div>
                        </div>

                        {/* Story Script */}
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                    <Camera size={14} /> Hikaye Senaryosu
                                </span>
                                <button onClick={() => copyToClipboard(content.story)} aria-label="Hikaye senaryosunu kopyala" className="text-gray-400 hover:text-blue-600">
                                    <Copy size={16} />
                                </button>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap border border-orange-100 font-mono leading-relaxed max-h-[300px] overflow-y-auto">
                                {content.story}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                        <button onClick={handleGenerate} className="text-xs text-gray-500 hover:text-purple-600 underline">
                            Beğenmedin mi? Yeniden Yaz
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-10 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                        <Instagram size={32} className="text-gray-300" />
                    </div>
                    <p className="text-sm">Henüz bu ilan için içerik oluşturulmadı.</p>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 transition"
                    >
                        {loading ? 'AI Çalışıyor...' : 'İçerik Oluştur'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SocialAssistantWidget;
