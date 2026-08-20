import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Home, Ruler, ExternalLink, ArrowLeft, RefreshCw, Image as ImageIcon, MessageCircle, FileText } from 'lucide-react';
import api from '../services/api';
import MarketingCenter from '../components/marketing/MarketingCenter';
import PropertyBenchmarkCard from '../components/apps/PropertyBenchmarkCard';

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scraping, setScraping] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [socialContent, setSocialContent] = useState('');
    const [generatingSocial, setGeneratingSocial] = useState(false);

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

    const handleGenerateSocialMedia = async () => {
        setGeneratingSocial(true);
        try {
            const res = await api.get(`/properties/${id}/social-media`);
            setSocialContent(res.data.content);
        } catch (err) {
            console.error(err);
            alert('İçerik oluşturulamadı.');
        } finally {
            setGeneratingSocial(false);
        }
    };

    const getWhatsAppLink = (phone, title) => {
        if (!phone) return null;
        let p = phone.replace(/\D/g, '');
        if (p.length === 10 && p.startsWith('5')) p = '90' + p;
        else if (p.length === 11 && p.startsWith('0')) p = '9' + p;
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-widest hover:text-blue-700 transition-colors w-fit mb-1"
                    >
                        <ArrowLeft size={14} /> Geri Dön
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        {(property.title || 'Başlıksız İlan').split('#')[0].trim()}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> {property.district} / {property.neighborhood}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-700">{property.external_id?.split('block')[0]}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-blue-600 tracking-tighter">
                        {parseFloat(property.price || 0).toLocaleString('tr-TR')} <span className="text-lg font-bold">₺</span>
                    </div>
                    {property.status === 'removed' && (
                        <div className="mt-2 bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider inline-block">
                            🔴 Yayından Kaldırıldı
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-1">
                        {images.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <div className="relative w-full h-[400px] md:h-[500px] bg-gray-100 rounded-lg overflow-hidden group">
                                    <img
                                        src={selectedImage || images[0]}
                                        alt="Main Property"
                                        fetchPriority="high"
                                        className="w-full h-full object-contain bg-black"
                                        onError={(e) => { e.target.style.display = 'none'; }}
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
                                        aria-label={"Sonraki g\u00f6rsel"}
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
                                        aria-label={"\u00d6nceki g\u00f6rsel"}
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

                    {/* Marketing Center Integration */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <MarketingCenter propertyId={property.id} />
                    </div>

                    {/* CMA Benchmark Integration */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
                            Karşılaştırmalı Pazar Analizi (CMA)
                        </h3>
                        <PropertyBenchmarkCard propertyId={property.id} />
                    </div>
                </div>

                <div className="space-y-6">
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
                            İlan No: {(property.external_id || '').split('block')[0]} <br />
                            Son Güncelleme: {property.last_scraped ? new Date(property.last_scraped).toLocaleString('tr-TR') : '-'}
                        </div>
                        <button
                            onClick={() => window.open(`/property-listing/${property.id}`, '_blank')}
                            className="w-full bg-blue-50 text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 mb-3"
                        >
                            <FileText size={18} /> İlan Sunum Sayfası Oluştur
                        </button>

                        <button
                            onClick={handleGenerateSocialMedia}
                            disabled={generatingSocial}
                            className="w-full bg-emerald-50 text-emerald-600 font-bold py-2 rounded-lg hover:bg-emerald-100 transition flex items-center justify-center gap-2 mb-3 border border-emerald-100"
                        >
                            {generatingSocial ? <RefreshCw size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                            Sosyal Medya İçeriği Oluştur
                        </button>

                        {socialContent && (
                            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in duration-500">
                                <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed mb-3 italic">
                                    {socialContent}
                                </p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(socialContent);
                                        alert('İçerik kopyalandı!');
                                    }}
                                    className="w-full bg-white text-slate-500 text-[10px] font-black uppercase py-1.5 rounded border border-slate-200 hover:bg-slate-100 transition"
                                >
                                    Metni Kopyala
                                </button>
                            </div>
                        )}
                        <div className="border-t border-gray-100 pt-3">
                            <h4 className="text-sm font-bold text-gray-800 mb-2">İlan Sahibi</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                    {(property.seller_name || property.seller_type || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div
                                        className="font-semibold text-sm"
                                        style={property.url?.includes('sahibinden') ? { backgroundColor: '#ffdb15', color: '#000', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' } : {}}
                                    >
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

                    {property.other_listings && property.other_listings.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 mt-4 border border-blue-100">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ExternalLink size={12} className="text-blue-500" />
                                Diğer Portallardaki İlanlar
                            </h4>
                            <div className="space-y-2">
                                {property.other_listings.map((other) => {
                                    const portal = other.url.includes('sahibinden.com') ? 'Sahibinden' :
                                        (other.url.includes('hepsiemlak.com') || other.url.includes('hemlak.com')) ? 'Hepsiemlak' :
                                            other.url.includes('emlakjet.com') ? 'Emlakjet' : 'Diğer Portal';
                                    const portalColor = portal === 'Sahibinden' ? 'bg-yellow-400 text-black shadow-sm' :
                                        portal === 'Hepsiemlak' ? 'bg-rose-50 text-rose-700' :
                                            'bg-blue-50 text-blue-700';

                                    return (
                                        <a
                                            key={other.id}
                                            href={other.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 hover:shadow-sm transition-all group"
                                        >
                                            <div className="flex flex-col">
                                                <span
                                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-fit mb-0.5 ${portal === 'Sahibinden' ? '' : portalColor}`}
                                                    style={portal === 'Sahibinden' ? { backgroundColor: '#ffdb15', color: '#000' } : {}}
                                                >
                                                    {portal}
                                                </span>
                                                <span className="text-xs font-bold text-gray-900">{parseFloat(other.price).toLocaleString('tr-TR')} TL</span>
                                            </div>
                                            <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

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
                                < Ruler size={18} /> Metrekare
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

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Birleşik Fiyat Geçmişi</h3>
                    <div className="space-y-4 relative border-l-2 border-gray-200 ml-2 pl-4">
                        {(property.merged_history || property.history || []).map((h) => (
                            <div key={h.id} className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                                <div className="text-sm font-bold text-gray-800">
                                    {parseFloat(h.price).toLocaleString('tr-TR')} TL
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(h.changed_at).toLocaleDateString('tr-TR')} - {h.change_type === 'initial' ? 'İlk İlan' : (h.change_type === 'price_decrease' ? 'Düşüş ↘' : 'Artış ↗')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;
