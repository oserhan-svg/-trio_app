import React from 'react';
import { CalendarDays, Clock, List, Calendar as CalendarIcon, Plus, Settings } from 'lucide-react';

const AgendaHeader = ({
    loading,
    view,
    setView,
    onRefresh,
    onSettingsOpen,
    onNewItem,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    onToday,
    userRole,
    users = [],
    consultantId,
    setConsultantId
}) => {
    return (
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

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ara..."
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-40 md:w-60"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Clock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>

                <select
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">Tüm Türler</option>
                    <option value="meeting">Toplantı</option>
                    <option value="showing">Yer Gösterme</option>
                    <option value="call">Arama</option>
                    <option value="task">Görev</option>
                </select>

                {userRole === 'admin' && (
                    <select
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={consultantId || ''}
                        onChange={(e) => setConsultantId(e.target.value || null)}
                    >
                        <option value="">Tüm Danışmanlar</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                    </select>
                )}

                <button
                    onClick={onToday}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                    Bugün
                </button>

                <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

                <button
                    onClick={onSettingsOpen}
                    className="p-2 text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 rounded-lg hover:border-blue-300"
                    title="Takvim Ayarları"
                >
                    <Settings size={20} />
                </button>
                <button
                    onClick={onRefresh}
                    className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                    title="Yenile"
                >
                    <Clock size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <div className="bg-slate-100 p-1 rounded-lg flex">
                    <button
                        onClick={() => setView('list')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <List size={18} className="inline mr-1" /> Liste
                    </button>
                    <button
                        onClick={() => setView('calendar')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CalendarIcon size={18} className="inline mr-1" /> Takvim
                    </button>
                </div>

                <button
                    onClick={onNewItem}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Yeni</span>
                </button>
            </div>
        </div>
    );
};

export default AgendaHeader;
