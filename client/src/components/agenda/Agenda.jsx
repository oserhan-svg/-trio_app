import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Globe, Lock, CheckCircle2, Circle, MoreVertical, Edit2, Trash2, CalendarDays } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AgendaItemModal from './AgendaItemModal';
import CalendarSettingsModal from './CalendarSettingsModal';
import MonthView from './MonthView';

// Internal Error Boundary for debugging
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("Agenda Error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-center">
                    <h2 className="text-red-600 font-bold mb-4">Bir şeyler ters gitti!</h2>
                    <pre className="mt-2 text-xs bg-gray-100 p-4 rounded text-left overflow-auto max-w-lg mx-auto border border-red-200 text-red-800">
                        {this.state.error?.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg">Sayfayı Yenile</button>
                </div>
            );
        }
        return this.props.children;
    }
}

import AgendaHeader from './AgendaHeader';
import AgendaListView from './AgendaListView';

const Agenda = () => {
    const [view, setView] = useState('list'); // 'list' or 'calendar'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [user] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [consultantId, setConsultantId] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);

    useEffect(() => {
        fetchAgendaItems();
    }, [currentDate, filterType, filterStatus, consultantId]); // Re-fetch on filters change

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };

    const fetchAgendaItems = async () => {
        setLoading(true);
        try {
            // Get start and end of current month for the API call
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

            const params = {
                start: startOfMonth.toISOString(),
                end: endOfMonth.toISOString(),
                type: filterType,
                status: filterStatus,
                user_id: consultantId
            };

            const res = await api.get('/agenda', { params });
            setItems(Array.isArray(res.data) ? res.data : []);
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
            case 'google_event': return '🗓️';
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

    // Filter items based on search query (local filter for instant feedback)
    const filteredItems = React.useMemo(() => {
        if (!searchQuery) return items;
        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            item.title.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            (item.client && item.client.name.toLowerCase().includes(query))
        );
    }, [items, searchQuery]);

    // Group items by date for the list view
    const groupedItems = React.useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            const dateKey = new Date(item.start_at).toDateString();
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(item);
            return acc;
        }, {});
    }, [filteredItems]);

    const sortedDates = React.useMemo(() => {
        return Object.keys(groupedItems).sort((a, b) => new Date(a) - new Date(b));
    }, [groupedItems]);

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <ErrorBoundary>
            <div className="max-w-5xl mx-auto space-y-6">
                <AgendaHeader
                    loading={loading}
                    view={view}
                    setView={setView}
                    onRefresh={fetchAgendaItems}
                    onSettingsOpen={() => setIsSettingsOpen(true)}
                    onNewItem={() => { setSelectedItem(null); setIsModalOpen(true); }}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    onToday={handleToday}
                    userRole={user?.role}
                    users={users}
                    consultantId={consultantId}
                    setConsultantId={setConsultantId}
                />

                <div className="pb-10">
                    {view === 'calendar' ? (
                        <MonthView
                            items={items}
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            onItemClick={(item) => { setSelectedItem(item); setIsModalOpen(true); }}
                            onSlotClick={(date) => {
                                const defaultStart = new Date(date);
                                defaultStart.setHours(9, 0, 0, 0);
                                setSelectedItem({ start_at: defaultStart.toISOString(), title: '', type: 'meeting' });
                                setIsModalOpen(true);
                            }}
                        />
                    ) : (
                        <AgendaListView
                            loading={loading}
                            items={filteredItems}
                            sortedDates={sortedDates}
                            groupedItems={groupedItems}
                            user={user}
                            onStatusToggle={toggleStatus}
                            onEdit={(item) => { setSelectedItem(item); setIsModalOpen(true); }}
                            onDelete={handleDelete}
                            onOpenModal={() => { setSelectedItem(null); setIsModalOpen(true); }}
                            getTypeEmoji={getTypeEmoji}
                            formatDate={formatDate}
                            formatTime={formatTime}
                        />
                    )}
                </div>

                <CalendarSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />

                <AgendaItemModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
                    onSave={handleSave}
                    item={selectedItem}
                />
            </div>
        </ErrorBoundary>
    );
};

export default Agenda;
