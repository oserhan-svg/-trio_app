import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Tag, ArrowLeft, Phone, Mail, FileText, Edit2, X, ExternalLink, Search, Filter } from 'lucide-react';
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
    const pageSize = 9; // Show 9 cards per page (3x3 grid)

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

        // 1. Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }

        // 2. Type Filter
        if (typeFilter !== 'all') {
            result = result.filter(c => (c.type || 'buyer') === typeFilter);
        }

        // 2. Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowerTerm) ||
                (c.phone && c.phone.includes(searchTerm)) ||
                (c.email && c.email.toLowerCase().includes(lowerTerm))
            );
        }

        setFilteredClients(result);
        setCurrentPage(1); // Reset to first page on filter change
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
            addToast('Müşteri eklenirken hata oluştu', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/clients/${id}`);
            addToast('Müşteri silindi');
            fetchClients();
        } catch (error) {
            addToast('Müşteri silinemedi', 'error');
        }
    };

    // Demand Handlers
    const openAddDemandModal = (client) => {
        setSelectedClientForDemand(client);
        setSelectedDemandToEdit(null); // Reset edit mode
        setShowAddDemand(true);
    };

    const openEditDemandModal = (client, demand) => {
        setSelectedClientForDemand(client);
        setSelectedDemandToEdit(demand); // Set initial data
        setShowAddDemand(true);
    };

    const handleSaveDemand = async (formData) => {
        if (!selectedClientForDemand) return;
        try {
            if (selectedDemandToEdit) {
                // Update existing
                await api.put(`/clients/demands/${selectedDemandToEdit.id}`, formData);
                addToast('Talep güncellendi');
            } else {
                // Create new
                await api.post(`/clients/${selectedClientForDemand.id}/demands`, formData);
                addToast('Yeni talep eklendi');
            }
            setShowAddDemand(false);
            fetchClients();
        } catch (e) {
            addToast('Talep kaydedilemedi', 'error');
        }
    };

    const handleDeleteDemand = async (demandId) => {
        if (!confirm('Bu talebi silmek istiyor musunuz?')) return;
        try {
            await api.delete(`/clients/demands/${demandId}`);
            addToast('Talep silindi');
            fetchClients();
        } catch (e) {
            addToast('Talep silinemedi', 'error');
        }
    };

    const openMatchesModal = (client) => {
        setSelectedClientForMatches(client);
        setShowMatches(true);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="text-emerald-600" />
                                    Müşteri Yönetimi
                                </h1>
                                <p className="text-sm text-gray-500">Müşterilerinizi ve taleplerini buradan yönetin</p>
                            </div>
                        </div>
                        <Button onClick={() => setShowAddClient(true)} className="flex items-center gap-2">
                            <Plus size={18} /> Yeni Müşteri
                        </Button>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="İsim, Telefon veya E-posta ile ara..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
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
                    </div>
                </div>
            </div>

            {/* Type Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors ${typeFilter === 'all' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setTypeFilter('buyer')}
                            className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${typeFilter === 'buyer' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            🏠 Alıcılar
                        </button>
                        <button
                            onClick={() => setTypeFilter('seller')}
                            className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${typeFilter === 'seller' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            🔑 Satıcılar
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="w-32 h-4" />
                                            <Skeleton className="w-20 h-3" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                </div>
                                <div className="space-y-3 mb-6">
                                    <Skeleton className="w-full h-4" />
                                    <Skeleton className="w-2/3 h-4" />
                                </div>
                                <div className="border-t border-gray-100 pt-4">
                                    <Skeleton className="w-full h-12 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Sonuç Bulunamadı</h3>
                        <p className="text-gray-500 mb-6">Aradığınız kriterlere uygun müşteri yok.</p>
                        {searchTerm || statusFilter !== 'all' ? (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Filtreleri Temizle
                            </button>
                        ) : (
                            <Button variant="outline" onClick={() => setShowAddClient(true)}>+ İlk Müşteriyi Ekle</Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedClients.map(client => (
                                <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group">
                                    {/* ... card content unchanged ... */}
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div onClick={() => navigate(`/clients/${client.id}`)} className="cursor-pointer group-hover:text-emerald-700 transition-colors">
                                                    <h3 className="font-bold text-gray-900 line-clamp-1 flex items-center gap-1">
                                                        {client.name}
                                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </h3>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                                        {new Date(client.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openMatchesModal(client)}
                                                    className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                                                    title="Eşleşmeleri Gör"
                                                >
                                                    ✨ Eşleşmeler
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                {client.phone || <span className="text-gray-300 italic">Telefon yok</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-gray-400" />
                                                {client.email || <span className="text-gray-300 italic">E-posta yok</span>}
                                            </div>
                                            {client.notes && (
                                                <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded-lg text-xs text-yellow-800 border border-yellow-100">
                                                    <FileText size={12} className="mt-0.5 flex-shrink-0" />
                                                    <p className="line-clamp-2">{client.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-100 pt-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aktif Talepler</span>
                                                <button
                                                    onClick={() => openAddDemandModal(client)}
                                                    className="text-emerald-600 text-xs font-semibold hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    + Kriter Ekle
                                                </button>
                                            </div>

                                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                                {client.demands.map(d => (
                                                    <div key={d.id} className="bg-slate-50 text-slate-700 text-xs p-2 rounded-lg border border-slate-100 flex items-start gap-2 group/demand hover:border-blue-200 hover:bg-blue-50 transition-colors">
                                                        <Tag size={12} className="mt-0.5 text-slate-400 flex-shrink-0" />
                                                        <div className="flex-1 cursor-pointer" onClick={() => openEditDemandModal(client, d)}>
                                                            <div className="font-medium">
                                                                {d.district && d.neighborhood ? `${d.district} / ${d.neighborhood}` : (d.district || 'Bölge Farketmez')}
                                                            </div>
                                                            <div className="text-slate-500 mt-0.5">
                                                                {d.rooms ? `${d.rooms}, ` : ''}
                                                                {d.max_price ? `${parseInt(d.max_price).toLocaleString()} ₺'ye kadar` : 'Fiyat limitsiz'}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDeleteDemand(d.id)} className="opacity-0 group-hover/demand:opacity-100 text-gray-300 hover:text-red-500">
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {client.demands.length === 0 && (
                                                    <div className="text-center py-2 text-xs text-gray-400 italic bg-gray-50 rounded">
                                                        Henüz talep kriteri girilmedi.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination UI */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pt-4">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${currentPage === i + 1
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors rotate-180"
                                >
                                    <ArrowLeft size={18} />
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
