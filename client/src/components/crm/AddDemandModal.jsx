import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import PriceInput from '../ui/PriceInput';
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
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">En Az Fiyat (TL)</label>
                            <PriceInput
                                id="min_price"
                                placeholder="0"
                                className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                                value={formData.min_price}
                                onChange={val => setFormData({ ...formData, min_price: val })}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">En Çok Fiyat (TL)</label>
                            <PriceInput
                                id="max_price"
                                placeholder="Örn: 5.000.000"
                                className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                                value={formData.max_price}
                                onChange={val => setFormData({ ...formData, max_price: val })}
                                required={!initialData}
                            />
                        </div>
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
                            <label className="text-sm font-medium text-gray-700">Mahalle (Çoklu Seçim)</label>
                            <NeighborhoodMultiSelect
                                value={formData.neighborhood}
                                onChange={val => setFormData({ ...formData, neighborhood: val })}
                            />
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

// Internal Multi-Select Component for Neighborhoods
const NeighborhoodMultiSelect = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState([]);

    const neighborhoods = [
        "150 Evler", "Ali Çetinkaya", "Altınova", "Cunda (Namık Kemal)",
        "Fevzipaşa", "Gazi Kemal", "Hamdibey", "Hayrettin Paşa",
        "İsmet Paşa", "Kazım Karabekir", "Küçükköy", "Mithatpaşa",
        "Sahilkent", "Sakarya", "Sarımsaklı", "Sefa Çamlık",
        "Yeni", "Zekibey"
    ];

    useEffect(() => {
        if (value) {
            setSelected(value.split(',').map(s => s.trim()).filter(Boolean));
        } else {
            setSelected([]);
        }
    }, [value]);

    const toggleSelection = (item) => {
        let newSelection;
        if (selected.includes(item)) {
            newSelection = selected.filter(i => i !== item);
        } else {
            newSelection = [...selected, item];
        }
        setSelected(newSelection);
        onChange(newSelection.join(','));
    };

    const toggleAll = () => {
        if (selected.length > 0) {
            onChange(''); // Clear all
        } else {
            // Optional: Select all? Usually "All" means empty filter.
            // Let's keep it as "Clear" logic mostly, or just empty.
            onChange('');
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-left rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm flex justify-between items-center"
            >
                <span className="truncate">
                    {selected.length === 0 ? 'Tümü / Farketmez' : `${selected.length} Mahalle Seçildi`}
                </span>
                <span className="text-gray-400 text-xs">▼</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-2">
                        <div
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-100 mb-1"
                            onClick={toggleAll}
                        >
                            <input
                                type="checkbox"
                                checked={selected.length === 0}
                                readOnly
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Tümü / Farketmez</span>
                        </div>

                        {neighborhoods.map(nb => (
                            <div
                                key={nb}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                onClick={() => toggleSelection(nb)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(nb)}
                                    readOnly
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-700">{nb}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AddDemandModal;
