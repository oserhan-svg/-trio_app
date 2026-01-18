import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, MapPin, Phone, Mail, Globe, Eye } from 'lucide-react';
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">{property.title}</h2>
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

                {/* Footer */}
                <div className="p-6 bg-gray-900 text-white text-center text-sm print:p-4">
                    <p>© 2026 {companyInfo.name} - Tüm hakları saklıdır.</p>
                    <p className="text-gray-400 mt-1">Bu ilan {new Date(listingInfo.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
                </div>
            </div>
        </div>
    );
};

export default PropertyListingPublic;
