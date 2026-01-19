import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { MapPin, Phone, Building, ExternalLink, Download } from 'lucide-react';

const OpportunityReportPage = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // 1. Try getting IDs from URL Params first (Shareable Link)
                const searchParams = new URLSearchParams(window.location.search);
                const urlIds = searchParams.get('ids');

                let ids = [];

                if (urlIds) {
                    ids = urlIds.split(',').map(Number);
                } else {
                    // 2. Fallback to LocalStorage (Local Navigation)
                    try {
                        const stored = localStorage.getItem('report_selected_ids');
                        if (stored) {
                            ids = JSON.parse(stored);
                        }
                    } catch (e) {
                        console.error('Failed to parse stored report IDs', e);
                        ids = [];
                    }
                }

                if (!Array.isArray(ids) || ids.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch properties
                const response = await api.get('/properties');
                const all = response.data;
                const safeIds = ids.map(id => parseInt(id)).filter(n => !isNaN(n));
                const selected = all.filter(p => safeIds.includes(p.id));
                setProperties(selected);

            } catch (error) {
                console.error('Report fetch failed', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Bülten hazırlanıyor...</div>;
    if (properties.length === 0) return <div className="p-8 text-center text-red-500">Bülten için seçili ilan bulunamadı. URL hatalı veya ilanlar silinmiş olabilir.</div>;

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans print:bg-white p-8">
            {/* Print Controls */}
            <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <div className="text-gray-600 text-sm">
                    Bu sayfa yazdırılmak üzere tasarlanmıştır. Tarayıcınızın "Yazdır" (Ctrl+P) özelliğini kullanarak PDF olarak kaydedebilirsiniz.
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            // Generate Shareable Link
                            const ids = properties.map(p => p.id).join(',');
                            const shareUrl = `${window.location.origin}/reports/opportunities?ids=${ids}`;

                            const text = `🌟 *Trio App Fırsat Bülteni*\n\nSizin için seçtiğimiz fırsat ilanlarını incelemek için aşağıdaki linke tıklayın:\n\n🔗 ${shareUrl}`;

                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition flex items-center gap-2 shadow-sm"
                    >
                        <Phone size={16} /> WhatsApp Link Paylaş
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition flex items-center gap-2 shadow-sm"
                    >
                        <Download size={16} /> Yazdır / PDF Kaydet
                    </button>
                </div>
            </div>

            {/* A4 Content Container */}
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-emerald-600 pb-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fırsat Bülteni</h1>
                        <p className="text-gray-500 mt-1 font-medium">Danışman Özel Portföy Listesi • {new Date().toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-emerald-600">Trio App</div>
                        <div className="text-xs text-gray-400">Yapay Zeka Destekli Gayrimenkul Analizi</div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-8">
                    {properties.map((p) => (
                        <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid">
                            {/* Image & Score Header */}
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                                {p.images && p.images.length > 0 ? (
                                    <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                        <Building size={32} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                                    Fırsat Puanı: {p.opportunity_score}/10
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                                    {p.seller_name || 'Sahibinden'}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg leading-tight line-clamp-2 min-h-[2.5rem]">
                                        {p.title}
                                    </h3>
                                </div>

                                <div className="flex items-center text-gray-500 text-sm mb-3">
                                    <MapPin size={14} className="mr-1" />
                                    {p.neighborhood}, {p.district}
                                </div>

                                <div className="text-[10px] text-gray-400 mb-3 bg-gray-50 inline-block px-1.5 py-0.5 rounded border border-gray-100">
                                    İlan No: #{p.external_id}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                                    <div>
                                        <span className="block text-gray-400 text-[10px]">Emlak Tipi</span>
                                        <span className="font-semibold">{p.rooms || '-'} • {p.size_m2} m²</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-gray-400 text-[10px]">İlan Sahibi Tel</span>
                                        <span className="font-semibold">{p.seller_phone || 'Gizli'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                    <div className="text-emerald-700 font-black text-xl">
                                        {parseFloat(p.price).toLocaleString()} ₺
                                    </div>
                                    <a
                                        href={p.url}
                                        target="_blank"
                                        className="text-gray-400 hover:text-blue-600 print:hidden"
                                        title="İlana Git"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 border-t border-gray-200 pt-6 text-center text-gray-400 text-xs">
                    Bu rapor Trio App sistemi tarafından otomatik olarak oluşturulmuştur. | {new Date().toLocaleString()}
                </div>
            </div>
        </div>
    );
};

export default OpportunityReportPage;
