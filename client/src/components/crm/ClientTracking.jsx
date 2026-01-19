import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Tag, Phone, Mail, FileText, X, ExternalLink, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import AddClientModal from './AddClientModal';
import AddDemandModal from './AddDemandModal';
import ClientMatchesModal from './ClientMatchesModal';

const ClientTracking = ({ isAddModalOpen, onCloseAddModal }) => {
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
    // const [showAddClient, setShowAddClient] = useState(false); // REMOVED
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
            console.log('Fetching clients...');
            const response = await api.get('/clients');
            console.log('Clients fetched:', response.data);
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
            // setShowAddClient(false); // OLD
            onCloseAddModal(); // NEW
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Toolbar Area */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-lg">

                {/* Search & Filter Bar */}
                <div className="flex flex-1 gap-2 w-full md:w-auto">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="İsim, Telefon veya E-posta..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select
                            className="pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer shadow-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Durum</option>
                            <option value="Active">Aktif</option>
                            <option value="Negotiation">Görüşülüyor</option>
                            <option value="Closed Won">Kazanıldı</option>
                            <option value="Lost">Kaybedildi</option>
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer shadow-sm font-medium text-gray-600"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">Tip: Tümü</option>
                            <option value="buyer">🏠 Alıcı</option>
                            <option value="seller">🔑 Satıcı</option>
                        </select>
                    </div>
                </div>

                {/* Removed Local Button */}
            </div>

            <div className="bg-white min-h-[500px]">
                {/* List - Compact Table View */}
                {loading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-20 border-t border-gray-100">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="text-gray-400" size={24} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Sonuç Bulunamadı</h3>
                        <p className="text-xs text-gray-500 mb-4">Aradığınız kriterlere uygun kayıt yok.</p>
                        {searchTerm || statusFilter !== 'all' ? (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                                Filtreleri Temizle
                            </button>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => onCloseAddModal()}>+ İlk Müşteriyi Ekle</Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 w-64">Müşteri</th>
                                        <th className="px-6 py-3 w-48">İletişim</th>
                                        <th className="px-6 py-3 w-32">Durum</th>
                                        <th className="px-6 py-3">Aktif Talepler</th>
                                        <th className="px-6 py-3 text-right w-40">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedClients.map(client => (
                                        <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                            {/* Name & Type */}
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div
                                                            onClick={() => navigate(`/clients/${client.id}`)}
                                                            className="font-semibold text-gray-900 truncate cursor-pointer hover:text-emerald-600 flex items-center gap-1"
                                                        >
                                                            {client.name}
                                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                                                        </div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            {client.type === 'seller' ? (
                                                                <span className="text-amber-600 flex items-center gap-0.5"><Users size={10} /> Satıcı</span>
                                                            ) : (
                                                                <span className="text-blue-600 flex items-center gap-0.5"><Users size={10} /> Alıcı</span>
                                                            )}
                                                            <span className="text-gray-300">•</span>
                                                            <span>{new Date(client.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-6 py-3 align-top">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                        <Phone size={12} className="text-gray-400" />
                                                        {client.phone || '-'}
                                                    </div>
                                                    {client.email && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate max-w-[150px]" title={client.email}>
                                                            <Mail size={12} />
                                                            {client.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${client.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                        client.status === 'Negotiation' ? 'bg-orange-100 text-orange-700' :
                                                            client.status === 'Closed Won' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {client.status === 'Active' ? 'Aktif' :
                                                        client.status === 'Negotiation' ? 'Görüşülüyor' :
                                                            client.status === 'Closed Won' ? 'Kazanıldı' : client.status}
                                                </span>
                                            </td>

                                            {/* Demands */}
                                            <td className="px-6 py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {client.demands.slice(0, 2).map(d => (
                                                        <span
                                                            key={d.id}
                                                            onClick={() => openEditDemandModal(client, d)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 bg-white text-xs text-gray-600 hover:border-emerald-300 hover:text-emerald-700 cursor-pointer transition-colors max-w-[140px] truncate"
                                                            title={`${d.district} / ${d.neighborhood}`}
                                                        >
                                                            {d.neighborhood || d.district || 'Konum Yok'}
                                                        </span>
                                                    ))}
                                                    {client.demands.length > 2 && (
                                                        <span className="inline-flex items-center px-1.5 py-1 rounded bg-gray-100 text-xs text-gray-500 font-medium">
                                                            +{client.demands.length - 2}
                                                        </span>
                                                    )}
                                                    {client.demands.length === 0 && (
                                                        <button
                                                            onClick={() => openAddDemandModal(client)}
                                                            className="text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1 border border-dashed border-gray-300 px-2 py-1 rounded hover:border-emerald-300 transition-colors"
                                                        >
                                                            <Plus size={12} /> Talep Ekle
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    <button
                                                        onClick={() => openMatchesModal(client)}
                                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                        title="Eşleşmeler"
                                                    >
                                                        <Tag size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openAddDemandModal(client)}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                        title="Yeni Talep Ekle"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                                    <button
                                                        onClick={() => handleDelete(client.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-100">
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-7 h-7 rounded text-xs font-medium transition-all ${currentPage === i + 1
                                                ? 'bg-emerald-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AddClientModal
                isOpen={isAddModalOpen}
                onClose={onCloseAddModal}
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

export default ClientTracking;
