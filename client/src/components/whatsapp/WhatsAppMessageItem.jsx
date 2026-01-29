import React from 'react';
import { User, Check, CheckCheck, Clock, Home, MapPin, Tag, ExternalLink } from 'lucide-react';

const formatMessage = (input) => {
    if (!input) return null;
    const text = String(input);
    const parts = text.split(/(\[.*?\]\(.*?\))|(\*\*.*?\*\*)/g);

    return parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('[') && part.includes('](')) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                return (
                    <a
                        key={i}
                        href={match[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1"
                    >
                        {match[1]} <ExternalLink size={12} />
                    </a>
                );
            }
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const PropertyCard = React.memo(({ property }) => {
    if (!property) return null;
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-hidden my-3 shadow-md hover:shadow-xl transition-all duration-300 max-w-sm group">
            <div className="relative h-40 overflow-hidden">
                {property.images?.[0] ? (
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                        <Home size={40} className="text-slate-200" />
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm">
                    <div className="text-[#00a884] font-bold text-sm">
                        {new Intl.NumberFormat('tr-TR').format(property.price || 0)} ₺
                    </div>
                </div>
            </div>
            <div className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-2 line-clamp-1">{property.title}</h4>
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-3">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{property.district} / {property.neighborhood}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-slate-400 font-medium">{property.rooms} ODA</span>
                    <a
                        href={property.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-600 transition-colors flex items-center gap-2"
                    >
                        İlanı Aç <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
});

const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    const API_URL = import.meta.env.VITE_API_URL || (
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.hostname.endsWith('.local')
            ? `http://${window.location.hostname}:5005/api`
            : 'https://trio-app-server.onrender.com/api'
    );
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${url}`;
};

const MediaContent = React.memo(({ msg }) => {
    if (!msg.media_url) return null;
    const mediaUrl = getMediaUrl(msg.media_url);

    if (msg.media_type === 'image') {
        return (
            <div className="relative rounded-2xl overflow-hidden cursor-zoom-in group mb-1 min-w-[200px]">
                <img
                    src={mediaUrl}
                    alt="Media"
                    className="max-w-full h-auto object-cover max-h-[300px] hover:scale-105 transition-transform duration-700"
                />
            </div>
        );
    }

    if (msg.media_type === 'video') {
        return (
            <div className="rounded-2xl overflow-hidden bg-black mb-1">
                <video src={mediaUrl} controls className="max-w-[300px] w-full" />
            </div>
        );
    }

    if (msg.media_type === 'audio') {
        return (
            <div className="px-2 py-3 bg-white/50 rounded-2xl mb-1 flex items-center gap-3 w-64">
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-lg">
                    <Clock size={20} />
                </div>
                <audio src={mediaUrl} controls className="h-8 flex-1" />
            </div>
        );
    }

    return (
        <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl mb-1 border border-white hover:bg-white/80 transition-colors"
        >
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 truncate">Dosya</div>
                <div className="text-[10px] text-slate-400 uppercase">{msg.media_type}</div>
            </div>
            <Clock size={16} className="text-slate-300" />
        </a>
    );
});

const WhatsAppMessageItem = ({ msg, isMe, formatTime }) => {
    if (!msg) return null;

    // AI/Assistant messages styling
    const isBot = msg.fromMe && msg.metadata?.is_ai_generated;

    return (
        <div className={`flex w-full mb-3 ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${isMe
                    ? 'bg-gradient-to-br from-[#d9fdd3] to-[#cdf0c7] text-[#111b21] rounded-tr-none border border-[#c1e8ba]'
                    : isBot
                        ? 'bg-gradient-to-br from-indigo-50 to-white text-[#111b21] rounded-tl-none border border-indigo-100'
                        : 'bg-white text-[#111b21] rounded-tl-none border border-white'
                    }`}>
                    {/* Bot Badge */}
                    {isBot && (
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-indigo-100/50">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                <span className="text-[8px] text-white font-black">AI</span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Akıllı Asistan</span>
                        </div>
                    )}

                    {/* Sender Name for non-me messages in groups */}
                    {!isMe && msg.sender_name && (
                        <div className="text-[11px] font-black text-indigo-500 mb-1 flex items-center gap-1">
                            <User size={10} />
                            {msg.sender_name}
                        </div>
                    )}

                    {/* Media Content */}
                    {msg.media_url && <MediaContent msg={msg} />}

                    {/* Text content */}
                    {msg.content && (
                        <div className="text-[14.5px] whitespace-pre-wrap leading-relaxed break-words">
                            {formatMessage(msg.content)}
                        </div>
                    )}

                    {/* Extracted Properties (Metadata) */}
                    {msg.metadata?.properties?.map((prop, idx) => (
                        <PropertyCard key={idx} property={prop} />
                    ))}

                    {/* Message Meta (Time + Status) */}
                    <div className="flex items-center gap-1.5 justify-end mt-1 opacity-60">
                        <span className="text-[10px] font-medium uppercase tracking-tighter">
                            {msg.timestamp ? formatTime(msg.timestamp) : ''}
                        </span>
                        {isMe && (
                            <span className="text-[#53bdeb]">
                                <CheckCheck size={14} />
                            </span>
                        )}
                    </div>
                </div>

                {/* Intent/Sentiment Tags inside Assistant Messages */}
                {isBot && msg.metadata?.intent && (
                    <div className="mt-1 flex gap-1.5 px-2">
                        <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-indigo-50 text-[10px] text-indigo-500 font-bold uppercase ring-1 ring-indigo-100/50">
                            <Tag size={10} />
                            {msg.metadata.intent}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(WhatsAppMessageItem);
