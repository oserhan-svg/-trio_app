import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Tag, Phone, Mail, FileText, X, ExternalLink, Search, Filter, Sparkles, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socketService from '../../services/socket';
import Button from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import AddClientModal from './AddClientModal';
import AddDemandModal from './AddDemandModal';
import ClientMatchesModal from './ClientMatchesModal';
import ClientAIDigestModal from './ClientAIDigestModal';
import ClientStrategyCard from './ClientStrategyCard';

const ClientTracking = ({ isAddModalOpen, onOpenAddModal, onCloseAddModal }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [clients, setClients] = useState([]);

    // Real-time Socket Integration
    useEffect(() => {
        socketService.connect();

        const refresh = () => fetchClients();

        socketService.on('client:new', refresh);
        socketService.on('client:updated', refresh);
        socketService.on('client:deleted', refresh);

        return () => {
            socketService.off('client:new', refresh);
            socketService.off('client:updated', refresh);
            socketService.off('client:deleted', refresh);
        };
    }, []);

    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'buyer', 'seller'

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15; // Show 15 rows per page (Ultra Compact)

    // Modals
    const [showAddClient, setShowAddClient] = useState(false);
    const [showAddDemand, setShowAddDemand] = useState(false);
    const [showMatches, setShowMatches] = useState(false);
    const [showAIDigest, setShowAIDigest] = useState(false);

    // Selection state
    const [selectedClientForDemand, setSelectedClientForDemand] = useState(null);
    const [selectedDemandToEdit, setSelectedDemandToEdit] = useState(null);
    const [selectedClientForMatches, setSelectedClientForMatches] = useState(null);
    const [selectedClientForAIDigest, setSelectedClientForAIDigest] = useState(null);
    const [selectedClientForStrategy, setSelectedClientForStrategy] = useState(null);
    const [showStrategy, setShowStrategy] = useState(false);

    const [totalClientsCount, setTotalClientsCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [globalStats, setGlobalStats] = useState({ activeBuyers: 0, activeSellers: 0, newThisMonth: 0 });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, typeFilter]);

    useEffect(() => {
        fetchClients();
    }, [searchTerm, statusFilter, typeFilter, currentPage]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                status: statusFilter,
                type: typeFilter,
                page: currentPage,
                limit: pageSize
            });
            const response = await api.get(`/clients?${params.toString()}`);

            if (response.data && response.data.data) {
                setClients(response.data.data);
                setTotalClientsCount(response.data.total);
                setTotalPages(response.data.totalPages);
                if (response.data.stats) {
                    setGlobalStats(response.data.stats);
                }
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            addToast('Müşteriler yüklenemedi: ' + (error.response?.data?.details || error.response?.data?.error || error.message), 'error');
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

    const openAIDigestModal = (client) => {
        setSelectedClientForAIDigest(client);
        setShowAIDigest(true);
    };

    const openStrategyModal = (client) => {
        setSelectedClientForStrategy(client);
        setShowStrategy(true);
    };

    // Aggregated Stats from Server
    const activeBuyers = globalStats.activeBuyers;
    const activeSellers = globalStats.activeSellers;
    const newThisMonth = globalStats.newThisMonth;

    return (
        <div className="space-y-6">
            {/* KPI Stats Widgets - Premium Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard label="Toplam Müşteri" value={totalClientsCount} desc="Portföy Geneli" color="slate" />
                <StatCard label="Aktif Alıcılar" value={activeBuyers} desc="Sıcak Müşteriler" color="blue" />
                <StatCard label="Aktif Satıcılar" value={activeSellers} desc="Portföy Kaynakları" color="amber" />
                <StatCard label="Yeni (Bu Ay)" value={newThisMonth} desc="Büyüme Hızı" color="emerald" />
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                {/* Toolbar Area - Dashboard Style */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
                    <div className="flex flex-1 gap-3 w-full md:w-auto items-center">
                        <div className="relative flex-1 max-w-sm">
                            <input
                                type="text"
                                placeholder="İsim, telefon veya e-posta ile ara..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                className="modern-select-alt"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="Active">Aktif</option>
                                <option value="Negotiation">Görüşülüyor</option>
                                <option value="Closed Won">Kazanıldı</option>
                                <option value="Lost">Kaybedildi</option>
                            </select>
                            <select
                                className="modern-select-alt"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">Tüm Tipler</option>
                                <option value="buyer">🏠 Alıcı</option>
                                <option value="seller">🔑 Satıcı</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
                                className="text-xs font-black text-rose-500 uppercase tracking-widest px-3 py-2 hover:bg-rose-50 rounded-xl transition-all"
                            >
                                Temizle
                            </button>
                        )}
                        <button
                            onClick={() => setShowAddClient(true)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-100"
                        >
                            <Plus size={18} /> Yeni Müşteri
                        </button>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .modern-select-alt {
                        background-color: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 0.75rem;
                        padding: 0.5rem 2rem 0.5rem 0.75rem;
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: #475569;
                        transition: all 0.2s;
                        cursor: pointer;
                        appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 0.5rem center;
                        background-size: 1rem;
                    }
                    .modern-select-alt:focus {
                        border-color: #3b82f6;
                        background-color: white;
                        outline: none;
                    }
                ` }} />
            </div>

            <div className="bg-white min-h-[500px] border-t border-slate-100">
                {/* List - Premium Table View */}
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 w-72">Müşteri Profili</th>
                                    <th className="px-6 py-4 w-48">İletişim Kanalı</th>
                                    <th className="px-6 py-4 w-32">Mevcut Durum</th>
                                    <th className="px-6 py-4">Öncelikli Talepler</th>
                                    <th className="px-6 py-4 text-right w-36 pr-10">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-2xl"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-slate-100 rounded"></div>
                                                    <div className="h-3 w-20 bg-slate-50 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="h-4 w-24 bg-slate-100 rounded-lg"></div>
                                                <div className="h-3 w-32 bg-slate-50 rounded"></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 w-20 bg-slate-100 rounded-xl"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1.5">
                                                <div className="h-6 w-16 bg-slate-50 rounded-lg"></div>
                                                <div className="h-6 w-16 bg-slate-50 rounded-lg"></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="text-center py-24 border-t border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Müşteri Bulunamadı</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6">Aradığınız kriterlere uygun kayıt yok.</p>
                        {searchTerm || statusFilter !== 'all' ? (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                className="text-blue-600 hover:text-blue-700 text-sm font-black uppercase tracking-widest px-4 py-2 bg-blue-50 rounded-xl transition-all"
                            >
                                Filtreleri Sıfırla
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAddClient(true)}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200"
                            >
                                + İlk Müşteriyi Ekle
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 w-72">Müşteri Profili</th>
                                        <th className="px-6 py-4 w-48">İletişim Kanalı</th>
                                        <th className="px-6 py-4 w-32">Mevcut Durum</th>
                                        <th className="px-6 py-4">Öncelikli Talepler</th>
                                        <th className="px-6 py-4 text-right w-36 pr-10">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {clients.map(client => (
                                        <tr key={client.id} className="hover:bg-slate-50/50 transition-all duration-200 group">
                                            {/* Name & Type - Compact */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-black text-sm ring-2 ring-white shadow-sm transition-transform group-hover:scale-110">
                                                        {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div
                                                            onClick={() => navigate(`/clients/${client.id}`)}
                                                            className="font-bold text-slate-800 text-sm tracking-tight cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1"
                                                        >
                                                            {client.name}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                                            {client.type === 'seller' ? (
                                                                <span className="text-amber-600">SATICI</span>
                                                            ) : (
                                                                <span className="text-blue-600">ALICI</span>
                                                            )}
                                                            <span className="text-slate-200">•</span>
                                                            <span>Kayıt: {new Date(client.created_at).toLocaleDateString()}</span>
                                                            {client.priority_score > 50 && (
                                                                <>
                                                                    <span className="text-slate-200">•</span>
                                                                    <span className="text-rose-500 font-black animate-pulse">🔥 {client.priority_score} Puan</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact - Compact */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs ring-1 ring-slate-100 px-2 py-1 rounded-lg bg-slate-50/50 w-fit">
                                                        <Phone size={12} className="text-slate-400" />
                                                        {client.phone || '-'}
                                                    </div>
                                                    {client.email && (
                                                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 px-2 truncate max-w-[180px]" title={client.email}>
                                                            <Mail size={12} />
                                                            {client.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status - Compact Badge */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white shadow-sm ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
                                                    client.status === 'Negotiation' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' :
                                                        client.status === 'Closed Won' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' :
                                                            'bg-slate-50 text-slate-500 ring-1 ring-slate-100'
                                                    }`}>
                                                    {client.status === 'Active' ? 'AKTİF' :
                                                        client.status === 'Negotiation' ? 'GÖRÜŞÜLÜYOR' :
                                                            client.status === 'Closed Won' ? 'KAZANILDI' : client.status.toUpperCase()}
                                                </span>
                                                {client.last_sentiment && (
                                                    <div className="mt-1 flex items-center gap-1">
                                                        {client.last_sentiment === 'urgent' && <span className="text-rose-500 text-[10px] font-bold">🚨 Acil</span>}
                                                        {client.last_sentiment === 'excited' && <span className="text-emerald-500 text-[10px] font-bold">🤩 Heyecanlı</span>}
                                                        {client.last_sentiment === 'frustrated' && <span className="text-amber-600 text-[10px] font-bold">😠 Memnuniyetsiz</span>}
                                                        {client.last_sentiment === 'hesitant' && <span className="text-indigo-500 text-[10px] font-bold">🤔 Kararsız</span>}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Demands - Tags */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {client.demands.slice(0, 3).map(d => (
                                                        <span
                                                            key={d.id}
                                                            onClick={(e) => { e.stopPropagation(); openEditDemandModal(client, d); }}
                                                            className="inline-flex items-center px-2 py-1 rounded-lg border border-slate-100 bg-white text-[10px] font-bold text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:shadow-sm cursor-pointer transition-all max-w-[140px] truncate"
                                                            title={`${d.district} / ${d.neighborhood}`}
                                                        >
                                                            {d.neighborhood || d.district || '?'}
                                                        </span>
                                                    ))}
                                                    {client.demands.length > 3 && (
                                                        <span className="inline-flex items-center px-1.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
                                                            +{client.demands.length - 3}
                                                        </span>
                                                    )}
                                                    {client.demands.length === 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openAddDemandModal(client); }}
                                                            className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1 border border-dashed border-slate-300 px-2 py-1 rounded-lg hover:border-blue-300 transition-all opacity-70 hover:opacity-100 uppercase tracking-widest"
                                                        >
                                                            <Plus size={10} /> Talep Ekle
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions - Compact */}
                                            <td className="px-6 py-4 text-right pr-6">
                                                <div className="flex justify-end items-center gap-1 opacity-60 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => openAIDigestModal(client)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="AI Portföy Özeti"
                                                        disabled={client.demands.length === 0}
                                                    >
                                                        <Sparkles size={16} className={client.demands.length > 0 ? 'text-blue-500' : ''} />
                                                    </button>
                                                    <button
                                                        onClick={() => openStrategyModal(client)}
                                                        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                                                        title="Takip Stratejisi (AI)"
                                                    >
                                                        <Brain size={16} className="text-violet-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => openMatchesModal(client)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Akıllı Eşleşmeler"
                                                    >
                                                        <Tag size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openAddDemandModal(client)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Ekle"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
                            <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                                <div className="text-xs text-gray-400">
                                    Toplam {totalClientsCount} kayıt
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

            <ClientAIDigestModal
                isOpen={showAIDigest}
                onClose={() => setShowAIDigest(false)}
                client={selectedClientForAIDigest}
            />

            <ClientStrategyCard
                isOpen={showStrategy}
                onClose={() => setShowStrategy(false)}
                client={selectedClientForStrategy}
            />
        </div>
    );
};

const StatCard = ({ label, value, desc, color }) => {
    const colors = {
        slate: 'bg-slate-50 border-slate-200 text-slate-800 border-b-slate-400',
        blue: 'bg-blue-50/30 border-blue-100 text-blue-700 border-b-blue-500',
        amber: 'bg-amber-50/30 border-amber-100 text-amber-700 border-b-amber-500',
        emerald: 'bg-emerald-50/30 border-emerald-100 text-emerald-700 border-b-emerald-500'
    };

    return (
        <div className={`p-5 rounded-2xl border-2 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] border-b-4 ${colors[color] || colors.slate}`}>
            <div className="text-[10px] font-black uppercase tracking-[0.1em] mb-1.5 opacity-60">{label}</div>
            <div className="text-3xl font-black tracking-tight">{value}</div>
            <div className="text-[10px] font-bold mt-1 opacity-40 uppercase tracking-widest">{desc}</div>
        </div>
    );
};

export default ClientTracking;
