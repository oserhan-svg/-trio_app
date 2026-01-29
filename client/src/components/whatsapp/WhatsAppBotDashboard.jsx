import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Activity, ShieldAlert, Monitor, Info, ExternalLink } from 'lucide-react';
import io from 'socket.io-client';
import AILearningStatus from './AILearningStatus';
import ErrorBoundary from '../ui/ErrorBoundary';

// Initialize Socket with fallback to localhost if production URL fails
const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5005';

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true
});

const WhatsAppBotDashboard = () => {
    const location = useLocation();
    const [lastExtensionSync, setLastExtensionSync] = useState(null);
    const [iframeKey, setIframeKey] = useState(0); // For reloading iframe
    const [isLoading, setIsLoading] = useState(true);

    const getIframeSrc = () => {
        const params = new URLSearchParams(location.search);
        let phone = params.get('phone');
        const text = params.get('text');

        if (phone) {
            // Normalize phone: Remove non-digits
            phone = phone.replace(/[^\d]/g, '');
            // If it starts with 0 and is 11 digits (TR format), change to 90
            if (phone.startsWith('0') && phone.length === 11) {
                phone = '90' + phone.substring(1);
            }
            // If it starts with 5 and is 10 digits, add 90
            else if (phone.startsWith('5') && phone.length === 10) {
                phone = '90' + phone;
            }

            // Use the send/ URL which is more reliable for pre-filling
            return `https://web.whatsapp.com/send/?phone=${phone}${text ? `&text=${encodeURIComponent(text)}` : ''}`;
        }
        return "https://web.whatsapp.com";
    };

    const [iframeSrc, setIframeSrc] = useState(getIframeSrc());

    useEffect(() => {
        const newSrc = getIframeSrc();
        if (newSrc !== iframeSrc) {
            setIframeSrc(newSrc);
            setIsLoading(true);
            setIframeKey(prev => prev + 1);
        }
    }, [location.search]);

    useEffect(() => {
        // Socket Event Listeners
        socket.on('whatsapp_extension_sync', (data) => {
            console.log('🔌 Extension Sync Received:', data);
            setLastExtensionSync(data);
        });

        return () => {
            socket.off('whatsapp_extension_sync');
        };
    }, []);

    const reloadIframe = () => {
        setIsLoading(true);
        setIframeKey(prev => prev + 1);
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    // Safety timeout for loader
    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 10000); // 10s safety
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5] overflow-hidden w-full relative">
            {/* Header / Toolbar */}
            <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Monitor size={20} />
                        <span className="font-bold text-sm tracking-tight">WHATSAPP WEB LIVE</span>
                    </div>

                    {lastExtensionSync && (
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 animate-in fade-in slide-in-from-left-2 transition-all">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">
                                CRM SENKRONİZASYONU AKTİF
                            </span>
                            <span className="text-[10px] text-emerald-600 font-mono border-l border-emerald-200 ml-1 pl-2">
                                {new Date(lastExtensionSync.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:block">
                        <AILearningStatus />
                    </div>

                    <button
                        onClick={reloadIframe}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-gray-200"
                        title="Ekranı Yenile"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        YENİLE
                    </button>

                    <a
                        href="https://web.whatsapp.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-[#00a884] hover:bg-[#008f6f] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                        <ExternalLink size={14} />
                        TAM EKRAN
                    </a>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative">
                <ErrorBoundary>
                    {/* Security Notice / Hint */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-xs flex items-center gap-3 shadow-xl">
                            <ShieldAlert size={16} />
                            <span>Görüntüleme sorunu yaşıyorsanız eklentinin güncel olduğundan emin olun.</span>
                        </div>
                    </div>

                    {/* Loader */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-[#f0f2f5] flex flex-col items-center justify-center z-10">
                            <div className="w-16 h-16 border-4 border-[#00a884]/20 border-t-[#00a884] rounded-full animate-spin mb-4"></div>
                            <div className="text-gray-500 font-medium animate-pulse">WhatsApp Web Yükleniyor...</div>
                        </div>
                    )}

                    {/* The Iframe */}
                    <iframe
                        key={iframeKey}
                        src={iframeSrc}
                        className="w-full h-full border-none"
                        onLoad={handleIframeLoad}
                        title="WhatsApp Web Content"
                        allow="clipboard-read; clipboard-write; camera; microphone; autoplay; payment"
                    />
                </ErrorBoundary>
            </div>

            {/* Bottom Info Bar */}
            <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <Info size={12} />
                        Bu bölüm WhatsApp Web'in canlı görüntüsüdür. CRM verileri arka planda işlenmeye devam eder.
                    </span>
                    <button
                        onClick={() => window.open('https://web.whatsapp.com', '_blank')}
                        className="text-[#00a884] font-bold hover:underline"
                    >
                        Hala 'Hata' mı alıyorsunuz? Yeni sekmede açın
                    </button>
                </div>
                <div className="font-mono opacity-50 flex flex-col items-end">
                    <span>EMBED_MODE: EXT_OVERLAY_V2</span>
                    <span className="text-[8px]">EMBED_PATH: {iframeSrc.replace('https://web.whatsapp.com', '') || '/'}</span>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppBotDashboard;
