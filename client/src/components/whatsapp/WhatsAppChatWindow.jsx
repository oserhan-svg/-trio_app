import React from 'react';
import { Search, MoreVertical, MessageCircle, ShieldCheck, Smile, Paperclip, Send, User, RefreshCw, Bot, ThumbsUp, ThumbsDown, Check, Brain, X, Zap, Plus, Activity, CheckCircle, MapPin, Calendar, FileText, Tag, Maximize2 } from 'lucide-react';
import WhatsAppMessageItem from './WhatsAppMessageItem';

const WhatsAppChatWindow = React.memo(({
    selectedChat,
    currentChatContact,
    groupedActiveMessages,
    messages,
    loading,
    hasMore,
    isFetchingMore,
    loadMoreMessages,
    replyMessage,
    setReplyMessage,
    handleSendMessage,
    debugMode,
    formatTime,
    formatDateHeader,
    chatEndRef,
    recommendations,
    applyRecommendation,
    submitFeedback,
    toggleAIDelegation,
    negotiationAdvice,
    handleScroll,
    aiDraft,
    clearAiDraft,
    showClientInsight,
    toggleInsight
}) => {
    const [searchTermLocal, setSearchTermLocal] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState(null);
    const [isTagging, setIsTagging] = React.useState(false);
    const [dragActive, setDragActive] = React.useState(false);

    // Tag management local logic
    const clientTags = Array.isArray(currentChatContact?.tags) ? currentChatContact.tags : (typeof currentChatContact?.tags === 'string' ? currentChatContact.tags.split(',') : []);

    const isGroup = selectedChat?.endsWith('@g.us');

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                setIsSearching(prev => !prev);
            }
            if (e.altKey && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                toggleInsight();
            }
            if (e.key === 'Escape') {
                setIsSearching(false);
                setSearchTermLocal('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleInsight]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            // In a real app, we would handle the file upload here. 
            // For now, we simulate adding a placeholder text
            setReplyMessage(prev => prev + ` [Dosya Hazır: ${e.dataTransfer.files[0].name}]`);
        }
    };

    // Filter messages locally
    const filteredGroupedMessages = React.useMemo(() => {
        if (!searchTermLocal) return groupedActiveMessages || {};

        const filtered = {};
        const term = searchTermLocal.toLowerCase();

        Object.entries(groupedActiveMessages || {}).forEach(([date, msgs]) => {
            const matches = msgs.filter(m => m.content?.toLowerCase().includes(term));
            if (matches.length > 0) {
                filtered[date] = matches;
            }
        });
        return filtered;
    }, [groupedActiveMessages, searchTermLocal]);
    if (!selectedChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 border-b-[6px] border-[#25D366]">
                <div className="mb-10 relative">
                    <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center opacity-30 animate-pulse">
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <MessageCircle size={100} className="text-[#d1d7db]" strokeWidth={0.8} />
                    </div>
                </div>
                <h2 className="text-[32px] font-light text-[#41525d] mb-4">Trio Emlak WhatsApp</h2>
                <p className="text-[14px] text-[#667781] max-w-md leading-6">
                    Aramalar yapmadan mesaj gönderin ve alın.<br />
                    WhatsApp'ı aynı anda 4 cihaza kadar ve 1 telefonda kullanın.
                </p>
                <div className="mt-12 flex items-center gap-2 text-[#8696a0] text-xs font-medium">
                    <ShieldCheck size={12} />
                    <span>Uçtan uca şifrelenmiş</span>
                </div>
            </div>
        );
    }

    const filteredRecommendations = (recommendations || []).filter(r => (r.message?.from === selectedChat || r.message?.to === selectedChat) && !r.is_applied);

    return (
        <div className="flex-1 flex flex-col bg-[#efeae2] relative min-w-0 shadow-2xl transition-all duration-500 overflow-hidden rounded-l-3xl">
            {/* Chat Header with Glassmorphism */}
            <div className="h-[76px] bg-white/70 backdrop-blur-xl px-6 flex items-center justify-between border-b border-gray-100 flex-shrink-0 z-30 w-full sticky top-0 shadow-sm">
                <div className="flex items-center gap-4 cursor-pointer w-full group">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex-shrink-0 transition-transform group-hover:scale-105 duration-300">
                        {(currentChatContact?.profilePic || currentChatContact?.profilePicUrl || currentChatContact?.profile_pic_url) ? (
                            <img
                                src={currentChatContact.profilePic || currentChatContact.profilePicUrl || currentChatContact.profile_pic_url}
                                alt={currentChatContact?.name || 'Chat'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
                            style={{ display: (currentChatContact?.profilePic || currentChatContact?.profilePicUrl || currentChatContact?.profile_pic_url) ? 'none' : 'flex' }}
                        >
                            <User size={28} className="text-gray-300" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-slate-800 truncate text-lg group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                            {currentChatContact?.name || currentChatContact?.partner || currentChatContact?.phone || 'Bilinmeyen'}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsTagging(!isTagging); }}
                                className="p-1 hover:bg-indigo-50 rounded-lg text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Etiketle"
                            >
                                <Tag size={16} />
                            </button>
                        </h3>
                        <div className="flex items-center gap-2 overflow-hidden pr-4">
                            <p className="text-[11px] font-bold text-slate-400 truncate tracking-tight uppercase flex items-center gap-1.5 flex-shrink-0">
                                {currentChatContact?.ai_delegated ? (
                                    <span className="text-indigo-500 animate-pulse flex items-center gap-1"><Bot size={12} /> AI Aktif</span>
                                ) : (
                                    <span>{isGroup ? 'Grupta' : 'WhatsApp'}</span>
                                )}
                            </p>
                            {clientTags.length > 0 && (
                                <div className="flex gap-1 border-l pl-2 border-gray-100 overflow-hidden">
                                    {clientTags.map((t, idx) => (
                                        <span key={idx} className="bg-slate-100 text-slate-500 px-1.5 py-0 rounded text-[9px] font-bold whitespace-nowrap uppercase tracking-tighter border border-gray-50">{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {isTagging && (
                        <div className="absolute top-16 left-14 bg-white shadow-2xl rounded-2xl p-4 border border-gray-100 z-[100] w-64 animate-in zoom-in-95 duration-200">
                            <h5 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Müşteri Etiketle</h5>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['Sıcak', 'Yatırımcı', 'Kiracı', 'Alıcı', 'Arsa', 'Ticari'].map(tag => (
                                    <button
                                        key={tag}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${clientTags.includes(tag) ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-100' : 'bg-gray-50 text-slate-600 border-gray-100 hover:border-indigo-200'}`}
                                        onClick={() => {/* Mock tag toggle logic */ }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsTagging(false)}
                                className="w-full py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200"
                            >
                                Kapat
                            </button>
                        </div>
                    )}
                    {currentChatContact?.next_best_action ? (
                        <div className="flex items-center gap-1.5 animate-in slide-in-from-left duration-500">
                            <span className="text-[11px] font-bold text-[#00a884] uppercase tracking-wider bg-[#d9fdd3] px-1.5 rounded">AI ÖNERİ:</span>
                            <p className="text-[12px] text-[#111b21] font-medium truncate italic">{currentChatContact.next_best_action}</p>
                        </div>
                    ) : (
                        <p className="text-[12px] text-[#667781] truncate">
                            {currentChatContact?.phone !== currentChatContact?.name ? currentChatContact?.phone : 'çevrimiçi'}
                        </p>
                    )}
                </div>
            </div>

            {isSearching ? (
                <div className="flex-1 max-w-md mx-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="relative">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Mesajlarda ara... (Esc: Kapat)"
                            value={searchTermLocal}
                            onChange={(e) => setSearchTermLocal(e.target.value)}
                            className="w-full bg-white/50 backdrop-blur-sm border border-gray-100 rounded-xl px-4 py-1.5 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                        />
                        <button
                            onClick={() => { setIsSearching(false); setSearchTermLocal(''); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="flex gap-5 text-slate-500 items-center">
                {currentChatContact?.clientId && (
                    <button
                        onClick={() => toggleAIDelegation(currentChatContact.clientId, !currentChatContact.ai_delegated)}
                        className={`px-3 py-2 rounded-xl transition-all duration-500 flex items-center gap-2 group shadow-sm border ${currentChatContact.ai_delegated
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-200'
                            : 'bg-white hover:bg-gray-50 text-slate-600 border-gray-100'
                            }`}
                        title={currentChatContact.ai_delegated ? "AI Temsilini Durdur" : "AI'ya Devret"}
                    >
                        <Bot size={18} className={currentChatContact.ai_delegated ? "animate-pulse" : "group-hover:rotate-12 transition-transform"} />
                        {currentChatContact.ai_delegated && <span className="text-[10px] font-black pr-1 uppercase tracking-wider">AI AKTİF</span>}
                    </button>
                )}
                <button
                    onClick={toggleInsight}
                    className={`p-2.5 rounded-xl transition-all shadow-sm border ${showClientInsight ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100' : 'bg-white text-slate-500 border-gray-100 hover:bg-gray-50'}`}
                    title={showClientInsight ? "Bilgileri Gizle" : "Bilgileri Göster"}
                >
                    <Activity size={18} />
                </button>
                <div className="w-px h-6 bg-gray-100 mx-1"></div>
                <button
                    onClick={() => setIsSearching(!isSearching)}
                    className={`p-2.5 rounded-xl transition-all ${isSearching ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-slate-400'}`}
                    title="Mesajlarda Ara (Alt+S)"
                >
                    <Search size={18} />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-gray-100 text-slate-400 transition-colors" title="Seçenekler" aria-label="Seçenekler">
                    <MoreVertical size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 min-h-0 relative flex flex-col"
                style={{
                    backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                    backgroundAttachment: 'local'
                }}
            >
                {/* Overlay to dim the background image */}
                <div className="absolute inset-0 bg-[#efeae2] opacity-90 z-0 pointer-events-none"></div>

                <div
                    className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-1 relative z-10 custom-scrollbar"
                    onScroll={handleScroll}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {/* Drag & Drop Feedback Overlay */}
                    {dragActive && (
                        <div className="absolute inset-4 z-40 bg-indigo-600/10 backdrop-blur-sm border-2 border-indigo-500 border-dashed rounded-3xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
                            <Plus size={48} className="text-indigo-600 mb-4 animate-bounce" />
                            <p className="text-indigo-700 font-black text-xl uppercase tracking-widest">Dosyayı Buraya Bırak</p>
                        </div>
                    )}

                    {loading && messages.length <= 1 && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-full shadow-lg flex items-center gap-3">
                                <RefreshCw size={20} className="text-[#00a884] animate-spin" />
                                <span className="text-xs font-bold text-gray-600">Mesajlar Yükleniyor...</span>
                            </div>
                        </div>
                    )}

                    {currentChatContact?.ai_delegated && (
                        <div className="sticky top-2 z-30 mb-6 flex justify-center w-full">
                            <div className="bg-[#e7f3ff] border border-blue-100 text-blue-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
                                <Bot size={18} className="animate-bounce" />
                                <span className="text-xs font-bold tracking-tight">AI BU KONUŞMAYI YÖNETİYOR</span>
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            </div>
                        </div>
                    )}

                    {messages.length === 0 && (
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-[#ffeecd] text-[#54656f] px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium mb-4">
                                🔒 Mesajlar ve aramalar uçtan uca şifrelidir. WhatsApp bile okuyamaz veya dinleyemez.
                            </div>
                        </div>
                    )}

                    {hasMore && (
                        <div className="relative z-10 flex justify-center py-4">
                            <button
                                onClick={loadMoreMessages}
                                disabled={isFetchingMore}
                                className="text-[13px] text-[#00a884] bg-white px-4 py-1.5 rounded-full shadow-sm hover:bg-[#f0f2f5] transition-colors flex items-center gap-2 border border-gray-100"
                            >
                                {isFetchingMore ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : (
                                    'Daha eski mesajları yükle'
                                )}
                            </button>
                        </div>
                    )}

                    {Object.entries(filteredGroupedMessages).map(([date, msgs]) => (
                        <div key={date} className="relative z-10">
                            <div className="flex justify-center mb-4 mt-2 sticky top-12 z-20">
                                <span className="bg-white/95 shadow-sm px-3 py-1.5 rounded-lg text-xs font-medium text-[#54656f] uppercase tracking-wide border border-gray-100">
                                    {formatDateHeader(date)}
                                </span>
                            </div>
                            {(msgs || []).map((msg, idx) => {
                                if (!msg) return null;
                                const isMe = msg.from === 'system';
                                const isAI = isMe && msg.whatsapp_id?.startsWith('ai-');
                                const isNextSame = idx < msgs.length - 1 && msgs[idx + 1].from === msg.from;

                                return (
                                    <WhatsAppMessageItem
                                        key={msg.id || idx}
                                        msg={msg}
                                        isMe={isMe}
                                        isAI={isAI}
                                        isGroup={isGroup}
                                        isNextSame={isNextSame}
                                        debugMode={debugMode}
                                        formatTime={formatTime}
                                        onImageClick={setSelectedImage}
                                    />
                                );
                            })}
                        </div>
                    ))}
                    <div ref={chatEndRef} className="h-4" />
                </div>
            </div>

            {/* Input Area - Modern Glassy Style */}
            <div className="bg-white/70 backdrop-blur-xl p-4 flex flex-col gap-3 border-t border-gray-100 z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
                {/* Quick Actions Row */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-2">
                    <button
                        onClick={() => setReplyMessage(prev => prev + "📍 Trio Emlak Ofis Konumu: https://maps.google.com/?q=Trio+Emlak")}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <MapPin size={12} /> Konum Gönder
                    </button>
                    <button
                        onClick={() => setReplyMessage("Merhabalar, istediğiniz kriterlere uygun portföylerimiz için bir randevu oluşturabiliriz. Hangi gün size uygun olur?")}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <Calendar size={12} /> Randevu Öner
                    </button>
                    <button
                        onClick={() => setReplyMessage("Merhaba, talebiniz için özel bir gayrimenkul sunumu hazırlıyorum. Kısa süre içerisinde buradan paylaşacağım.")}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <FileText size={12} /> Sunum Hazırla
                    </button>
                </div>

                {/* AI Draft Assist */}
                {aiDraft && (
                    <div className="bg-white/80 backdrop-blur-md border border-indigo-100 rounded-2xl p-4 shadow-xl mx-2 mb-2 animate-in slide-in-from-bottom-4 duration-500 ring-4 ring-indigo-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
                                <Brain size={14} className="animate-pulse" />
                                AI Taslak Yardımcısı
                            </div>
                            <button
                                onClick={clearAiDraft}
                                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <p className="text-[13px] text-slate-700 italic border-l-3 border-indigo-200 pl-4 py-1 mb-4 leading-relaxed font-medium">
                            "{aiDraft}"
                        </p>
                        <button
                            onClick={() => {
                                setReplyMessage(aiDraft);
                                clearAiDraft();
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Zap size={12} /> Taslağı Kullan
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3 px-2">
                    <div className="flex gap-1">
                        <button className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-all active:scale-95" title="Emoji Ekle" aria-label="Emoji Ekle">
                            <Smile size={24} />
                        </button>
                        <button className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-all active:scale-95" title="Dosya Ekle" aria-label="Dosya Ekle">
                            <Plus size={24} />
                        </button>
                    </div>
                    <div className="flex-1 bg-gray-50/50 hover:bg-white focus-within:bg-white rounded-2xl px-4 py-2 shadow-inner border border-gray-100/50 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all duration-300">
                        <textarea
                            placeholder="Bir mesaj yazın..."
                            className="w-full bg-transparent border-none focus:ring-0 text-[14px] font-medium py-1.5 resize-none max-h-32 text-slate-700 placeholder-slate-400"
                            rows="1"
                            value={replyMessage}
                            onChange={(e) => {
                                setReplyMessage(e.target.value);
                                e.target.style.height = 'inherit';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!replyMessage.trim()}
                        className={`p-3.5 rounded-2xl transition-all shadow-xl active:scale-90 ${replyMessage.trim() ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300' : 'bg-gray-100 text-gray-300'}`}
                    >
                        <Send size={22} className={replyMessage.trim() ? 'translate-x-0.5' : ''} />
                    </button>
                </div>
            </div>

            {/* Negotiation Assistant Overlay */}
            {
                negotiationAdvice && negotiationAdvice.detected_objection && negotiationAdvice.suggestion && (
                    <div className="absolute top-[70px] right-[340px] w-80 bg-white/95 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-xl overflow-hidden animate-in slide-in-from-right-10 duration-500 z-50 border border-indigo-100 ring-1 ring-indigo-50">
                        <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600">
                            <div className="flex items-center gap-2 text-white">
                                <Brain size={18} className="animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-widest">Müzakere Asistanı</span>
                            </div>
                            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Activity size={10} />
                                Canlı
                            </span>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
                                    İTİRAZ TESPİT EDİLDİ
                                </span>
                                <span className="text-xs font-bold text-gray-700">
                                    {negotiationAdvice?.detected_objection}
                                </span>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50 to-white p-3 rounded-lg border border-indigo-100 mb-3">
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                                    <Bot size={12} /> Önerilen Taktik: {negotiationAdvice?.suggestion?.tactic}
                                </div>
                                <p className="text-sm text-gray-800 font-medium leading-relaxed italic">
                                    "{negotiationAdvice?.suggestion?.rebuttal}"
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setReplyMessage(negotiationAdvice?.suggestion?.rebuttal)}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <CheckCircle size={14} />
                                    Cevabı Kullan
                                </button>
                                <div className="flex gap-1">
                                    <button className="p-2 bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Faydalı">
                                        <ThumbsUp size={16} />
                                    </button>
                                    <button className="p-2 bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Faydasız">
                                        <ThumbsDown size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 leading-tight">
                                💡 <strong>Neden?</strong> {negotiationAdvice?.suggestion?.rationale}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Smart Recommendations Overlay Integration */}
            {
                filteredRecommendations.length > 0 && (
                    <div className="absolute top-[70px] right-6 w-72 bg-white/95 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.1)] rounded-lg overflow-hidden animate-in slide-in-from-right-10 duration-300 z-50 border border-gray-100">
                        <div className="bg-[#00a884] px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <Bot size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">AI Asistan</span>
                            </div>
                            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">Beta</span>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                            {filteredRecommendations.map(rec => {
                                const isLeadAction = rec.suggested_action === 'create_lead';
                                const meta = rec.metadata;

                                return (
                                    <div key={rec.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 group shadow-sm">
                                        <div className="flex gap-3 mb-2">
                                            <div className={`w-1 rounded-full ${isLeadAction ? 'bg-blue-500' : 'bg-[#00a884]'} opacity-50`}></div>
                                            <div className="flex-1">
                                                {isLeadAction && (
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mb-1 block">YENİ MÜŞTERİ ÖNERİSİ</span>
                                                )}
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="text-xs text-[#111b21] leading-relaxed font-medium">{rec.recommendation}</p>
                                                    <div className="flex gap-1 shrink-0">
                                                        {rec.feedback ? (
                                                            <span className={`p-1 rounded ${rec.feedback.is_helpful ? 'text-green-600 bg-green-50' : 'text-rose-600 bg-rose-50'}`}>
                                                                {rec.feedback.is_helpful ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => submitFeedback(rec.id, true)}
                                                                    className="p-1 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded transition"
                                                                    title="Faydalı"
                                                                >
                                                                    <ThumbsUp size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => submitFeedback(rec.id, false)}
                                                                    className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded transition"
                                                                    title="Hatalı"
                                                                >
                                                                    <ThumbsDown size={12} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {isLeadAction && meta && (
                                            <div className="grid grid-cols-2 gap-2 my-3 text-[11px] bg-white p-2 rounded border border-gray-100">
                                                {meta.name && (
                                                    <div>
                                                        <span className="text-gray-400 block font-normal">İsim</span>
                                                        <span className="text-gray-800 font-bold">{meta.name}</span>
                                                    </div>
                                                )}
                                                {meta.intent && (
                                                    <div>
                                                        <span className="text-gray-400 block font-normal">Amaç</span>
                                                        <span className="text-gray-800 font-bold uppercase">{meta.intent === 'buy' ? 'Alıcı' : 'Kiracı'}</span>
                                                    </div>
                                                )}
                                                {meta.budget && (
                                                    <div>
                                                        <span className="text-gray-400 block font-normal">Bütçe</span>
                                                        <span className="text-gray-800 font-bold">{parseFloat(meta.budget).toLocaleString()} ₺</span>
                                                    </div>
                                                )}
                                                {meta.location && (
                                                    <div>
                                                        <span className="text-gray-400 block font-normal">Konum</span>
                                                        <span className="text-gray-800 font-bold">{meta.location}</span>
                                                    </div>
                                                )}
                                                {meta.rooms && (
                                                    <div>
                                                        <span className="text-gray-400 block font-normal">Oda</span>
                                                        <span className="text-gray-800 font-bold">{meta.rooms}</span>
                                                    </div>
                                                )}
                                                {meta.seriousnessScore !== undefined && (
                                                    <div>
                                                        <span className="text-gray-400 block font-normal">AI Skor</span>
                                                        <span className={`font-bold ${meta.seriousnessScore > 80 ? 'text-emerald-600' : 'text-orange-600'}`}>%{meta.seriousnessScore}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => applyRecommendation(rec.id)}
                                            className={`w-full py-2 text-[11px] font-bold rounded transition-all uppercase tracking-wide border
                                            ${isLeadAction
                                                    ? 'text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white'
                                                    : 'text-[#00a884] border-[#00a884] hover:bg-[#00a884] hover:text-white'}`}
                                        >
                                            {isLeadAction ? 'CRM\'e Aktar & Kaydet' : 'Öneriyi Uygula'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            {/* Lightbox Filter */}
            {
                selectedImage && (
                    <div
                        className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 p-3 rounded-full" title="Kapat" aria-label="Kapat">
                            <X size={32} />
                        </button>
                        <div className="relative max-w-5xl max-h-full group" onClick={e => e.stopPropagation()}>
                            <img
                                src={selectedImage}
                                alt="Lightbox"
                                className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500 border border-white/10"
                            />
                            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 pointer-events-none"></div>

                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-2xl backdrop-blur-md flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
                                    <Maximize2 size={16} /> Tam Boyut
                                </button>
                                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
                                    <Paperclip size={16} /> İndir
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
});

export default WhatsAppChatWindow;
