import React from 'react';
import { User, Users, RefreshCw, MessageCircle, MoreVertical, Search, CheckCircle, Image as ImageIcon, Mic, Brain, Activity, Clock, ShieldAlert } from 'lucide-react';

const ContactItem = React.memo(({ conv, selectedChat, setSelectedChat, formatTime }) => {
    const isGroup = conv.phone?.endsWith('@g.us');
    const priorityColor = conv.priority_score > 70 ? '#ef4444' : conv.priority_score > 40 ? '#f59e0b' : '#10b981';
    const priorityLabel = conv.priority_score > 70 ? 'Yüksek' : conv.priority_score > 40 ? 'Orta' : 'Düşük';

    // Parse potential tags (could be JSON or comma separated string)
    const tags = Array.isArray(conv.tags) ? conv.tags : (typeof conv.tags === 'string' ? conv.tags.split(',') : []);

    return (
        <div
            onClick={() => setSelectedChat(conv.phone)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-300 relative group border-b border-gray-50/50 ${selectedChat === conv.phone ? 'bg-[#f0f2f5] shadow-inner' : 'hover:bg-gray-50'}`}
        >
            {/* Priority Indicator Bar with Micro-animation */}
            <div
                className={`absolute left-0 top-1 bottom-1 w-1.5 rounded-r-full transition-all duration-500 group-hover:w-2 ${selectedChat === conv.phone ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}
                style={{ backgroundColor: priorityColor }}
                title={`Öncelik: ${priorityLabel} (${conv.priority_score})`}
            />

            <div className="w-[52px] h-[52px] rounded-2xl overflow-hidden flex-shrink-0 bg-white shadow-sm border border-gray-100 transition-transform group-hover:scale-105 duration-300">
                {(conv.profilePic || conv.profilePicUrl || conv.profile_pic_url) ? (
                    <img
                        src={conv.profilePic || conv.profilePicUrl || conv.profile_pic_url}
                        alt={conv.name || 'Chat'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
                    style={{ display: (conv.profilePic || conv.profilePicUrl || conv.profile_pic_url) ? 'none' : 'flex' }}
                >
                    {isGroup ? <Users size={24} className="text-gray-400" /> : <User size={24} className="text-gray-400" />}
                </div>
            </div>

            <div className="flex-1 min-w-0 py-0.5 h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-bold text-slate-800 truncate text-[15px] leading-5 flex items-center gap-2">
                        {isGroup && <Users size={13} className="text-slate-400" />}
                        {conv.last_sentiment === 'urgent' && <span className="animate-pulse">🚨</span>}
                        {conv.last_sentiment === 'excited' && <span>🤩</span>}
                        {conv.last_sentiment === 'frustrated' && <span>😠</span>}
                        {conv.last_sentiment === 'hesitant' && <span>🤔</span>}
                        <span className="truncate">{conv.name || conv.partner || conv.phone || 'Bilinmeyen'}</span>
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1">
                        {conv.ai_summary && (
                            <div className="relative group/brain">
                                <Brain size={12} className="text-indigo-400 animate-pulse" />
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/brain:opacity-100 transition-opacity pointer-events-none z-50">
                                    {conv.ai_summary.last_summary || "AI Hafızası Mevcut"}
                                </div>
                            </div>
                        )}
                        {formatTime(conv.lastMessage.timestamp)}
                    </span>
                </div>

                {/* Visual Tags and Status Icons Row */}
                <div className="flex items-center gap-1 mt-0.5 mb-1 h-4 overflow-hidden">
                    {conv.last_intent_tag && (
                        <span className="text-[8px] bg-rose-50 text-rose-600 px-1 py-0 rounded font-black border border-rose-100 whitespace-nowrap uppercase tracking-tighter">
                            {conv.last_intent_tag}
                        </span>
                    )}
                    {tags.length > 0 && tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-[8px] bg-gray-50 text-gray-500 px-1 py-0 rounded font-bold border border-gray-100 whitespace-nowrap uppercase tracking-tighter">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex justify-between items-center">
                    <p className="text-[13px] text-slate-500 truncate leading-5 flex-1 pr-2 flex items-center font-medium">
                        {conv.lastMessage.from === 'system' && (
                            <CheckCircle size={13} className="inline mr-1 text-blue-500" />
                        )}
                        {conv.lastMessage.media_type === 'image' && <ImageIcon size={13} className="mr-1 opacity-70" />}
                        {conv.lastMessage.media_type === 'audio' && <Mic size={13} className="mr-1 opacity-70" />}
                        <span className="truncate opacity-80 font-normal">{conv.lastMessage.content || (conv.lastMessage.media_type ? 'Medya' : '')}</span>
                    </p>
                    {conv.unreadCount > 0 && (
                        <div className="bg-emerald-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-lg flex items-center justify-center px-1 shadow-lg shadow-emerald-200 animate-in zoom-in">
                            {conv.unreadCount}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const WhatsAppSidebar = React.memo(({
    conversations,
    selectedChat,
    setSelectedChat,
    searchTerm,
    setSearchTerm,
    syncAllConversations,
    handleHardReset,
    startBulkDiscovery,
    fetchDiagnostics,
    isSyncing,
    syncProgress,
    formatTime,
    priorityFilter,
    setPriorityFilter
}) => {
    const filters = [
        { id: 'all', label: 'Tümü', color: '#64748b' },
        { id: 'high', label: 'Yüksek', color: '#ef4444' },
        { id: 'medium', label: 'Orta', color: '#f59e0b' },
        { id: 'low', label: 'Düşük', color: '#10b981' }
    ];

    const hotLeads = conversations.filter(c => (c.priority_score > 75 || c.last_sentiment === 'urgent')).slice(0, 8);

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* User Header with Glassmorphism */}
            <div className="h-[70px] bg-white/80 backdrop-blur-md px-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer shadow-sm border border-white">
                        <User size={22} className="text-slate-400" />
                    </div>
                    <span className="font-black text-slate-800 tracking-tighter text-xl">TRIO</span>
                </div>
                <div className="flex gap-4 text-slate-500">
                    <div className="flex items-center gap-1 group relative">
                        <button
                            onClick={syncAllConversations}
                            disabled={isSyncing}
                            title={isSyncing ? "Senkronize ediliyor..." : "Konuşmaları Yenile"}
                            aria-label="Konuşmaları Yenile"
                            className={`rounded hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSyncing ? 'animate-spin text-[#00a884]' : ''}`}
                        >
                            <RefreshCw size={20} />
                        </button>
                        {isSyncing && syncProgress > 0 && (
                            <span className="text-[10px] font-bold text-[#00a884] absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap animate-pulse">
                                %{syncProgress}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={startBulkDiscovery}
                        title="AI Müşteri Keşfi Başlat"
                        aria-label="AI Müşteri Keşfi Başlat"
                        className="rounded hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors"
                    >
                        <Brain size={20} />
                    </button>
                    <button
                        onClick={fetchDiagnostics}
                        title="Teknik Tanılama"
                        aria-label="Teknik Tanılama"
                        className="rounded hover:text-[#00a884] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884] transition-colors"
                    >
                        <Activity size={20} />
                    </button>
                    <button
                        title="Yeni Sohbet"
                        aria-label="Yeni Sohbet"
                        className="rounded hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors"
                    >
                        <MessageCircle size={20} />
                    </button>
                    <button
                        onClick={handleHardReset}
                        title="Verileri Temizle ve Tam Senkronizasyon Yap"
                        aria-label="Verileri Temizle ve Tam Senkronizasyon Yap"
                        className="rounded hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 transition-colors relative"
                    >
                        <ShieldAlert size={20} className={isSyncing ? "animate-pulse" : ""} />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping opacity-75"></span>
                    </button>
                    <button
                        title="Menü"
                        aria-label="Menü"
                        className="rounded hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Hot Leads Carousel (Sıcak Takip) */}
            {hotLeads.length > 0 && (
                <div className="bg-slate-50/50 border-b border-gray-100 py-3 flex-shrink-0">
                    <div className="px-4 mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">🔥 Sıcak Takip</span>
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-1">
                        {hotLeads.map(lead => (
                            <div
                                key={lead.phone}
                                onClick={() => setSelectedChat(lead.phone)}
                                className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
                            >
                                <div className={`w-14 h-14 rounded-2xl p-0.5 transition-all duration-300 border-2 ${selectedChat === lead.phone ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-100' : 'border-transparent hover:border-gray-200'}`}>
                                    <div className="w-full h-full rounded-[10px] overflow-hidden bg-white shadow-sm border border-gray-50">
                                        {(lead.profilePic || lead.profilePicUrl || lead.profile_pic_url) ? (
                                            <img
                                                src={lead.profilePic || lead.profilePicUrl || lead.profile_pic_url}
                                                alt={lead.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-slate-300">
                                                <User size={20} />
                                            </div>
                                        )}
                                    </div>
                                    {lead.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-lg flex items-center justify-center text-[8px] font-black text-white shadow-md ring-2 ring-white">
                                            {lead.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[10px] font-black truncate w-14 text-center transition-colors ${selectedChat === lead.phone ? 'text-indigo-600' : 'text-slate-600'}`}>{lead.name?.split(' ')[0] || 'Chat'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="px-3 py-3 flex gap-2 overflow-x-auto bg-white/50 backdrop-blur-sm border-b border-gray-100 no-scrollbar">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setPriorityFilter(f.id)}
                        style={{
                            backgroundColor: priorityFilter === f.id ? f.color : 'white',
                            color: priorityFilter === f.id ? 'white' : '#64748b'
                        }}
                        className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 shadow-sm border border-gray-100 hover:scale-105 active:scale-95 ${priorityFilter === f.id ? 'shadow-lg shadow-current/20 ring-2 ring-current ring-offset-2' : 'hover:bg-gray-50'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Search Bar - Modern & Sleek */}
            <div className="px-4 py-3 flex items-center border-b border-gray-50 bg-white/30 backdrop-blur-sm flex-shrink-0">
                <div className="bg-gray-100/50 hover:bg-gray-100 transition-colors flex items-center px-4 rounded-xl h-[42px] w-full border border-gray-100/50">
                    <Search size={16} className="text-slate-400 mr-3 min-w-[16px]" />
                    <input
                        type="text"
                        placeholder="Sohbetlerde arayın..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-[13px] font-bold w-full py-1 text-slate-700 placeholder-slate-400 outline-none"
                    />
                </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                {
                    conversations.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">
                            <p>Sohbet bulunamadı.</p>
                            <button
                                onClick={syncAllConversations}
                                disabled={isSyncing}
                                className={`mt-4 ${isSyncing ? 'text-gray-400' : 'text-[#008069] hover:underline'} text-xs font-bold uppercase tracking-wider`}
                            >
                                {isSyncing ? `Senkronize ediliyor... %${syncProgress}` : 'Tüm sohbetleri senkronize et'}
                            </button>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <ContactItem
                                key={conv.phone}
                                conv={conv}
                                selectedChat={selectedChat}
                                setSelectedChat={setSelectedChat}
                                formatTime={formatTime}
                            />
                        ))
                    )
                }
            </div >
        </div >
    );
});

export default WhatsAppSidebar;
