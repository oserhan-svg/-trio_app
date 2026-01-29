import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Copy, Sparkles, Loader2, Info, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

const ClientAIDigestModal = ({ isOpen, onClose, client }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [digest, setDigest] = useState('');
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        if (isOpen && client) {
            generateDigest();
        } else {
            setDigest('');
            setProperties([]);
        }
    }, [isOpen, client]);

    const generateDigest = async () => {
        try {
            setLoading(true);
            const response = await api.post(`/clients/${client.id}/ai-digest`);
            setDigest(response.data.digest);
            setProperties(response.data.properties);
        } catch (error) {
            console.error('Digest Generation Error:', error);
            const msg = error.response?.data?.error || 'Özet oluşturulamadı.';
            addToast(msg, 'error');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(digest);
        addToast('Metin kopyalandı');
    };

    const navigate = useNavigate();

    const handleWhatsApp = () => {
        const phone = client.phone?.replace(/[^\d]/g, '');
        // Pass decoded text, WhatsAppBotDashboard will handle encoding for the iframe
        navigate(`/intelligence/whatsapp?phone=${phone}&text=${encodeURIComponent(digest)}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">AI Portföy Özeti</h3>
                            <p className="text-xs text-emerald-600 font-medium">{client?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
                            <Loader2 size={32} className="animate-spin text-emerald-500" />
                            <p className="text-sm font-medium animate-pulse">AI portföyünüzü analiz ediyor ve mesajı hazırlıyor...</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3">
                                <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Bu özet, müşterinin aktif taleplerine göre en uygun 5 ilanı içerir. Aşağıdaki metni düzenleyebilir veya doğrudan WhatsApp üzerinden gönderebilirsiniz.
                                </p>
                            </div>

                            <div className="relative group">
                                <textarea
                                    className="w-full h-80 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-sans leading-relaxed resize-none"
                                    value={digest}
                                    onChange={(e) => setDigest(e.target.value)}
                                    placeholder="AI özetini buraya yazın..."
                                />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 bg-white shadow-md border border-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-all"
                                        title="Kopyala"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Short Property List Preview */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-1">Özette Yer Alan İlanlar</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {properties.map(p => (
                                        <div key={p.id} className="flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-lg text-[11px]">
                                            <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-lg">
                                                {p.category === 'land' ? '🌳' : (p.category === 'villa' ? '🏡' : '🏢')}
                                            </div>
                                            <div className="truncate">
                                                <div className="font-bold text-gray-700 truncate">{p.title}</div>
                                                <div className="text-emerald-600">{parseFloat(p.price).toLocaleString()} ₺</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Kapat
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={async () => {
                            try {
                                await api.post(`/clients/${client.id}/ai-digest/send`, { message: digest });
                                addToast('Mesaj başarıyla gönderildi', 'success');
                                onClose();
                            } catch (e) {
                                addToast('Gönderim hatası: ' + (e.response?.data?.error || e.message), 'error');
                            }
                        }}
                        disabled={loading || !digest}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow flex items-center gap-2"
                        title="Sistem üzerinden direkt gönder"
                    >
                        <MessageCircle size={18} />
                        Direkt Gönder
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleWhatsApp}
                        disabled={loading || !digest}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 flex items-center gap-2"
                    >
                        <ExternalLink size={18} />
                        WhatsApp'ta Aç
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ClientAIDigestModal;
