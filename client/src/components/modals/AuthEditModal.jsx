import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

const AuthEditModal = ({ property, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        auth_doc_url: property.auth_doc_url || '',
        auth_start_date: property.auth_start_date ? property.auth_start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        auth_end_date: property.auth_end_date ? property.auth_end_date.split('T')[0] : ''
    });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadToast = toast.loading('Dosya yükleniyor...');
        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await api.post('/upload/document', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, auth_doc_url: res.data.url }));
            toast.success('Dosya başarıyla yüklendi', { id: uploadToast });
        } catch (err) {
            console.error(err);
            toast.error('Dosya yüklenemedi', { id: uploadToast });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const saveToast = toast.loading('Kaydediliyor...');
        try {
            await api.put(`/properties/${property.id}`, formData);
            toast.success('Yetki belgesi güncellendi', { id: saveToast });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Güncelleme başarısız oldu', { id: saveToast });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Yetki Belgesi Yönetimi</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                        aria-label="Kapat"
                    >
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Yetki Belgesi</label>
                        <div className="flex gap-2 items-center">
                            <label className={`flex-1 cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed rounded-lg p-3 text-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span className="text-sm font-medium">{uploading ? 'Yükleniyor...' : 'Dosya Seç & Yükle (PDF/Resim)'}</span>
                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" disabled={uploading} />
                            </label>
                        </div>
                        {formData.auth_doc_url && (
                            <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 p-2 rounded border border-emerald-100">
                                <FileText size={12} />
                                <span className="truncate flex-1">Dosya yüklü: ...{formData.auth_doc_url.slice(-20)}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Başlangıç</label>
                            <input
                                type="date"
                                required
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                value={formData.auth_start_date}
                                onChange={e => setFormData({ ...formData, auth_start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Bitiş</label>
                            <input
                                type="date"
                                required
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                value={formData.auth_end_date}
                                onChange={e => setFormData({ ...formData, auth_end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
                        <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
                        <Button
                            type="submit"
                            isLoading={saving || uploading}
                            loadingText="Kaydediliyor..."
                        >
                            Kaydet
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthEditModal;
