import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Home, Ruler, ExternalLink, ArrowLeft, RefreshCw, Image as ImageIcon, MessageCircle } from 'lucide-react';
import api from '../services/api';

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scraping, setScraping] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await api.get(`/properties/${id}`);
                setProperty(res.data);
                if (res.data.images && res.data.images.length > 0) {
                    setSelectedImage(res.data.images[0]);
                }
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProperty();
    }, [id]);

    const handleScrapeDetails = async () => {
        if (!confirm('Bu ilanın detaylarını (fotoğraflar, açıklama) çekmek istiyor musunuz?')) return;
        setScraping(true);
        try {
            await api.post(`/properties/${id}/scrape-details`);
            alert('Detaylar güncellendi! Sayfa yenileniyor...');
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Detay çekme işlemi başarısız oldu: ' + (err.response?.data?.error || err.message));
        } finally {
            setScraping(false);
        }
    };

    const getWhatsAppLink = (phone, title) => {
        if (!phone) return null;
        // Basic cleanup: remove spaces, parens, dashes, generic text
        let p = phone.replace(/\D/g, '');

        // Ensure TR country code if missing
        if (p.length === 10 && p.startsWith('5')) p = '90' + p;
        else if (p.length === 11 && p.startsWith('0')) p = '9' + p;

        // If still not valid (e.g. empty or landline without code), return null
        if (p.length < 10) return null;

        const text = encodeURIComponent(`Merhaba, "${title}" başlıklı ilanınız için yazıyorum. Detaylı bilgi alabilir miyim?`);
        return `https://wa.me/${p}?text=${text}`;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">Hata: {error}</div>;
    if (!property) return <div className="min-h-screen flex items-center justify-center">İlan bulunamadı.</div>;

    const images = property.images || [];
    const features = property.features || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Navbar / Header */}
            <div className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-600 hover:text-gray-900"
                        title="Dashboard'a Dön"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 truncate flex-1">{property.title}</h1>
                    <span className="text-2xl font-bold text-blue-600 whitespace-nowrap">
                        {parseFloat(property.price).toLocaleString('tr-TR')} TL
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Gallery & Description */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Gallery Section */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-1">
                        {images.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {/* Main Large Image */}
                                <div className="relative w-full h-[400px] md:h-[500px] bg-gray-100 rounded-lg overflow-hidden group">
                                    <img
                                        src={selectedImage || images[0]}
                                        alt="Main Property"
                                        fetchPriority="high"
                                        className="w-full h-full object-contain bg-black"
                                    />
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                        <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                            {images.indexOf(selectedImage || images[0]) + 1} / {images.length}
                                        </div>
                                        <button
                                            onClick={handleScrapeDetails}
                                            disabled={scraping}
                                            className="bg-blue-600/90 text-white p-1.5 rounded-full hover:bg-blue-600 transition backdrop-blur-sm"
                                            title="Fotoğrafları ve Detayları Güncelle"
                                        >
                                            <RefreshCw size={16} className={scraping ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const currIdx = images.indexOf(selectedImage || images[0]);
                                            const nextIdx = (currIdx + 1) % images.length;
                                            setSelectedImage(images[nextIdx]);
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
                                    >
                                        👉
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currIdx = images.indexOf(selectedImage || images[0]);
                                            const prevIdx = (currIdx - 1 + images.length) % images.length;
                                            setSelectedImage(images[prevIdx]);
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
                                    >
                                        👈
                                    </button>
                                </div>

                                {/* Thumbnail Strip */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(img)}
                                            className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition ${selectedImage === img ? 'border-blue-600 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt={`Thumb ${idx}`} loading="lazy" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <ImageIcon size={48} className="mb-2 opacity-50" />
                                <span className="text-sm">Görsel Yok</span>
                                {property.url && (
                                    <button
                                        onClick={handleScrapeDetails}
                                        disabled={scraping}
                                        className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
                                    >
                                        <RefreshCw size={16} className={scraping ? 'animate-spin' : ''} />
                                        {scraping ? 'Fotoğrafları Çekiliyor...' : 'Fotoğrafları ve Detayları Getir'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">İlan Açıklaması</h2>
                        <div className="prose max-w-none text-gray-600 whitespace-pre-line">
                            {property.description || 'Açıklama henüz çekilmedi.'}
                        </div>
                        {!property.description && (
                            <button
                                onClick={handleScrapeDetails}
                                disabled={scraping}
                                className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                            >
                                <RefreshCw size={14} className={scraping ? 'animate-spin' : ''} />
                                Açıklamayı Getir
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Column: Key Details & History */}
                <div className="space-y-6">

                    {/* Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <a
                            href={property.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition mb-3"
                        >
                            <ExternalLink size={20} /> Orjinal İlana Git
                        </a>
                        <div className="text-xs text-gray-500 text-center mb-3">
                            İlan No: {property.external_id} <br />
                            Son Güncelleme: {new Date(property.last_scraped).toLocaleString('tr-TR')}
                        </div>

                        {/* Owner Info Mockup */}
                        <div className="border-t border-gray-100 pt-3">
                            <h4 className="text-sm font-bold text-gray-800 mb-2">İlan Sahibi</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                    {(property.seller_name || property.seller_type || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900">
                                        {property.seller_name || (property.seller_type === 'owner' ? 'Sahibinden' : 'Emlak Ofisi')}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {property.seller_phone || 'Telefon Gizli'}
                                    </div>
                                </div>
                                {property.seller_phone && getWhatsAppLink(property.seller_phone, property.title) && (
                                    <a
                                        href={getWhatsAppLink(property.seller_phone, property.title)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors shadow-sm"
                                        title="WhatsApp ile Mesaj Gönder"
                                    >
                                        <MessageCircle size={20} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Özellikler</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Home size={18} /> Oda Sayısı
                                </div>
                                <span className="font-semibold">{property.rooms || 'Bilinmiyor'}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Ruler size={18} /> Metrekare
                                </div>
                                <span className="font-semibold">{property.size_m2 ? `${property.size_m2} m²` : 'Bilinmiyor'}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={18} /> Konum
                                </div>
                                <span className="font-semibold text-right text-sm">{property.neighborhood}, {property.district}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar size={18} /> İlan Tarihi
                                </div>
                                <span className="font-semibold text-sm">
                                    {property.listing_date ? new Date(property.listing_date).toLocaleDateString('tr-TR') : '-'}
                                </span>
                            </div>
                            {property.building_age && (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border-l-4 border-blue-400">
                                    <div className="flex items-center gap-2 text-gray-600 font-medium">Bina Yaşı</div>
                                    <span className="font-semibold">{property.building_age}</span>
                                </div>
                            )}
                            {property.heating_type && (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border-l-4 border-orange-400">
                                    <div className="flex items-center gap-2 text-gray-600 font-medium">Isınma</div>
                                    <span className="font-semibold">{property.heating_type}</span>
                                </div>
                            )}
                            {property.floor_location && (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border-l-4 border-green-400">
                                    <div className="flex items-center gap-2 text-gray-600 font-medium">Kat</div>
                                    <span className="font-semibold">{property.floor_location}</span>
                                </div>
                            )}
                        </div>

                        {features.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">Ekstra Özellikler</h4>
                                <div className="flex flex-wrap gap-2">
                                    {features.map((f, i) => (
                                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price History (Basic List for now, Chart is on Dashboard) */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Fiyat Geçmişi</h3>
                        <div className="space-y-4 relative border-l-2 border-gray-200 ml-2 pl-4">
                            {property.history && property.history.map((h) => (
                                <div key={h.id} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                                    <div className="text-sm font-bold text-gray-800">
                                        {parseFloat(h.price).toLocaleString('tr-TR')} TL
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(h.changed_at).toLocaleDateString('tr-TR')} - {h.change_type === 'initial' ? 'İlk Fiyat' : (h.change_type === 'price_increase' ? 'Artış ↗' : 'Düşüş ↘')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;
