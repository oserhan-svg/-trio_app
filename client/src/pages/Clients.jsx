import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, ArrowLeft, Phone, Mail, Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import AddClientModal from '../components/crm/AddClientModal';
import AddDemandModal from '../components/crm/AddDemandModal';
import ClientMatchesModal from '../components/crm/ClientMatchesModal';

const Clients = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'buyer', 'seller'

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15; // Increased for table view

    // Modals
    const [showAddClient, setShowAddClient] = useState(false);
    const [showAddDemand, setShowAddDemand] = useState(false);
    const [showMatches, setShowMatches] = useState(false);

    // Selection state
    const [selectedClientForDemand, setSelectedClientForDemand] = useState(null);
    const [selectedDemandToEdit, setSelectedDemandToEdit] = useState(null);
    const [selectedClientForMatches, setSelectedClientForMatches] = useState(null);

    useEffect(() => {
        fetchClients();
    }, []);

    // Filtering Logic
    useEffect(() => {
        let result = clients;

        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }

        if (typeFilter !== 'all') {
            result = result.filter(c => (c.type || 'buyer') === typeFilter);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowerTerm) ||
                (c.phone && c.phone.includes(searchTerm)) ||
                (c.email && c.email.toLowerCase().includes(lowerTerm))
            );
        }

        setFilteredClients(result);
        setCurrentPage(1);
    }, [clients, searchTerm, statusFilter, typeFilter]);

    // Derived Paginated List
    const totalPages = Math.ceil(filteredClients.length / pageSize);
    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
            setFilteredClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (formData) => {
        try {
            await api.post('/clients', formData);
            setShowAddClient(false);
            addToast('Müşteri başarıyla eklendi');
            fetchClients();
        } catch (error) {
            console.error('Create Client Error:', error);
            const msg = error.response?.data?.error || 'Müşteri eklenirken hata oluştu';
            addToast(msg, 'error');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/clients/${id}`);
            addToast('Müşteri silindi');
            fetchClients();
        } catch {
            addToast('Müşteri silinemedi', 'error');
        }
    };

    // Demand Handlers
    const openAddDemandModal = (e, client) => {
        e.stopPropagation();
        setSelectedClientForDemand(client);
        setSelectedDemandToEdit(null);
        setShowAddDemand(true);
    };

    const handleSaveDemand = async (formData) => {
        if (!selectedClientForDemand) return;
        try {
            if (selectedDemandToEdit) {
                await api.put(`/clients/demands/${selectedDemandToEdit.id}`, formData);
                addToast('Talep güncellendi');
            } else {
                await api.post(`/clients/${selectedClientForDemand.id}/demands`, formData);
                addToast('Yeni talep eklendi');
            }
            setShowAddDemand(false);
            fetchClients();
        } catch (error) {
            addToast('İşlem başarısız', 'error');
        }
    };

    const openMatchesModal = (e, client) => {
        e.stopPropagation();
        setSelectedClientForMatches(client);
        setShowMatches(true);
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Active': 'bg-emerald-100 text-emerald-800',
            'Negotiation': 'bg-blue-100 text-blue-800',
            'Closed Won': 'bg-purple-100 text-purple-800',
            'Lost': 'bg-gray-100 text-gray-800',
            'default': 'bg-slate-100 text-slate-800'
        };
        const labels = {
            'Active': 'Aktif',
            'Negotiation': 'Görüşülüyor',
            'Closed Won': 'Kazanıldı',
            'Lost': 'Kaybedildi'
        };
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[status] || styles.default}`}>
                {labels[status] || status || 'Belirsiz'}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Users className="text-emerald-600" size={20} />
                                Müşteri Listesi
                                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                                    {filteredClients.length}
                                </span>
                            </h1>
                        </div>
                        <Button onClick={() => setShowAddClient(true)} size="sm" className="flex items-center gap-1.5 px-3">
                            <Plus size={16} /> <span className="hidden sm:inline">Yeni Müşteri</span>
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 pb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="İsim, telefon veya e-posta ile ara..."
                                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <select
                                    className="pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Tüm Durumlar</option>
                                    <option value="Active">Aktif</option>
                                    <option value="Negotiation">Görüşülüyor</option>
                                    <option value="Closed Won">Kazanıldı</option>
                                    <option value="Lost">Kaybedildi</option>
                                </select>
                            </div>
                            <div className="flex bg-gray-100 p-0.5 rounded-md">
                                <button
                                    onClick={() => setTypeFilter('all')}
                                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${typeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Tümü
                                </button>
                                <button
                                    onClick={() => setTypeFilter('buyer')}
                                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${typeFilter === 'buyer' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Alıcı
                                </button>
                                <button
                                    onClick={() => setTypeFilter('seller')}
                                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${typeFilter === 'seller' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Satıcı
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="w-full h-16 rounded-lg" />
                        ))}
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-medium text-gray-900">Müşteri Bulunamadı</h3>
                        <p className="text-sm text-gray-500">Arama kriterlerinizi değiştirin veya yeni ekleyin.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Müşteri</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İletişim</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Talepler</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedClients.map(client => (
                                        <tr
                                            key={client.id}
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                            className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                                        >
                                            {/* Client Name & Avatar */}
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                            {client.name}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Kayıt: {new Date(client.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact Info */}
                                            <td className="px-6 py-3">
                                                <div className="space-y-1">
                                                    {client.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <Phone size={12} className="text-gray-400" /> {client.phone}
                                                        </div>
                                                    )}
                                                    {client.email && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <Mail size={12} className="text-gray-400" /> {client.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Demands */}
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${client.demands?.length > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                        {client.demands?.length || 0} Talep
                                                    </span>
                                                    <button
                                                        onClick={(e) => openAddDemandModal(e, client)}
                                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-emerald-100 text-emerald-600 rounded transition-all"
                                                        title="Hızlı Talep Ekle"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-3">
                                                {getStatusBadge(client.status)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => openMatchesModal(e, client)}
                                                        className="text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 rounded flex items-center gap-1 transition"
                                                    >
                                                        ✨ Eşleşmeler
                                                    </button>
                                                    <div className="w-px h-3 bg-gray-200"></div>
                                                    <button
                                                        onClick={(e) => handleDelete(e, client.id)}
                                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-md hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs text-gray-500 font-medium">
                                    Sayfa {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-md hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AddClientModal
                isOpen={showAddClient}
                onClose={() => setShowAddClient(false)}
                onSave={handleCreateClient}
            />

            <AddDemandModal
                isOpen={showAddDemand}
                onClose={() => setShowAddDemand(false)}
                onSave={handleSaveDemand}
                clientName={selectedClientForDemand?.name}
                initialData={selectedDemandToEdit}
            />

            <ClientMatchesModal
                isOpen={showMatches}
                onClose={() => setShowMatches(false)}
                client={selectedClientForMatches}
            />
        </div>
    );
};

export default Clients;
