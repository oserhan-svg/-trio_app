import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, MapPin, Phone, Mail, Globe, Eye, MessageCircle, Send, User, MessageSquare, Loader2 } from 'lucide-react';
import api from '../services/api';

const PropertyListingPublic = () => {
    const { token } = useParams();
    const [property, setProperty] = useState(null);
    const [listingInfo, setListingInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const printRef = useRef();

    const companyInfo = {
        name: "Trio Emlak Gayrimenkul",
        address: "Ali Çetinkaya Mah. Abdi İpekçi Cad. No:15/A Ayvalık Balıkesir",
        phone: "0533 378 68 94",
        phone2: "0552 473 10 21",
        email: "trio.emlak.ayvalik@gmail.com",
        website: "trioemlak.com",
        consultant: {
            name: "Gayrimenkul Danışmanı",
            phone: "0533 378 68 94",
            email: "trio.emlak.ayvalik@gmail.com"
        }
    };

    const [submitting, setSubmitting] = useState(false);
    const [formSuccess, setFormSuccess] = useState(false);
    const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', notes: '' });

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await api.get(`/listings/token/${token}`);
                const data = response.data;
                setProperty(data.property);
                setListingInfo(data.listing);
                if (data.property.images && data.property.images.length > 0) {
                    setSelectedImage(data.property.images[0]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching listing:', error);
                setError(error.message || 'İlan bilgileri alınamadı');
                setLoading(false);
            }
        };

        fetchListing();
    }, [token]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/clients/public/lead', { ...leadForm, propertyId: property.id });
            setFormSuccess(true);
            setLeadForm({ name: '', phone: '', email: '', notes: '' });
        } catch (err) {
            alert('Talep iletilemedi: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">İlan Bulunamadı</h2>
                    <p className="text-gray-600">{error || 'Bu ilan mevcut değil veya kaldırılmış.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Action Bar */}
            <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center print:hidden sticky top-0 z-50">
                <div className="flex items-center gap-2 text-gray-600">
                    <Eye size={18} />
                    <span className="text-sm">{listingInfo.view_count} görüntülenme</span>
                </div>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    <Download size={18} />
                    PDF İndir
                </button>
            </div>

            {/* Printable Content */}
            <div ref={printRef} className="max-w-5xl mx-auto bg-white shadow-lg my-8 print:my-0 print:shadow-none">
                {/* Header with Company Branding */}
                <div className="bg-white border-b-4 border-red-600 p-8 print:p-6">
                    <div className="flex justify-between items-center">
                        <div className="w-64">
                            <img src="/trio-logo.png" alt={companyInfo.name} className="w-full h-auto object-contain" />
                        </div>
                        <div className="text-right text-sm text-gray-600">
                            <p className="font-semibold mb-1">{companyInfo.address}</p>
                            <p className="flex items-center justify-end gap-2"><Phone size={14} className="text-red-600" /> {companyInfo.phone}</p>
                            <p className="flex items-center justify-end gap-2"><Mail size={14} className="text-red-600" /> {companyInfo.email}</p>
                            <p className="flex items-center justify-end gap-2"><Globe size={14} className="text-red-600" /> {companyInfo.website}</p>
                        </div>
                    </div>
                </div>

                {/* Property Title */}
                <div className="p-8 print:p-6 border-b">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">{property.title?.split('#')[0].trim()}</h2>
                    <p className="text-gray-600 flex items-center gap-2">
                        <MapPin size={18} />
                        {property.neighborhood}, {property.district}
                    </p>
                </div>

                {/* Image Gallery */}
                {(!property.images || property.images.length === 0) ? (
                    <div className="p-8 print:p-6 border-b">
                        <div className="w-full h-[400px] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-lg font-medium">Görseller Hazırlanıyor</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 print:p-6 border-b">
                        {/* Interactive Gallery for Screen */}
                        <div className="print:hidden">
                            {/* Main Image */}
                            <div className="mb-4">
                                <img
                                    src={selectedImage || property.images[0]}
                                    alt={property.title}
                                    fetchPriority="high"
                                    className="w-full h-[400px] object-cover rounded-lg shadow-md cursor-pointer"
                                    onClick={() => window.open(selectedImage || property.images[0], '_blank')}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Resim+Yüklenemedi'; }}
                                />
                            </div>
                            {/* Thumbnails */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                                {property.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`Thumbnail ${idx + 1}`}
                                        loading="lazy"
                                        className={`w-24 h-24 object-cover rounded-md cursor-pointer border-2 transition-all flex-shrink-0 ${selectedImage === img ? 'border-blue-600 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        onClick={() => setSelectedImage(img)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Static Grid for Print */}
                        <div className="hidden print:grid grid-cols-3 gap-4">
                            {property.images.slice(0, 6).map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`${property.title} - Fotoğraf ${idx + 1}`}
                                    loading="lazy"
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Property Details */}
                <div className="p-8 print:p-6 border-b">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Emlak Bilgileri</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg print:p-3">
                            <p className="text-sm text-gray-600 mb-1">Fiyat</p>
                            <p className="text-2xl font-bold text-blue-600 print:text-xl">{formatPrice(property.price)}</p>
                        </div>
                        {property.size_m2 && (
                            <div className="bg-gray-50 p-4 rounded-lg print:p-3">
                                <p className="text-sm text-gray-600 mb-1">Metrekare</p>
                                <p className="text-xl font-bold text-gray-900 print:text-lg">{property.size_m2} m²</p>
                            </div>
                        )}
                        {property.rooms && (
                            <div className="bg-gray-50 p-4 rounded-lg print:p-3">
                                <p className="text-sm text-gray-600 mb-1">Oda Sayısı</p>
                                <p className="text-xl font-bold text-gray-900 print:text-lg">{property.rooms}</p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Description */}
                {property.description && (
                    <div className="p-8 print:p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Açıklama</h3>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{property.description}</p>
                    </div>
                )}

                {/* Features */}
                {property.features && property.features.length > 0 && (
                    <div className="p-8 print:p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Özellikler</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3">
                            {property.features
                                .filter(f => {
                                    const text = f.toLocaleLowerCase('tr');
                                    return !text.includes('ilan no') &&
                                        !text.includes('ilan numarası') &&
                                        !text.includes('tarih') &&
                                        !text.includes('güncelleme') &&
                                        !text.includes('son gün');
                                })
                                .map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-gray-700">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        {feature}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Consultant Info */}
                <div className="p-8 print:p-6 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Danışman Bilgileri</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-gray-900">{companyInfo.consultant.name}</p>
                            <p className="text-gray-600 flex items-center gap-2 mt-2">
                                <Phone size={16} /> {companyInfo.consultant.phone}
                            </p>
                            <p className="text-gray-600 flex items-center gap-2 mt-1">
                                <Mail size={16} /> {companyInfo.consultant.email}
                            </p>
                            <p className="text-sm text-gray-500 mt-3">
                                Detaylı bilgi ve randevu için lütfen iletişime geçiniz.
                            </p>
                        </div>
                        <div className="text-center print:block hidden">
                            <QRCodeSVG value={window.location.href} size={100} />
                            <p className="text-xs text-gray-500 mt-2">QR kodu okutarak<br />detayları görün</p>
                        </div>
                    </div>
                </div>

                {/* Lead Capture Form */}
                <div className="p-8 print:hidden bg-indigo-50/50 border-t border-indigo-100">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Detaylı Bilgi İçin Formu Doldurun</h3>
                            <p className="text-slate-500 font-medium mt-1">Danışmanımız size en kısa sürede dönüş yapacaktır.</p>
                        </div>

                        {formSuccess ? (
                            <div className="bg-emerald-100 text-emerald-700 p-6 rounded-2xl text-center font-bold animate-in zoom-in duration-300">
                                ✨ Talebiniz başarıyla alındı! Teşekkür ederiz.
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text" required placeholder="Adınız Soyadınız"
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                            value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="tel" required placeholder="Telefon Numaranız"
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                            value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3.5 top-4 text-slate-400" size={18} />
                                    <textarea
                                        placeholder="Mesajınız (Opsiyonel)" rows="3"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                        value={leadForm.notes} onChange={e => setLeadForm({ ...leadForm, notes: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit" disabled={submitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                    Bilgi Almak İstiyorum
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-900 text-white text-center text-sm print:p-4">
                    <p>© 2026 {companyInfo.name} - Tüm hakları saklıdır.</p>
                    <p className="text-gray-400 mt-1">Bu ilan {new Date(listingInfo.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
                </div>
            </div>

            {/* Sticky WhatsApp Bottom Bar */}
            <div className="fixed bottom-6 right-6 z-[60] print:hidden">
                <a
                    href={`https://wa.me/${companyInfo.phone?.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Merhaba, "${property.title}" başlıklı ilanınızla ilgileniyorum.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-full shadow-2xl shadow-emerald-200 transition-all hover:scale-110 active:scale-95 group"
                >
                    <MessageCircle size={24} className="group-hover:animate-bounce" />
                    <span className="font-black text-sm uppercase tracking-wider hidden md:inline">WhatsApp ile Bilgi Al</span>
                </a>
            </div>
        </div>
    );
};

export default PropertyListingPublic;
