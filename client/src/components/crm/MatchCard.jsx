import React from 'react';
import { Clock, ChevronRight, Home, ExternalLink, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MatchCard = ({ match, showActions = false }) => {
    const navigate = useNavigate();
    const { client, property, score, added_at } = match;

    // Normalize score
    const matchScore = score || 85;
    const isHighMatch = matchScore >= 80;

    const handleWhatsApp = (e) => {
        e.stopPropagation();
        if (!client.phone) return alert('Müşteri telefonu kayıtlı değil.');

        const message = `Merhaba ${client.name}, size uygun bir portföyümüz var: ${property.title} - ${parseInt(property.price).toLocaleString()} TL. İncelemek ister misiniz?`;
        const url = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div
            className="group relative bg-white rounded-2xl border border-slate-100 hover:border-blue-400 hover:shadow-lg transition-all duration-300 p-4 cursor-pointer overflow-hidden"
            onClick={() => navigate(`/clients/${match.client_id}`)}
        >
            {/* Match Score Badge (Absolute) */}
            <div className="absolute top-3 right-3 flex flex-col items-end z-10">
                <div className={`
                    text-xs font-black px-2 py-1 rounded-lg backdrop-blur-md border shadow-sm
                    ${isHighMatch
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'}
                `}>
                    %{matchScore} Eşleşme
                </div>
            </div>

            <div className="flex items-start gap-4">
                {/* Visual Side */}
                <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center text-indigo-600 font-black text-xl border-2 border-white shadow-sm ring-1 ring-slate-100">
                        {client.name?.[0]?.toUpperCase()}
                    </div>
                    {/* Status Dot */}
                    <span className={`absolute -bottom-1 -right-1 flex h-4 w-4`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHighMatch ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                        <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white ${isHighMatch ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    </span>
                </div>

                {/* Content Side */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 truncate">{client.name}</h4>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{client.type || 'ALICI'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-3">
                        <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {new Date(added_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Property Mini Card */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 group-hover:bg-white group-hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-700 truncate flex-1 pr-2">{property.title}</span>
                            <span className="text-xs font-black text-emerald-600 whitespace-nowrap">{parseInt(property.price).toLocaleString()} ₺</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1">
                                <Home size={10} />
                                {property.district}/{property.neighborhood}
                            </div>
                            <span>•</span>
                            <span>{property.rooms}</span>
                            <span>•</span>
                            <span>{property.size_m2}m²</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions (Slide Up) */}
            <div className={`mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 ${!showActions ? 'hidden group-hover:grid' : 'grid'}`}>
                <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all text-xs font-bold"
                >
                    <MessageCircle size={14} />
                    WhatsApp
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/property/${property.id}`); }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all text-xs font-bold"
                >
                    <ExternalLink size={14} />
                    İlanı İncele
                </button>
            </div>
        </div>
    );
};

// OPTIMIZATION: React.memo with custom comparison to prevent unnecessary re-renders
export default React.memo(MatchCard, (prevProps, nextProps) => {
    // Only re-render if match ID or score changes
    return prevProps.match.id === nextProps.match.id &&
        prevProps.match.score === nextProps.match.score &&
        prevProps.showActions === nextProps.showActions;
});
