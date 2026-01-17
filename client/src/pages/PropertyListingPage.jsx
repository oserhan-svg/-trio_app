import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, MapPin, Home, Maximize, Phone, Mail, Globe, ArrowLeft, MessageCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PropertyListingPage = () => {
    const { propertyId } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const printRef = useRef();

    // --- Start: New Logic for Description and Features ---
    const [title, setTitle] = useState(''); // [NEW] Title State
    const [description, setDescription] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [aiLoading, setAiLoading] = useState(false); // [NEW] Loading state for AI

    useEffect(() => {
        if (property) {
            setTitle(property.title || ''); // Init Title
            setDescription(property.description || '');
            if (property.images && property.images.length > 0) {
                setSelectedImage(property.images[0]);
            }
        }
    }, [property]);

    const generateProfessionalDescription = async () => {
        if (!property) return;
        setAiLoading(true);

        try {
            const response = await api.post(`/listings/${property.id}/generate-ai`);
            if (response.data.success) {
                setDescription(response.data.data.description);
                setTitle(response.data.data.title);
                toast.success('AI tarafından Başlık ve Metin oluşturuldu! ✨');
            }
        } catch (error) {
            console.error('AI Error:', error);
            toast.error('AI içerik oluşturma başarısız oldu.');
        } finally {
            setAiLoading(false);
        }
    };

    // Filter out unwanted features
    const filteredFeatures = property?.features ? property.features.filter(f => {
        const text = f.toLocaleLowerCase('tr');
        return !text.includes('ilan no') &&
            !text.includes('ilan numarası') &&
            !text.includes('tarih') &&
            !text.includes('güncelleme') &&
            !text.includes('son gün');
    }) : [];
    // --- End: New Logic ---

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

    useEffect(() => {
        fetchProperty();
    }, [propertyId]);

    const fetchProperty = async () => {
        try {
            const response = await api.get(`/properties/${propertyId}`);
            setProperty(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching property:', error);
            setLoading(false);
        }
    };

    const handleGenerateListing = async () => {
        try {
            const response = await api.post('/listings/generate', { propertyId, description, title });
            setListing(response.data);
            setShowShareModal(true);
        } catch (error) {
            console.error('Error generating listing:', error);
            toast.error('Paylaşım linki oluşturulamadı.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const copyToClipboard = () => {
        const url = `${window.location.origin}/listing/${listing.listing.share_token}`;
        navigator.clipboard.writeText(url);
        toast.success('Link kopyalandı!');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
    }

    if (!property) {
        return <div className="min-h-screen flex items-center justify-center">İlan bulunamadı.</div>;
    }

    const shareUrl = listing ? `${window.location.origin}/listing/${listing.listing.share_token}` : '';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Action Bar */}
            <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center print:hidden sticky top-0 z-50">
                <button onClick={() => navigate(`/property/${propertyId}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={20} />
                    Geri
                </button>
                <div className="flex gap-3">
                    <button onClick={handleGenerateListing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Share2 size={18} />
                        Paylaş
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <Download size={18} />
                        PDF İndir
                    </button>
                </div>
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
                    {/* Editable Title */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-3xl font-bold text-gray-900 mb-2 print:hidden w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                    />
                    {/* Printable Title */}
                    <h2 className="hidden print:block text-3xl font-bold text-gray-900 mb-2 print:text-2xl">{title}</h2>

                    <p className="text-gray-600 flex items-center gap-2">
                        <MapPin size={18} />
                        {property.neighborhood}, {property.district}
                    </p>
                </div>

                {/* Image Gallery */}
                {property.images && property.images.length > 0 && (
                    <div className="p-8 print:p-6 border-b">
                        {/* Interactive Gallery for Screen */}
                        <div className="print:hidden">
                            {/* Main Image */}
                            <div className="mb-4">
                                <img
                                    src={selectedImage || property.images[0]}
                                    alt={property.title}
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
                        {property.seller_type && (
                            <div className="bg-gray-50 p-4 rounded-lg print:p-3">
                                <p className="text-sm text-gray-600 mb-1">Satıcı Tipi</p>
                                <p className="text-xl font-bold text-gray-900 print:text-lg capitalize">
                                    {property.seller_type === 'owner' ? 'Sahibinden' : 'Emlak Ofisi'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="p-8 print:p-6 border-b">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Açıklama</h3>
                        <button
                            onClick={generateProfessionalDescription}
                            disabled={aiLoading}
                            className={`bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-purple-200 transition-colors print:hidden ${aiLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="text-lg">{aiLoading ? '⏳' : '✨'}</span>
                            {aiLoading ? 'Oluşturuluyor...' : 'Trio AI ile Düzenle'}
                        </button>
                    </div>
                    {/* Editable Text Area for Description when not printing, plain text when printing */}
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full min-h-[150px] p-3 border rounded-md text-gray-700 leading-relaxed font-sans focus:ring-2 focus:ring-blue-500 outline-none print:hidden resize-y"
                    />
                    <p className="hidden print:block text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Features */}
                {filteredFeatures.length > 0 && (
                    <div className="p-8 print:p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Özellikler</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3">
                            {filteredFeatures.map((feature, idx) => (
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
                        </div>
                        {shareUrl && (
                            <div className="text-center print:block hidden">
                                <QRCodeSVG value={shareUrl} size={100} />
                                <p className="text-xs text-gray-500 mt-2">QR kodu okutarak<br />detayları görün</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-900 text-white text-center text-sm print:p-4">
                    <p>© 2026 {companyInfo.name} - Tüm hakları saklıdır.</p>
                    <p className="text-gray-400 mt-1">Bu ilan {new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && listing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-2xl font-bold mb-4">Paylaşım Linki Oluşturuldu</h3>
                        <div className="mb-6 text-center">
                            <QRCodeSVG value={shareUrl} size={200} className="mx-auto" />
                        </div>
                        <div className="bg-gray-100 p-3 rounded-md mb-4 break-all text-sm">
                            {shareUrl}
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={copyToClipboard} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Share2 size={18} /> Linki Kopyala
                            </button>
                            <button
                                onClick={() => {
                                    const text = `Merhaba, bu ilan ilginizi çekebilir: ${shareUrl}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="w-full bg-[#25D366] text-white py-2 rounded-md hover:bg-[#128C7E] flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} /> WhatsApp ile Paylaş
                            </button>
                            <button onClick={() => setShowShareModal(false)} className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300">
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyListingPage;
