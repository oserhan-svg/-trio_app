import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlignLeft, Users, Home, Globe, Lock } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../services/api';

const AgendaItemModal = ({ isOpen, onClose, onSave, item = null }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_at: '',
        type: 'task',
        status: 'pending',
        is_global: false,
        client_id: '',
        property_id: ''
    });
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [properties, setProperties] = useState([]);
    const [propertySearch, setPropertySearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            fetchProperties();
            if (item) {
                // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
                const date = new Date(item.start_at);
                const offset = date.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);

                setFormData({
                    title: item.title,
                    description: item.description || '',
                    start_at: localISOTime,
                    type: item.type,
                    status: item.status,
                    is_global: item.is_global,
                    client_id: item.client_id || '',
                    property_id: item.property_id || ''
                });
            } else {
                // Default to now rounded to next hour
                const now = new Date();
                now.setMinutes(0);
                now.setHours(now.getHours() + 1);
                const offset = now.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);

                setFormData({
                    title: '',
                    description: '',
                    start_at: localISOTime,
                    type: 'task',
                    status: 'pending',
                    is_global: false,
                    client_id: '',
                    property_id: ''
                });
            }
        }
    }, [isOpen, item]);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (error) {
            console.error('Error fetching clients for agenda', error);
        }
    };

    const fetchProperties = async () => {
        try {
            const res = await api.get('/properties', { params: { limit: 100, status: 'active' } });
            setProperties(res.data.data || []);
        } catch (error) {
            console.error('Error fetching properties for agenda', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Save agenda item failed', error);
        } finally {
            setLoading(false);
        }
    };

    const [conflict, setConflict] = useState(null);

    useEffect(() => {
        if (formData.start_at) {
            checkConflict(formData.start_at);
        }
    }, [formData.start_at]);

    const checkConflict = async (startAt) => {
        // Simple client-side check if we had existing items, 
        // but it's better to hit an endpoint or search local items prop if available.
        // For now, let's assume we might receive existing items as a prop for a quick check.
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="text-blue-600" />
                        {item ? 'Randevuyu Düzenle' : 'Yeni Randevu/Görev'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Etkinlik Başlığı</label>
                        <input
                            required
                            type="text"
                            placeholder="Örn: Yer Gösterme - Ahmet Bey"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-gray-900"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tarih ve Saat</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                                <input
                                    required
                                    type="datetime-local"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                    value={formData.start_at}
                                    onChange={e => setFormData({ ...formData, start_at: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tür</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="task">📝 Görev</option>
                                <option value="meeting">🤝 Toplantı / Yüz Yüze</option>
                                <option value="call">📞 Telefon Görüşmesi</option>
                                <option value="showing">🏠 Yer Gösterme</option>
                                <option value="note">📌 Hatırlatıcı Not</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <Home size={12} /> İlişkili Emlak
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Emlak ara (Başlık, İlçe, Mahalle)..."
                                className="w-full px-4 py-2 text-xs border border-gray-100 rounded-t-lg focus:ring-1 focus:ring-blue-400 focus:outline-none bg-gray-50/50"
                                value={propertySearch}
                                onChange={e => setPropertySearch(e.target.value)}
                            />
                            <select
                                className="w-full px-4 py-3 rounded-b-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                                value={formData.property_id}
                                onChange={e => setFormData({ ...formData, property_id: e.target.value })}
                            >
                                <option value="">Seçilmedi</option>
                                {properties
                                    .filter(p =>
                                        p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                        (p.district && p.district.toLowerCase().includes(propertySearch.toLowerCase())) ||
                                        (p.neighborhood && p.neighborhood.toLowerCase().includes(propertySearch.toLowerCase()))
                                    )
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.title} ({p.district})</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Açıklama</label>
                        <div className="relative">
                            <AlignLeft size={16} className="absolute left-3 top-3 text-gray-400" />
                            <textarea
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm min-h-[80px]"
                                placeholder="Detaylar..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <Users size={12} /> İlişkili Müşteri
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Müşteri ara..."
                                    className="w-full px-4 py-2 text-xs border border-gray-100 rounded-t-lg focus:ring-1 focus:ring-blue-400 focus:outline-none bg-gray-50/50"
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                />
                                <select
                                    className="w-full px-4 py-3 rounded-b-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                                    value={formData.client_id}
                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                >
                                    <option value="">Seçilmedi</option>
                                    {clients
                                        .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <Lock size={12} /> Görünürlük
                            </label>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_global: !formData.is_global })}
                                className={`w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-medium text-sm ${formData.is_global ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                            >
                                {formData.is_global ? <Globe size={16} /> : <Lock size={16} />}
                                {formData.is_global ? 'Herkese Açık' : 'Sadece Benim'}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-6">İptal</Button>
                        <Button type="submit" disabled={loading} className="rounded-xl px-8 shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-700">
                            {loading ? 'Kaydediliyor...' : (item ? 'Güncelle' : 'Kaydet')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgendaItemModal;
