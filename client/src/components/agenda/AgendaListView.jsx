import React from 'react';
import { CheckCircle2, Circle, Clock, User, Globe, Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react';

const AgendaListView = ({
    loading,
    items,
    sortedDates,
    groupedItems,
    user,
    onStatusToggle,
    onEdit,
    onDelete,
    onOpenModal,
    getTypeEmoji,
    formatDate,
    formatTime
}) => {
    if (loading && items.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-3">
                        <div className="flex items-center gap-2 ml-2">
                            <div className="w-2 h-2 bg-slate-200 rounded-full animate-pulse"></div>
                            <div className="w-32 h-4 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-slate-100 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="w-1/2 h-5 bg-slate-100 rounded animate-pulse"></div>
                                <div className="w-1/3 h-4 bg-slate-50 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <CalendarIcon size={48} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-slate-500 font-bold">Henüz Randevu Yok</h3>
                <p className="text-slate-400 text-sm mt-1">Yeni bir randevu veya görev ekleyerek başlayın.</p>
                <button
                    onClick={() => onOpenModal()}
                    className="mt-6 text-blue-600 font-bold hover:underline"
                >
                    + Yeni Randevu Oluştur
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {sortedDates.map(dateKey => (
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
                                    onClick={() => !item.is_external && onStatusToggle(item)}
                                    disabled={item.is_external}
                                    className={`flex-shrink-0 transition-colors ${item.status === 'completed' ? 'text-emerald-500' : 'text-slate-300'} ${!item.is_external ? 'hover:text-blue-500' : 'cursor-default'}`}
                                >
                                    {item.status === 'completed' ? <CheckCircle2 size={24} /> : (item.is_external ? <div className="w-6 h-6 flex items-center justify-center"><CalendarIcon size={20} className="text-blue-400" /></div> : <Circle size={24} />)}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.type === 'meeting' ? 'bg-purple-100 text-purple-700' :
                                                item.type === 'showing' ? 'bg-orange-100 text-orange-700' :
                                                    item.type === 'call' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.type === 'meeting' ? 'Toplantı' :
                                                item.type === 'showing' ? 'Sunum' :
                                                    item.type === 'call' ? 'Arama' :
                                                        item.type === 'task' ? 'Görev' : 'Not'}
                                        </span>
                                        <h4 className={`font-bold truncate text-slate-900 ${item.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                                            {item.title}
                                        </h4>
                                        {item.is_global && (
                                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded border border-blue-100 flex items-center gap-1">
                                                <Globe size={10} /> Ortak
                                            </span>
                                        )}
                                        {(item.is_external || item.google_event_id) && (
                                            <span className="px-1.5 py-0.5 bg-white text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200 flex items-center gap-1 shadow-sm">
                                                <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" className="w-3 h-3" alt="Google" />
                                                Google
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
                                    <div className="mt-2 text-[10px] text-slate-400 font-medium italic">
                                        {item.is_external ? 'Google Takvim Etkinliği' : `Oluşturan: ${item.user.email} ${item.user.id === user?.id ? '(Siz)' : ''}`}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!item.is_external && (
                                        <>
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(item.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                    {item.is_external && (
                                        <span className="text-[10px] text-slate-300 font-bold px-2 py-1 bg-slate-50 rounded italic">Salt Okunur</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AgendaListView;
