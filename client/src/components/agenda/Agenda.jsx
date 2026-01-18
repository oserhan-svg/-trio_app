import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Globe, Lock, CheckCircle2, Circle, MoreVertical, Edit2, Trash2, CalendarDays } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AgendaItemModal from './AgendaItemModal';

const Agenda = () => {
    const [view, setView] = useState('list'); // 'list' or 'calendar'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [user] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        fetchAgendaItems();
    }, []);

    const fetchAgendaItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/agenda');
            setItems(res.data);
        } catch (error) {
            console.error('Error fetching agenda', error);
            toast.error('Ajanda verileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        try {
            if (selectedItem) {
                await api.put(`/agenda/${selectedItem.id}`, formData);
                toast.success('Randevu başarıyla güncellendi.');
            } else {
                await api.post('/agenda', formData);
                toast.success('Randevu başarıyla oluşturuldu.');
            }
            fetchAgendaItems();
        } catch (error) {
            console.error('Error saving agenda item', error);
            toast.error('Randevu kaydedilemedi.');
            throw error;
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) return;
        try {
            await api.delete(`/agenda/${id}`);
            toast.success('Randevu silindi.');
            fetchAgendaItems();
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Silme işlemi başarısız.');
        }
    };

    const toggleStatus = async (item) => {
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';
        try {
            await api.put(`/agenda/${item.id}`, { status: newStatus });
            fetchAgendaItems();
        } catch (error) {
            toast.error('Durum güncellenemedi.');
        }
    };

    const getTypeEmoji = (type) => {
        switch (type) {
            case 'meeting': return '🤝';
            case 'call': return '📞';
            case 'showing': return '🏠';
            case 'note': return '📌';
            default: return '📝';
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    // Group items by date for the list view
    const groupedItems = items.reduce((acc, item) => {
        const dateKey = new Date(item.start_at).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedItems).sort((a, b) => new Date(a) - new Date(b));

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Çalışma Ajandası</h2>
                        <p className="text-sm text-gray-500">Görevler ve randevu planlaması.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex mr-2">
                        <button
                            onClick={() => setView('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List size={18} className="inline mr-1" /> Liste
                        </button>
                        <button
                            disabled // Placeholder for calendar logic if needed, but we'll focus on the requested collaborative list first
                            className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 cursor-not-allowed"
                        >
                            <CalendarIcon size={18} className="inline mr-1" /> Takvim
                        </button>
                    </div>

                    <button
                        onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-200"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Yeni Ekle</span>
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="space-y-8 pb-10">
                {loading ? (
                    <div className="text-center py-20 text-slate-400">Yükleniyor...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <CalendarIcon size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-slate-500 font-bold">Henüz Randevu Yok</h3>
                        <p className="text-slate-400 text-sm mt-1">Yeni bir randevu veya görev ekleyerek başlayın.</p>
                        <button
                            onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                            className="mt-6 text-blue-600 font-bold hover:underline"
                        >
                            + Yeni Randevu Oluştur
                        </button>
                    </div>
                ) : (
                    sortedDates.map(dateKey => (
                        <div key={dateKey} className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                {formatDate(groupedItems[dateKey][0].start_at)}
                            </h3>
                            <div className="grid gap-3">
                                {groupedItems[dateKey].map(item => (
                                    <div
                                        key={item.id}
                                        className={`group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md hover:border-blue-100 ${item.status === 'completed' ? 'opacity-75' : ''}`}
                                    >
                                        <button
                                            onClick={() => toggleStatus(item)}
                                            className={`flex-shrink-0 transition-colors ${item.status === 'completed' ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}
                                        >
                                            {item.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xl">{getTypeEmoji(item.type)}</span>
                                                <h4 className={`font-bold truncate text-slate-900 ${item.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                                                    {item.title}
                                                </h4>
                                                {item.is_global && (
                                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded border border-blue-100 flex items-center gap-1">
                                                        <Globe size={10} /> Ortak
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                                <div className="text-slate-500 font-bold flex items-center gap-1">
                                                    <Clock size={14} className="text-blue-500" />
                                                    {formatTime(item.start_at)}
                                                </div>
                                                {item.client && (
                                                    <div className="text-slate-500 flex items-center gap-1">
                                                        <User size={14} className="text-orange-400" />
                                                        {item.client.name}
                                                    </div>
                                                )}
                                                {item.description && (
                                                    <div className="text-slate-400 italic truncate max-w-xs">{item.description}</div>
                                                )}
                                            </div>
                                            {/* meta info */}
                                            <div className="mt-2 text-[10px] text-slate-400 font-medium">
                                                Oluşturan: {item.user.email} {item.user.id === user?.id ? '(Siz)' : ''}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AgendaItemModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
                onSave={handleSave}
                item={selectedItem}
            />
        </div>
    );
};

export default Agenda;
