import React, { useState, useRef } from 'react';
import { Instagram, Type, Image as ImageIcon, Download, Copy, Share2, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Button from '../ui/Button';

const MarketingCenter = ({ onBack }) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('story'); // 'story' | 'caption'
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [generatedCaption, setGeneratedCaption] = useState('');
    const [loadingCaption, setLoadingCaption] = useState(false);

    // Story Editor State
    const storyRef = useRef(null);
    const [storyConfig, setStoryConfig] = useState({
        template: 'modern', // modern, minimal, bold
        badgeText: 'FIRSAT',
        showPrice: true,
        showLocation: true,
        accentColor: '#ec4899' // Pink-y for Insta
    });

    const categories = [
        { id: 'story', label: 'Story Oluşturucu', icon: Instagram },
        { id: 'caption', label: 'Akıllı Açıklama', icon: Type },
    ];

    const handleGenerateImage = async () => {
        if (!storyRef.current) return;
        try {
            const dataUrl = await toPng(storyRef.current, { cacheBust: true, pixelRatio: 2 });
            saveAs(dataUrl, `story-${selectedProperty?.id || 'draft'}.png`);
            addToast('Story görseli indirildi! 📸');
        } catch (err) {
            console.error(err);
            addToast('Görsel oluşturulamadı.', 'error');
        }
    };

    const handleGenerateCaption = async () => {
        if (!selectedProperty) return addToast('Lütfen önce bir ilan seçin.', 'warning');
        setLoadingCaption(true);
        try {
            const res = await api.post('/ai/generate-caption', {
                propertyId: selectedProperty.id,
                platform: 'instagram'
            });
            setGeneratedCaption(res.data.caption);
            addToast('Caption oluşturuldu! ✨');
        } catch (err) {
            addToast('Caption hatası: ' + err.message, 'error');
        } finally {
            setLoadingCaption(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-2">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                    <Share2 className="text-pink-600" /> Pazarlama
                </h3>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === cat.id
                                ? 'bg-white shadow-sm text-gray-900 font-bold ring-1 ring-gray-200'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <cat.icon size={20} className={activeTab === cat.id ? 'text-pink-500' : ''} />
                        {cat.label}
                    </button>
                ))}

                <div className="mt-auto p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 leading-relaxed">
                        <strong>İpucu:</strong> Buradan oluşturduğunuz görseller Instagram boyutlarına (9:16) tam uyumludur.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'story' && (
                    <div className="flex gap-8 h-full">
                        {/* Preview Area */}
                        <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-2xl p-4 border border-gray-200 relative">
                            {/* The Story Canvas (9:16 Aspect Ratio) */}
                            <div
                                ref={storyRef}
                                className="w-[360px] h-[640px] bg-white relative shadow-2xl overflow-hidden flex flex-col"
                            >
                                {/* Background Image */}
                                {selectedProperty?.images?.[0] ? (
                                    <img
                                        src={selectedProperty.images[0]}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        alt="Property"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                                        <ImageIcon size={48} />
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

                                {/* Content Overlays */}
                                <div className="relative z-10 flex flex-col h-full p-6 text-white justify-between">
                                    <div className="flex justify-between items-start">
                                        {/* Badge */}
                                        <div
                                            className="px-4 py-1.5 rounded-full font-black tracking-widest text-sm shadow-lg transform -rotate-2"
                                            style={{ backgroundColor: storyConfig.accentColor }}
                                        >
                                            {storyConfig.badgeText}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-8">
                                        {storyConfig.showLocation && (
                                            <div className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium border border-white/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                {selectedProperty?.district || 'Ayvalık'}, {selectedProperty?.neighborhood || 'Merkez'}
                                            </div>
                                        )}

                                        <h1 className="text-3xl font-black leading-tight drop-shadow-lg">
                                            {selectedProperty?.title || 'Fırsat Daire'}
                                        </h1>

                                        {storyConfig.showPrice && (
                                            <div className="inline-block px-4 py-2 bg-white text-gray-900 font-black text-xl rounded-lg shadow-xl transform rotate-1">
                                                {selectedProperty?.price ? parseFloat(selectedProperty.price).toLocaleString() : '0'} ₺
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="w-80 space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-800">Ayarlar</h4>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">Badge Metni</label>
                                    <input
                                        type="text"
                                        value={storyConfig.badgeText}
                                        onChange={e => setStoryConfig({ ...storyConfig, badgeText: e.target.value })}
                                        className="w-full text-sm border rounded p-2"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">Vurgu Rengi</label>
                                    <div className="flex gap-2">
                                        {['#ec4899', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'].map(color => (
                                            <button
                                                key={color}
                                                className={`w-6 h-6 rounded-full border-2 ${storyConfig.accentColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setStoryConfig({ ...storyConfig, accentColor: color })}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={storyConfig.showPrice}
                                            onChange={e => setStoryConfig({ ...storyConfig, showPrice: e.target.checked })}
                                        />
                                        Fiyat Göster
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={storyConfig.showLocation}
                                            onChange={e => setStoryConfig({ ...storyConfig, showLocation: e.target.checked })}
                                        />
                                        Konum Göster
                                    </label>
                                </div>

                                <Button
                                    onClick={handleGenerateImage}
                                    className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                    <Download size={18} /> İndir
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'caption' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 text-center">
                            <Sparkles size={32} className="text-indigo-500 mx-auto mb-3" />
                            <h2 className="text-xl font-bold text-gray-900">AI Caption Generator</h2>
                            <p className="text-sm text-gray-500 mt-2">
                                Seçili ilanınız için Instagram algoritmasına uygun, emoji ve hashtag içeren etkileyici açıklamalar oluşturun.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Platform</label>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-pink-50 text-pink-700 font-bold text-sm rounded-lg border border-pink-200">Instagram</button>
                                    <button className="flex-1 py-2 bg-gray-50 text-gray-600 text-sm rounded-lg border border-gray-200 hover:bg-gray-100">LinkedIn</button>
                                    <button className="flex-1 py-2 bg-gray-50 text-gray-600 text-sm rounded-lg border border-gray-200 hover:bg-gray-100">Facebook</button>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateCaption}
                                disabled={loadingCaption || !selectedProperty}
                                className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                            >
                                {loadingCaption ? <RefreshCw className="animate-spin" /> : <Wand2 />}
                                {loadingCaption ? 'AI Yazıyor...' : 'Sihirli Açıklama Oluştur'}
                            </Button>

                            {generatedCaption && (
                                <div className="relative group">
                                    <textarea
                                        readOnly
                                        value={generatedCaption}
                                        className="w-full h-64 p-4 text-sm border-gray-200 rounded-xl bg-gray-50 resize-none font-sans leading-relaxed"
                                    />
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(generatedCaption); addToast('Kopyalandı!'); }}
                                        className="absolute top-3 right-3 p-2 bg-white shadow-md border border-gray-200 rounded-lg text-gray-500 hover:text-indigo-600"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Property Selector Modal (Simplified for Demo) */}
            {!selectedProperty && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg">
                        <h3 className="text-lg font-bold mb-4">İlan Seçimi</h3>
                        <p className="text-gray-500 text-sm mb-4">Lütfen işlem yapmak istediğiniz ilanı seçin.</p>
                        {/* Ideally this would be a searchable dropdown. For now, we'll assume the parent passes it or we fetch recently viewed. 
                            If this is a standalone app, we need a picker. 
                            Let's add a placeholder picker. 
                        */}
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {/* This would be populated dynamically. */}
                            <button
                                onClick={() => setSelectedProperty({
                                    id: 1,
                                    title: 'Deniz Manzaralı Lüks Villa',
                                    price: 12500000,
                                    district: 'Ayvalık',
                                    neighborhood: 'Cunda',
                                    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop']
                                })}
                                className="w-full p-3 text-left border rounded hover:bg-gray-50 flex gap-3"
                            >
                                <div className="w-12 h-12 bg-gray-200 rounded object-cover overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Deniz Manzaralı Lüks Villa</div>
                                    <div className="text-xs text-gray-500">12.5M TL • Cunda</div>
                                </div>
                            </button>
                        </div>
                        <div className="mt-4 text-xs text-gray-400 text-center">
                            * Demo modunda örnek ilan gösteriliyor.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingCenter;
