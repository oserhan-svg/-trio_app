import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, FileText, Loader } from 'lucide-react';
import { parseCSV } from '../../utils/csvParser';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ContactImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview
    const [parsedContacts, setParsedContacts] = useState([]);
    const [selectedIndices, setSelectedIndices] = useState(new Set());
    const [progress, setProgress] = useState('');
    const [loading, setLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const fileInputRef = useRef(null);

    const handleImport = async () => {
        const toImport = parsedContacts.filter((_, i) => selectedIndices.has(i));
        if (toImport.length === 0) return toast.error('Lütfen en az bir kişi seçin.');

        setLoading(true);
        const BATCH_SIZE = 500;
        let totalStats = { added: 0, skipped: 0, errors: 0 };
        // eslint-disable-next-line no-unused-vars
        let hasError = false;

        try {
            for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
                const batch = toImport.slice(i, i + BATCH_SIZE);
                setProgress(`Yükleniyor... (${Math.min(i + batch.length, toImport.length)}/${toImport.length})`);

                try {
                    const res = await api.post('/clients/bulk', batch);
                    const { added, skipped, errors } = res.data.results;
                    totalStats.added += added;
                    totalStats.skipped += skipped;
                    totalStats.errors += errors;
                } catch (batchError) {
                    console.error(`Batch ${i} error:`, batchError);
                    totalStats.errors += batch.length;
                    hasError = true;
                }
            }

            let msg = `${totalStats.added} kişi başarıyla eklendi.`;
            if (totalStats.skipped > 0) msg += ` ${totalStats.skipped} kişi zaten kayıtlı olduğu için atlandı.`;
            if (totalStats.errors > 0) msg += ` ${totalStats.errors} hata oluştu.`;

            if (totalStats.added > 0) toast.success(msg, { duration: 6000 });
            else if (totalStats.skipped > 0) toast(msg, { icon: 'ℹ️', duration: 6000 });
            else toast.error('İçe aktarma başarısız oldu.');

            onImportSuccess();
            onClose();
            setStep(1);
            setParsedContacts([]);
            setSelectedIndices(new Set());
            setFilterText('');
            setProgress('');

        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.details || error.response?.data?.error || 'İçe aktarma sırasında beklenmedik bir hata oluştu.';
            toast.error(`Hata: ${errorMsg}`);
        } finally {
            setLoading(false);
            setProgress('');
        }
    };

    if (!isOpen) return null;

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const contacts = await parseCSV(file);
            setParsedContacts(contacts);
            // Auto Select All
            const allIndices = new Set(contacts.map((_, i) => i));
            setSelectedIndices(allIndices);
            setStep(2);
        } catch (error) {
            console.error(error);
            toast.error('Dosya okunamadı. Lütfen geçerli bir CSV dosyası yükleyin.');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // eslint-disable-next-line no-unused-vars
    const toggleSelection = (index) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedIndices(newSet);
    };

    const getFilteredContacts = () => {
        if (!filterText) return parsedContacts.map((c, i) => ({ ...c, originalIndex: i }));
        return parsedContacts
            .map((c, i) => ({ ...c, originalIndex: i }))
            .filter(c =>
                c.name.toLowerCase().includes(filterText.toLowerCase()) ||
                (c.email && c.email.toLowerCase().includes(filterText.toLowerCase())) ||
                (c.phone && c.phone.includes(filterText))
            );
    };

    const filteredContacts = getFilteredContacts();
    const validCount = parsedContacts.filter(c => c.isValid).length;
    const invalidCount = parsedContacts.length - validCount;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-gray/50">
                    <div>
                        <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                            <Upload className="text-brand-red" size={20} />
                            Kişi İçe Aktar
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Google Contacts ve Outlook CSV dosyalarını destekler.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-brand-dark transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {step === 1 ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6">
                            <div
                                onClick={() => fileInputRef.current.click()}
                                className="w-full max-w-sm h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-red hover:bg-red-50/30 transition-all group"
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-brand-red group-hover:bg-white transition-colors mb-4">
                                    <FileText size={32} />
                                </div>
                                <p className="text-sm font-medium text-brand-dark">Dosya Seçmek İçin Tıklayın</p>
                                <p className="text-xs text-gray-400 mt-1">.CSV Dosyaları</p>
                            </div>
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                            />

                            <div className="bg-blue-50 p-4 rounded-lg w-full max-w-sm border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
                                    <AlertCircle size={16} /> Desteklenen Formatlar
                                </h4>
                                <ul className="text-xs text-blue-700 space-y-1 ml-6 list-disc">
                                    <li>Google Contacts Dışa Aktarımı (CSV)</li>
                                    <li>Outlook Kişiler (CSV)</li>
                                    <li>Excel'den CSV olarak kaydedilenler</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Toplam</div>
                                    <div className="text-lg font-bold text-brand-dark">{parsedContacts.length}</div>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded border border-emerald-100 text-center">
                                    <div className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Geçerli</div>
                                    <div className="text-lg font-bold text-emerald-700">{validCount}</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded border border-red-100 text-center">
                                    <div className="text-xs text-brand-red uppercase font-bold tracking-wider">Hatalı</div>
                                    <div className="text-lg font-bold text-brand-red">{invalidCount}</div>
                                </div>
                            </div>

                            {/* Search Preview */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Önizlemede ara..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                                />
                            </div>

                            {/* List Preview */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="px-3 py-2">Durum</th>
                                            <th className="px-3 py-2">İsim</th>
                                            <th className="px-3 py-2">Telefon</th>
                                            <th className="px-3 py-2">Not</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredContacts.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="px-3 py-2">
                                                    {row.isValid ?
                                                        <Check size={14} className="text-emerald-500" /> :
                                                        <AlertCircle size={14} className="text-brand-red" />
                                                    }
                                                </td>
                                                <td className="px-3 py-2 font-medium text-brand-dark">{row.name || '-'}</td>
                                                <td className="px-3 py-2 text-gray-600 font-mono">{row.phone || '-'}</td>
                                                <td className="px-3 py-2 text-gray-400 max-w-[150px] truncate">{row.notes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedContacts.length > 50 && (
                                    <div className="px-3 py-2 bg-gray-50 text-xs text-center text-gray-500 border-t border-gray-200">
                                        ... ve {parsedContacts.length - 50} kişi daha
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-brand-border bg-gray-50 flex justify-between items-center">
                    {step === 2 && (
                        <button
                            onClick={() => { setStep(1); setFilteredContacts([]); }}
                            className="text-gray-500 hover:text-brand-dark text-sm font-medium transition-colors"
                        >
                            Geri Dön
                        </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-brand-dark rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                        >
                            İptal
                        </button>
                        {step === 2 && (
                            <button
                                onClick={handleImport}
                                disabled={validCount === 0 || loading}
                                className="px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {loading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                                {validCount} Kişiyi İçe Aktar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactImportModal;
