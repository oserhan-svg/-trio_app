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
    const pageSize = 15; // Show 15 rows per page (Ultra Compact)

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

            if (Array.isArray(response.data)) {
                setClients(response.data);
                setFilteredClients(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                // Handle paginated response just in case
                setClients(response.data.data);
                setFilteredClients(response.data.data);
            } else {
                console.error('Unexpected response format:', response.data);
                addToast('Beklenmedik veri formatı.', 'error');
            }

        } catch (error) {
            console.error('Error fetching clients:', error);
            addToast('Müşteriler yüklenemedi: ' + (error.response?.data?.error || error.message), 'error');
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

    // Derived Stats
    const totalClients = clients.length;
    const activeBuyers = clients.filter(c => (c.type === 'buyer' || !c.type) && c.status === 'Active').length;
    const activeSellers = clients.filter(c => c.type === 'seller' && c.status === 'Active').length;
    const newThisMonth = clients.filter(c => {
        const date = new Date(c.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return (
        <div className="space-y-6">
            {/* KPI Stats Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">Toplam Müşteri</div>
                    <div className="text-2xl font-bold text-gray-900">{totalClients}</div>
                    <div className="text-xs text-gray-400 mt-1">Portföy Geneli</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-blue-500">
                    <div className="text-blue-600 text-xs font-medium mb-1 uppercase tracking-wider">Aktif Alıcılar</div>
                    <div className="text-2xl font-bold text-gray-900">{activeBuyers}</div>
                    <div className="text-xs text-gray-400 mt-1">Sıcak Müşteriler</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-amber-500">
                    <div className="text-amber-600 text-xs font-medium mb-1 uppercase tracking-wider">Aktif Satıcılar</div>
                    <div className="text-2xl font-bold text-gray-900">{activeSellers}</div>
                    <div className="text-xs text-gray-400 mt-1">Portföy Kaynakları</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-emerald-500">
                    <div className="text-emerald-600 text-xs font-medium mb-1 uppercase tracking-wider">Yeni (Bu Ay)</div>
                    <div className="text-2xl font-bold text-gray-900">{newThisMonth}</div>
                    <div className="text-xs text-gray-400 mt-1">Büyüme Hızı</div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Toolbar Area - Refined */}
                <div className="p-3 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center bg-white rounded-t-lg">

                    {/* Left: Search & Filters */}
                    <div className="flex flex-1 gap-2 w-full md:w-auto items-center">
                        {/* Search */}
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Müşteri ara..."
                                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                    className="pl-2 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-gray-700 hover:bg-gray-100 transition-colors"
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
                            <div className="relative">
                                <select
                                    className="pl-2 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-gray-700 hover:bg-gray-100 transition-colors"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <option value="all">Tüm Tipler</option>
                                    <option value="buyer">🏠 Alıcı</option>
                                    <option value="seller">🔑 Satıcı</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div>
                        {/* Button handled by parent via prop mostly, but we can put clear filters here if needed */}
                        {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
                                className="text-xs text-gray-500 hover:text-red-500 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors mr-2"
                            >
                                Filtreleri Temizle
                            </button>
                        )}
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
                                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 text-xs">
                                    <tr>
                                        <th className="px-3 py-2 w-56">Müşteri</th>
                                        <th className="px-3 py-2 w-40">İletişim</th>
                                        <th className="px-3 py-2 w-28">Durum</th>
                                        <th className="px-3 py-2">Aktif Talepler</th>
                                        <th className="px-3 py-2 text-right w-28">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedClients.map(client => (
                                        <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                            {/* Name & Type - Compact */}
                                            <td className="px-3 py-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div
                                                            onClick={() => navigate(`/clients/${client.id}`)}
                                                            className="font-semibold text-gray-900 truncate cursor-pointer hover:text-emerald-600 flex items-center gap-1 text-sm leading-tight"
                                                        >
                                                            {client.name}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 leading-tight mt-0.5">
                                                            {client.type === 'seller' ? (
                                                                <span className="text-amber-600">Satıcı</span>
                                                            ) : (
                                                                <span className="text-blue-600">Alıcı</span>
                                                            )}
                                                            <span>•</span>
                                                            <span>{new Date(client.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact - Compact */}
                                            <td className="px-3 py-1.5 align-middle">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-gray-700 font-medium text-xs">
                                                        <Phone size={10} className="text-gray-400" />
                                                        {client.phone || '-'}
                                                    </div>
                                                    {client.email && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 truncate max-w-[140px]" title={client.email}>
                                                            <Mail size={10} />
                                                            {client.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status - Compact Badge */}
                                            <td className="px-3 py-1.5 align-middle">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${client.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    client.status === 'Negotiation' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                        client.status === 'Closed Won' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}>
                                                    {client.status === 'Active' ? 'Aktif' :
                                                        client.status === 'Negotiation' ? 'Görüşülüyor' :
                                                            client.status === 'Closed Won' ? 'Kazanıldı' : client.status}
                                                </span>
                                            </td>

                                            {/* Demands - Tags */}
                                            <td className="px-3 py-1.5 align-middle">
                                                <div className="flex flex-wrap gap-1">
                                                    {client.demands.slice(0, 3).map(d => (
                                                        <span
                                                            key={d.id}
                                                            onClick={() => openEditDemandModal(client, d)}
                                                            className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] text-gray-600 hover:border-emerald-300 hover:text-emerald-700 cursor-pointer transition-colors max-w-[120px] truncate"
                                                            title={`${d.district} / ${d.neighborhood}`}
                                                        >
                                                            {d.neighborhood || d.district || '?'}
                                                        </span>
                                                    ))}
                                                    {client.demands.length > 3 && (
                                                        <span className="inline-flex items-center px-1 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-medium">
                                                            +{client.demands.length - 3}
                                                        </span>
                                                    )}
                                                    {client.demands.length === 0 && (
                                                        <button
                                                            onClick={() => openAddDemandModal(client)}
                                                            className="text-[10px] text-gray-400 hover:text-emerald-600 flex items-center gap-1 border border-dashed border-gray-300 px-1.5 py-0.5 rounded hover:border-emerald-300 transition-colors opacity-60 hover:opacity-100"
                                                        >
                                                            <Plus size={10} /> Ekle
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions - Compact */}
                                            <td className="px-3 py-1.5 text-right align-middle">
                                                <div className="flex justify-end items-center gap-0.5">
                                                    <button
                                                        onClick={() => openMatchesModal(client)}
                                                        className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                        title="Eşleşmeler"
                                                    >
                                                        <Tag size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => openAddDemandModal(client)}
                                                        className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                        title="Yeni Talep Ekle"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client.id)}
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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

                        {totalPages > 1 && (
                            <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                                <div className="text-xs text-gray-400">
                                    Toplam {filteredClients.length} kayıt
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-6 h-6 rounded text-xs font-medium transition-all ${currentPage === i + 1
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-white hover:shadow-sm'
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
