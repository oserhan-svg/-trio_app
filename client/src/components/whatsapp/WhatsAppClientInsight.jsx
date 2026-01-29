import React, { useState, useEffect, useCallback } from 'react';
import { User, MapPin, Home, Banknote, Brain, MessageSquare, ExternalLink, Plus, Info, Sparkles, Send, RefreshCw, Star, Calendar, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AgendaItemModal from '../agenda/AgendaItemModal';

const WhatsAppClientInsight = ({ client, onAddDemand, onOpenCRM, onShareProperty }) => {
    const [activeTab, setActiveTab] = useState('insights'); // 'insights', 'matches', 'agenda', 'chronology'
    const [matches, setMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [agendaItems, setAgendaItems] = useState([]);
    const [loadingAgenda, setLoadingAgenda] = useState(false);
    const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);

    const fetchMatches = useCallback(async () => {
        if (!client?.clientId && !client?.id) return;
        setLoadingMatches(true);
        try {
            const id = client.clientId || client.id;
            const response = await api.get(`/clients/${id}/matches`);
            setMatches(response.data || []);
        } catch (error) {
            console.error('Error fetching matches:', error);
            toast.error('Eşleşen ilanlar yüklenemedi');
        } finally {
            setLoadingMatches(false);
        }
    }, [client]);

    const fetchAgendaItems = useCallback(async () => {
        if (!client?.clientId && !client?.id) return;
        setLoadingAgenda(true);
        try {
            const id = client.clientId || client.id;
            const response = await api.get(`/agenda?client_id=${id}`);
            setAgendaItems(response.data || []);
        } catch (error) {
            console.error('Error fetching agenda:', error);
            toast.error('Ajanda kayıtları yüklenemedi');
        } finally {
            setLoadingAgenda(false);
        }
    }, [client]);

    const handleSaveAgenda = async (formData) => {
        try {
            await api.post('/agenda', {
                ...formData,
                client_id: client.clientId || client.id
            });
            toast.success('Randevu başarıyla oluşturuldu');
            fetchAgendaItems();
        } catch (error) {
            console.error('Error saving agenda item:', error);
            toast.error('Randevu oluşturulamadı');
        }
    };

    useEffect(() => {
        if (activeTab === 'matches') {
            fetchMatches();
        } else if (activeTab === 'agenda') {
            fetchAgendaItems();
        }
    }, [activeTab, fetchMatches, fetchAgendaItems]);

    // Reset tab when client changes
    useEffect(() => {
        setActiveTab('insights');
        setMatches([]);
        setAgendaItems([]);
    }, [client?.id, client?.clientId]);

    if (!client) {
        return (
            <div className="w-80 border-l border-gray-200 bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <User size={32} className="text-gray-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Müşteri Seçilmedi</h3>
                <p className="text-xs text-gray-400">Detayları görmek için bir sohbet seçin.</p>
            </div>
        );
    }

    const demands = client.demands || [];

    return (
        <div className="w-80 border-l border-gray-200 bg-[#f8fafc] flex flex-col h-full overflow-hidden">
            {/* Profile Header */}
            <div className="p-5 bg-white border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-50 shadow-sm flex-shrink-0">
                        {client.profilePic || client.profile_pic_url ? (
                            <img src={client.profilePic || client.profile_pic_url} alt={client.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#dfe3e5]">
                                <User size={24} className="text-white" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{client.name}</h3>
                        <p className="text-[10px] text-gray-500 truncate">{client.phone}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onOpenCRM(client.clientId || client.id)}
                        className="flex-1 bg-gray-50 text-gray-600 h-8 rounded-lg text-[11px] font-bold hover:bg-gray-100 transition flex items-center justify-center gap-1.5"
                    >
                        <ExternalLink size={14} /> CRM
                    </button>
                    <button
                        onClick={() => onAddDemand(client)}
                        className="flex-1 bg-emerald-50 text-emerald-600 h-8 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                    >
                        <Plus size={14} /> Talep
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
                <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all relative ${activeTab === 'insights' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    İçgörüler
                    {activeTab === 'insights' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 animate-in fade-in zoom-in duration-300" />}
                </button>
                <button
                    onClick={() => setActiveTab('matches')}
                    className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all relative flex items-center justify-center gap-1.5 ${activeTab === 'matches' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Eşleşmeler
                    {activeTab === 'matches' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 animate-in fade-in zoom-in duration-300" />}
                    <Sparkles size={12} className={activeTab === 'matches' ? 'text-amber-400' : ''} />
                </button>
                <button
                    onClick={() => setActiveTab('agenda')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-1.5 ${activeTab === 'agenda' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Ajanda
                    {activeTab === 'agenda' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 animate-in fade-in zoom-in duration-300" />}
                </button>
                <button
                    onClick={() => setActiveTab('chronology')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-1.5 ${activeTab === 'chronology' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Kronoloji
                    {activeTab === 'chronology' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 animate-in fade-in zoom-in duration-300" />}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {activeTab === 'insights' ? (
                    <div className="space-y-4">
                        {/* AI Summary Section */}
                        {(client.ai_summary || client.ai_summary_json) && (
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-md animate-in slide-in-from-right-4 duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Brain size={48} />
                                </div>
                                <div className="flex items-center gap-2 mb-2 relative z-10">
                                    <Brain size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Müşteri Özeti</span>
                                </div>
                                <p className="text-xs leading-relaxed opacity-95 relative z-10">
                                    {typeof client.ai_summary === 'string' ? client.ai_summary : (client.ai_summary?.last_summary || 'Müşteri analizi yapılıyor...')}
                                </p>
                            </div>
                        )}

                        {/* Classification & Urgency Dashboard */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Sınıflandırma</span>
                                {client.last_intent_tag === 'consultant' ? (
                                    <div className="flex items-center gap-1.5 text-indigo-600">
                                        <Sparkles size={14} className="flex-shrink-0" />
                                        <span className="text-[11px] font-black uppercase">Trio Danışmanı</span>
                                    </div>
                                ) : client.last_intent_tag === 'agent' || client.ai_classification === 'agent' ? (
                                    <div className="flex items-center gap-1.5 text-amber-600">
                                        <User size={14} className="flex-shrink-0" />
                                        <span className="text-[11px] font-black uppercase">Emlakçı</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                        <CheckCircle size={14} className="flex-shrink-0" />
                                        <span className="text-[11px] font-black uppercase">Müşteri</span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Aciliyet</span>
                                <div className="flex items-end justify-between">
                                    <div className={`text-lg font-black ${client.priority_score > 70 ? 'text-rose-500' : 'text-indigo-500'}`}>
                                        %{client.priority_score || 0}
                                    </div>
                                    <div className="w-12 h-1 bg-gray-100 rounded-full mb-1.5 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${client.priority_score > 70 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${client.priority_score || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Demands Section */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kayıtlı Talepler</h4>
                            {demands.length === 0 ? (
                                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
                                    <Info size={20} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-[11px] text-gray-400 italic">Henüz bir talep kaydı bulunmuyor.</p>
                                </div>
                            ) : (
                                demands.map((demand, idx) => (
                                    <div key={demand.id || idx} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg">
                                                <Home size={14} />
                                            </div>
                                            <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">#{demand.id}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                                <Banknote size={14} className="text-gray-400" />
                                                {demand.max_price ? `${parseFloat(demand.max_price).toLocaleString()} ₺` : 'Bütçe Belirsiz'}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <MapPin size={12} className="text-gray-300" />
                                                    <span className="truncate">{demand.district || 'Bölge Belirsiz'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <MessageSquare size={12} className="text-gray-300" />
                                                    <span>{demand.rooms || 'Oda Belirsiz'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : activeTab === 'matches' ? (
                    /* Matches Tab Content */
                    <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uygun Portföyler ({matches.length})</h4>
                            <button
                                onClick={fetchMatches}
                                disabled={loadingMatches}
                                className="text-gray-400 hover:text-emerald-600 transition"
                            >
                                <RefreshCw size={12} className={loadingMatches ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {loadingMatches ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 h-28 animate-pulse" />
                                ))}
                            </div>
                        ) : matches.length === 0 ? (
                            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                                <Sparkles size={24} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                    Şu an tam eşleşen ilan bulunamadı.<br />
                                    Talepleri güncellemeyi deneyin.
                                </p>
                            </div>
                        ) : (
                            matches.map((property) => (
                                <div key={property.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group border-l-4 border-l-emerald-500">
                                    {property.images && property.images.length > 0 && (
                                        <div className="h-24 w-full overflow-hidden relative">
                                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                %{property.match_quality || 100} Uyumluluk
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <h5 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">{property.title}</h5>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-black text-emerald-600">{parseFloat(property.price).toLocaleString()} ₺</span>
                                            <span className="text-[10px] text-gray-400">{property.district} / {property.rooms}</span>
                                        </div>

                                        <button
                                            onClick={() => onShareProperty(property)}
                                            className="w-full bg-emerald-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Send size={12} /> Paylaş
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : activeTab === 'agenda' ? (
                    /* Agenda Tab Content */
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Etkinlikler ({agendaItems.length})</h4>
                            <button
                                onClick={() => setIsAgendaModalOpen(true)}
                                className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                                <Plus size={10} /> Yeni Randevu
                            </button>
                        </div>

                        {loadingAgenda ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 h-20 animate-pulse" />
                                ))}
                            </div>
                        ) : agendaItems.length === 0 ? (
                            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                                <Calendar size={24} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                    Müşteri ile planlanmış bir<br />randevu bulunmuyor.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {agendaItems.map((item) => (
                                    <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${item.type === 'showing' ? 'bg-purple-50 text-purple-600' :
                                                item.type === 'meeting' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-gray-50 text-gray-600'
                                                }`}>
                                                {item.type === 'showing' ? '🏠 Yer Gösterme' :
                                                    item.type === 'meeting' ? '🤝 Toplantı' :
                                                        item.type === 'call' ? '📞 Arama' : '📝 Görev'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(item.start_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                        </div>
                                        <h5 className="text-xs font-bold text-gray-800 mb-1">{item.title}</h5>
                                        <p className="text-[10px] text-gray-500 line-clamp-2">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Chronology Tab Content */
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 py-2">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Müşteri Yolculuğu</h4>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black">AI ANALİZİ</span>
                        </div>

                        <div className="relative pl-4 ml-2 border-l-2 border-gray-100 space-y-8">
                            {[
                                { stage: 'Initial', label: 'Yeni Kayıt', date: client.created_at || new Date().toISOString(), icon: User, color: 'bg-indigo-500', active: true },
                                { stage: 'Contacted', label: 'İlk İletişim', date: client.lastMessage?.timestamp, icon: MessageSquare, color: 'bg-emerald-500', active: !!client.lastMessage },
                                { stage: 'Showing', label: 'Yer Gösterme', date: null, icon: Home, color: 'bg-amber-500', active: client.demands?.length > 0 },
                                { stage: 'Closing', label: 'Kapanış', date: null, icon: Banknote, color: 'bg-rose-500', active: client.status === 'Closed Won' }
                            ].map((step, i) => (
                                <div key={i} className={`relative pt-0.5 ${step.active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                                    <div className={`absolute -left-[25px] top-0 w-6 h-6 ${step.color} rounded-lg shadow-lg flex items-center justify-center text-white ring-4 ring-white`}>
                                        <step.icon size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-800 tracking-tight">{step.label}</span>
                                        {step.date && (
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                {new Date(step.date).toLocaleDateString('tr-TR')}
                                            </span>
                                        )}
                                        {step.active && i === 1 && (
                                            <div className="mt-2 bg-white/50 border border-gray-100 rounded-lg p-2 text-[10px] font-medium text-slate-600 italic">
                                                "Müşteri ile aktif diyalog kuruldu ve talepler alındı."
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                <Sparkles size={48} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">AI Tahmini</h4>
                                <p className="text-xs font-bold leading-relaxed mb-3">
                                    Müşterinin portföy eşleşme oranı %85. Bu hafta içerisinde bir yer gösterme planlanması satışı hızlandırabilir.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 w-[85%]"></div>
                                    </div>
                                    <span className="text-[10px] font-black">%85</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Status */}
            <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${client.status === 'Closed Won' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">{client.status || 'Aktif'}</span>
                    </div>
                    {client.priority_score > 0 && (
                        <div className="flex items-center gap-1 text-amber-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-[10px] font-bold">Skor: {client.priority_score}</span>
                        </div>
                    )}
                </div>
            </div>

            <AgendaItemModal
                isOpen={isAgendaModalOpen}
                onClose={() => setIsAgendaModalOpen(false)}
                onSave={handleSaveAgenda}
                item={{
                    client_id: client.clientId || client.id,
                    start_at: new Date().toISOString()
                }}
            />
        </div>
    );
};

export default WhatsAppClientInsight;
