import React, { useState, useEffect } from 'react';
import { Share2, Eye, Phone, MessageCircle, Printer, Bookmark, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const ConsultantPropertyPresentation = ({ propertyId }) => {
    const [property, setProperty] = useState(null);
    const [engagement, setEngagement] = useState(null);
    const [presentationMode, setPresentationMode] = useState('standard'); // 'standard' or 'fullscreen'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPropertyData();
    }, [propertyId]);

    const loadPropertyData = async () => {
        try {
            const propRes = await api.get(`/properties/${propertyId}`);
            setProperty(propRes.data);

            // Track view engagement
            await api.post(`/properties/${propertyId}/track-engagement`, {
                engagementType: 'view'
            });

            // Load engagement stats
            const engagementRes = await api.get(`/properties/${propertyId}/engagement-stats`);
            setEngagement(engagementRes.data);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const trackAction = async (actionType) => {
        try {
            await api.post(`/properties/${propertyId}/track-engagement`, {
                engagementType: actionType
            });
            loadPropertyData(); // Refresh stats
        } catch (error) {
            console.error('Track error:', error);
        }
    };

    const shareViaWhatsApp = () => {
        const text = encodeURIComponent(
            `🏡 *${property.title}*\n\n` +
            `💰 Fiyat: ${property.price.toLocaleString('tr-TR')} ₺\n` +
            `📍 ${property.district} / ${property.neighborhood}\n` +
            `📐 ${property.size_m2} m² | ${property.rooms}\n\n` +
            `🔗 Detaylar: ${window.location.origin}/property/${propertyId}`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
        trackAction('whatsapp_share');
    };

    const handlePrint = () => {
        window.print();
        trackAction('print');
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;
    if (!property) return <div className="p-8">İlan bulunamadı</div>;

    return (
        <div className={`${presentationMode === 'fullscreen' ? 'fixed inset-0 z-50 bg-white overflow-auto' : ''}`}>
            {/* Action Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sticky top-0 z-10 shadow-lg print:hidden">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-lg">Danışman Sunum Modu</h2>
                        {engagement && (
                            <div className="flex items-center gap-3 text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                <span className="flex items-center gap-1">
                                    <Eye size={14} /> {engagement.views || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Share2 size={14} /> {engagement.shares || 0}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={shareViaWhatsApp}
                            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
                        >
                            <MessageCircle size={18} /> WhatsApp ile Paylaş
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
                        >
                            <Printer size={18} /> Yazdır
                        </button>
                        <button
                            onClick={() => setPresentationMode(presentationMode === 'fullscreen' ? 'standard' : 'fullscreen')}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold transition"
                        >
                            {presentationMode === 'fullscreen' ? '⬇️ Küçült' : '⬆️ Tam Ekran'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative h-96 bg-black">
                {property.images && property.images[0] && (
                    <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-contain"
                    />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-4xl font-black mb-2">{property.title}</h1>
                        <div className="flex items-center gap-4 text-lg">
                            <span className="flex items-center gap-2">
                                📍 {property.district} / {property.neighborhood}
                            </span>
                            <span>•</span>
                            <span className="text-3xl font-black text-yellow-400">
                                {property.price.toLocaleString('tr-TR')} ₺
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Features Grid */}
            <div className="max-w-7xl mx-auto px-8 -mt-12 mb-8 relative z-10">
                <div className="grid grid-cols-4 gap-4">
                    <FeatureCard icon="🏠" label="Oda Sayısı" value={property.rooms || 'Bilinmiyor'} />
                    <FeatureCard icon="📐" label="Metrekare" value={property.size_m2 ? `${property.size_m2} m²` : '-'} />
                    <FeatureCard icon="🏗️" label="Bina Yaşı" value={property.building_age || 'Bilinmiyor'} />
                    <FeatureCard icon="🔥" label="Isınma" value={property.heating_type || 'Bilinmiyor'} />
                </div>
            </div>

            {/* Description */}
            <div className="max-w-7xl mx-auto px-8 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">İlan Açıklaması</h2>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                        {property.description || 'Açıklama henüz mevcut değil.'}
                    </div>
                </div>
            </div>

            {/* Image Gallery */}
            {property.images && property.images.length > 1 && (
                <div className="max-w-7xl mx-auto px-8 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Fotoğraf Galerisi</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {property.images.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Property ${idx + 1}`}
                                    className="w-full h-64 object-cover rounded-lg shadow"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Contact CTA */}
            <div className="max-w-7xl mx-auto px-8 mb-8 print:hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-xl p-8 text-white text-center">
                    <h2 className="text-3xl font-black mb-4">İlgilendiniz mi?</h2>
                    <p className="mb-6 text-lg">Danışmanınızla iletişime geçin veya doğrudan WhatsApp üzerinden mesaj gönderin.</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => trackAction('save')}
                            className="bg-white text-emerald-600 font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition flex items-center gap-2"
                        >
                            <Bookmark size={20} /> Favorilere Ekle
                        </button>
                        <button
                            onClick={shareViaWhatsApp}
                            className="bg-white/20 text-white font-bold px-8 py-3 rounded-full backdrop-blur-sm hover:bg-white/30 transition flex items-center gap-2"
                        >
                            <MessageCircle size={20} /> WhatsApp ile Paylaş
                        </button>
                    </div>
                </div>
            </div>

            {/* Trio Branding (Print) */}
            <div className="hidden print:block max-w-7xl mx-auto px-8 mt-8 pt-8 border-t">
                <div className="text-center text-gray-600">
                    <p className="font-bold text-lg">Trio Emlak</p>
                    <p className="text-sm">Ayvalık | Cunda</p>
                    <p className="text-xs mt-2">Bu sunum {new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, label, value }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="text-4xl mb-2">{icon}</div>
        <div className="text-sm text-gray-500 font-medium">{label}</div>
        <div className="text-xl font-black text-gray-800 mt-1">{value}</div>
    </div>
);

export default ConsultantPropertyPresentation;
