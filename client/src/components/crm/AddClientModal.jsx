import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { X } from 'lucide-react';

const AddClientModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '', type: 'buyer' });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            setFormData({ name: '', phone: '', email: '', notes: '', type: 'buyer' }); // Reset with type
        } catch (error) {
            console.error('Save failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 opacity-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Yeni Müşteri Ekle</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Ad Soyad"
                        placeholder="Örn: Ahmet Yılmaz"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Telefon"
                        placeholder="Örn: 0555 123 45 67"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Input
                        label="E-posta"
                        type="email"
                        placeholder="ahmet@ornek.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Müşteri Tipi</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.type === 'buyer' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="clientType"
                                    value="buyer"
                                    checked={formData.type === 'buyer'}
                                    onChange={() => setFormData({ ...formData, type: 'buyer' })}
                                    className="hidden"
                                />
                                <span className="font-semibold">🏠 Alıcı</span>
                            </label>
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.type === 'seller' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="clientType"
                                    value="seller"
                                    checked={formData.type === 'seller'}
                                    onChange={() => setFormData({ ...formData, type: 'seller' })}
                                    className="hidden"
                                />
                                <span className="font-semibold">🔑 Satıcı</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Notlar</label>
                        <textarea
                            className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[100px]"
                            placeholder="Müşteri hakkında notlar..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
