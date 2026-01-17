import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { X } from 'lucide-react';

const AddDemandModal = ({ isOpen, onClose, onSave, clientName, initialData = null }) => {
    const [formData, setFormData] = useState({
        min_price: '',
        max_price: '',
        rooms: '',
        district: '', // Town usually
        neighborhood: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    min_price: initialData.min_price || '',
                    max_price: initialData.max_price || '',
                    rooms: initialData.rooms || '',
                    district: initialData.district || '',
                    neighborhood: initialData.neighborhood || ''
                });
            } else {
                setFormData({ min_price: '', max_price: '', rooms: '', district: '', neighborhood: '' });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            // Don't reset here immediately, parent does close
        } catch (error) {
            console.error('Save failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Talebi Düzenle' : 'Talep Ekle'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>
                <p className="text-sm text-gray-500 mb-6">Müşteri: <span className="font-semibold text-gray-700">{clientName}</span></p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="En Az Fiyat (TL)"
                            type="number"
                            placeholder="0"
                            value={formData.min_price}
                            onChange={e => setFormData({ ...formData, min_price: e.target.value })}
                        />
                        <Input
                            label="En Çok Fiyat (TL)"
                            type="number"
                            placeholder="Örn: 5000000"
                            value={formData.max_price}
                            onChange={e => setFormData({ ...formData, max_price: e.target.value })}
                            required={!initialData}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Oda Sayısı</label>
                        <select
                            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            value={formData.rooms}
                            onChange={e => setFormData({ ...formData, rooms: e.target.value })}
                        >
                            <option value="">Farketmez</option>
                            <option value="1+1">1+1</option>
                            <option value="2+1">2+1</option>
                            <option value="3+1">3+1</option>
                            <option value="4+1">4+1</option>
                            <option value="Villa">Villa / Müstakil</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="İlçe / Bölge"
                            placeholder="Ayvalık"
                            value={formData.district}
                            onChange={e => setFormData({ ...formData, district: e.target.value })}
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Mahalle</label>
                            <select
                                className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                value={formData.neighborhood}
                                onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                            >
                                <option value="">Tümü / Farketmez</option>
                                <option value="150 Evler">150 Evler</option>
                                <option value="Ali Çetinkaya">Ali Çetinkaya</option>
                                <option value="Altınova">Altınova</option>
                                <option value="Cunda (Namık Kemal)">Cunda (Namık Kemal)</option>
                                <option value="Fevzipaşa">Fevzipaşa</option>
                                <option value="Gazi Kemal">Gazi Kemal</option>
                                <option value="Hamdibey">Hamdibey</option>
                                <option value="Hayrettin Paşa">Hayrettin Paşa</option>
                                <option value="İsmet Paşa">İsmet Paşa</option>
                                <option value="Kazım Karabekir">Kazım Karabekir</option>
                                <option value="Küçükköy">Küçükköy</option>
                                <option value="Mithatpaşa">Mithatpaşa</option>
                                <option value="Sahilkent">Sahilkent</option>
                                <option value="Sakarya">Sakarya</option>
                                <option value="Sarımsaklı">Sarımsaklı</option>
                                <option value="Sefa Çamlık">Sefa Çamlık</option>
                                <option value="Yeni">Yeni</option>
                                <option value="Zekibey">Zekibey</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Ekle')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDemandModal;
