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
        try {
            await api.put(`/properties/${property.id}`, formData);
            toast.success('Yetki belgesi güncellendi');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Güncelleme başarısız oldu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">Yetki Belgesi Yönetimi</h3>
                    <button
                        onClick={onClose}
                        aria-label="Kapat"
                        className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Yetki Belgesi</label>
                        <div className="flex gap-2 items-center">
                            <label className={`flex-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 border-dashed rounded-xl p-4 text-center transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span className="text-sm font-semibold">{uploading ? 'Yükleniyor...' : 'Dosya Seç & Yükle (PDF/Resim)'}</span>
                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" disabled={uploading} />
                            </label>
                        </div>
                        {formData.auth_doc_url && (
                            <div className="mt-3 text-xs text-emerald-600 flex items-center gap-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                <FileText size={14} />
                                <span className="truncate flex-1 font-medium">Dosya yüklü: ...{formData.auth_doc_url.slice(-20)}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Başlangıç</label>
                            <input
                                type="date"
                                required
                                className="w-full text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm px-3 py-2 transition-all"
                                value={formData.auth_start_date}
                                onChange={e => setFormData({ ...formData, auth_start_date: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Bitiş</label>
                            <input
                                type="date"
                                required
                                className="w-full text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm px-3 py-2 transition-all"
                                value={formData.auth_end_date}
                                onChange={e => setFormData({ ...formData, auth_end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={saving || uploading}>İptal</Button>
                        <Button type="submit" isLoading={saving} loadingText="Kaydediliyor..." disabled={uploading}>
                            Kaydet
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthEditModal;
