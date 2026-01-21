import React, { useState, useEffect } from 'react';
import { Check, Trash2, UserPlus, Loader, Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PendingContactsTable = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [processing, setProcessing] = useState(false);

    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'az', 'za'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchPendingContacts();
    }, []);

    const fetchPendingContacts = async () => {
        try {
            const res = await api.get('/clients/pending/list');
            setContacts(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Liste yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    // Filter & Sort Logic
    const getProcessedContacts = () => {
        let processed = [...contacts];

        // Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            processed = processed.filter(c =>
                c.name?.toLowerCase().includes(lowerTerm) ||
                (c.phone && c.phone.includes(lowerTerm)) ||
                (c.email && c.email.toLowerCase().includes(lowerTerm))
            );
        }

        // Sort
        processed.sort((a, b) => {
            if (sortOrder === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            if (sortOrder === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            if (sortOrder === 'az') return (a.name || '').localeCompare(b.name || '');
            if (sortOrder === 'za') return (b.name || '').localeCompare(a.name || '');
            return 0;
        });

        return processed;
    };

    const processedContacts = getProcessedContacts();
    const totalPages = Math.ceil(processedContacts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const displayedContacts = processedContacts.slice(startIndex, startIndex + itemsPerPage);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Select all currently filtered/displayed items? 
            // For bulk actions usually better to select what is visible or all filtered.
            // Let's select all FILTERED contacts (not just page) for better UX on bulk ops
            const newSet = new Set(selectedIds);
            processedContacts.forEach(c => newSet.add(c.id));
            setSelectedIds(newSet);
        } else {
            // Deselect all
            const newSet = new Set(selectedIds);
            processedContacts.forEach(c => newSet.delete(c.id));
            setSelectedIds(newSet);
        }
    };

    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleApprove = async (id) => {
        setProcessing(true);
        try {
            const res = await api.post(`/clients/pending/approve/${id}`);
            if (res.data.status === 'duplicate') {
                toast('Kişi zaten kayıtlıydı (Listeden silindi)', { icon: 'ℹ️' });
            } else {
                toast.success('Müşteri oluşturuldu');
            }
            fetchPendingContacts();
        } catch (error) {
            console.error(error);
            toast.error('Hata oluştu');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
        setProcessing(true);
        try {
            await api.delete(`/clients/pending/${id}`);
            toast.success('Silindi');
            fetchPendingContacts();
        } catch (error) {
            console.error(error);
            toast.error('Silinemedi');
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        setProcessing(true);
        try {
            const res = await api.post('/clients/pending/bulk-approve', { ids: Array.from(selectedIds) });
            toast.success(`${res.data.added} kişi eklendi, ${res.data.skipped} kişi zaten kayıtlıydı.`);
            setSelectedIds(new Set());
            fetchPendingContacts();
        } catch (error) {
            console.error(error);
            toast.error('Toplu işlem hatası');
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`${selectedIds.size} kaydı silmek istediğinize emin misiniz?`)) return;
        setProcessing(true);
        try {
            await api.post('/clients/pending/bulk-delete', { ids: Array.from(selectedIds) });
            toast.success('Seçilenler silindi');
            setSelectedIds(new Set());
            fetchPendingContacts();
        } catch (error) {
            console.error(error);
            toast.error('Toplu silme hatası');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-gray-400" /></div>;

    if (contacts.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="text-blue-500" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Bekleyen İçe Aktarım Yok</h3>
                <p className="text-gray-500 mt-1">Dosyadan yüklediğiniz kişiler onaylamanız için burada listelenir.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="p-3 border-b border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-gray/30">
                {/* Search & Filter */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="İsim, telefon, e-posta ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-xs font-medium border border-gray-300 rounded focus:ring-1 focus:ring-brand-red focus:border-brand-red placeholder:text-gray-400"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-gray-300 rounded focus:ring-1 focus:ring-brand-red bg-white cursor-pointer"
                        >
                            <option value="newest">En Yeni</option>
                            <option value="oldest">En Eski</option>
                            <option value="az">İsim (A-Z)</option>
                            <option value="za">İsim (Z-A)</option>
                        </select>
                        <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                    </div>
                </div>

                {/* Bulk Actions & Selection Info */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={processedContacts.length > 0 && processedContacts.every(c => selectedIds.has(c.id))}
                            onChange={handleSelectAll}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-brand-red focus:ring-brand-red cursor-pointer"
                            id="selectAll"
                        />
                        <label htmlFor="selectAll" className="text-xs text-brand-dark font-medium cursor-pointer">
                            {selectedIds.size > 0 ? `${selectedIds.size} seçildi` : 'Tümünü Seç'}
                        </label>
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkDelete}
                                disabled={processing}
                                className="px-3 py-1.5 bg-white border border-gray-200 text-brand-dark rounded text-xs font-medium hover:bg-gray-50 transition flex items-center gap-1"
                            >
                                <Trash2 size={12} /> <span className="hidden sm:inline">Sil</span>
                            </button>
                            <button
                                onClick={handleBulkApprove}
                                disabled={processing}
                                className="px-3 py-1.5 bg-brand-red text-white rounded text-xs font-medium hover:bg-red-700 transition flex items-center gap-1 shadow-sm"
                            >
                                <Check size={12} /> <span className="hidden sm:inline">Onayla</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-brand-gray text-brand-dark border-b border-brand-border font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="py-2.5 px-3 w-10"></th>
                            <th className="py-2.5 px-3">İsim</th>
                            <th className="py-2.5 px-3">Telefon</th>
                            <th className="py-2.5 px-3">E-posta</th>
                            <th className="py-2.5 px-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {displayedContacts.map((contact) => (
                            <tr key={contact.id} className={`hover:bg-gray-50 transition ${selectedIds.has(contact.id) ? 'bg-red-50/50' : ''}`}>
                                <td className="py-2.5 px-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(contact.id)}
                                        onChange={() => toggleSelect(contact.id)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-brand-red focus:ring-brand-red cursor-pointer"
                                    />
                                </td>
                                <td className="py-2.5 px-3 font-medium text-brand-dark">{contact.name}</td>
                                <td className="py-2.5 px-3 text-gray-600">{contact.phone}</td>
                                <td className="py-2.5 px-3 text-gray-500">{contact.email || '-'}</td>
                                <td className="py-2.5 px-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleApprove(contact.id)}
                                            disabled={processing}
                                            className="p-1 text-brand-red hover:bg-red-50 rounded transition"
                                            title="Onayla ve Ekle"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact.id)}
                                            disabled={processing}
                                            className="p-1 text-gray-400 hover:text-brand-dark hover:bg-gray-100 rounded transition"
                                            title="Listeden Sil"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {displayedContacts.length === 0 && (
                            <tr>
                                <td colSpan="5" className="py-8 text-center text-gray-500 italic">
                                    Kayıt bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {processedContacts.length > 0 && (
                <div className="p-3 border-t border-brand-border flex items-center justify-between bg-white">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                        TOPLAM <strong>{processedContacts.length}</strong> KAYIT
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Page Size Selector */}
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="text-xs border border-gray-300 rounded py-0.5 px-1 focus:ring-brand-red focus:border-brand-red cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>

                        <div className="h-3 w-px bg-gray-300 mx-1"></div>

                        {/* Page Buttons */}
                        <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white border-r border-gray-200"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-medium text-brand-dark px-2 bg-gray-50">
                                {currentPage} / {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white border-l border-gray-200"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingContactsTable;
