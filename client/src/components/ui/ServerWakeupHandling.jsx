import React, { useState, useEffect } from 'react';
import { Loader2, Server } from 'lucide-react';
import api from '../../services/api';

const ServerWakeupHandling = () => {
    const [status, setStatus] = useState('checking'); // checking, sleeping, awake
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        let timeoutId;

        const checkServer = async () => {
            try {
                // Short timeout for initial check to detect "sleeping" quickly
                await api.get('/health', { timeout: 5000 });
                if (isMounted) setStatus('awake');
            } catch (error) {
                console.warn("Server health check failed, likely sleeping:", error);
                if (isMounted) {
                    setStatus('sleeping');
                    // Retry after delay
                    timeoutId = setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                    }, 3000);
                }
            }
        };

        checkServer();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [retryCount]);

    if (status === 'awake') return null;

    // Only show if checking takes too long (simulated by initial state) or explicitly sleeping
    // However, since we want to be less intrusive initially, let's only show full screen if we are sure it's sleeping or checking takes > 2s
    // To keep it simple: Show nothing for first 2 seconds?
    // Actually, if status is 'sleeping', definitely show.

    if (status === 'checking') {
        // Optional: return null for first few ms to avoid flicker? 
        // For now, let's return null to assume happy path, but if 'sleeping' matches, we show.
        // But if checking hangs, we want to show something.
        // Let's rely on the fact that if it's sleeping, the first request might time out or fail.
        return null;
    }

    return (
        <div className="fixed inset-0 bg-white/90 z-[9999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="bg-indigo-50 p-6 rounded-full mb-6 relative">
                <Server className="w-16 h-16 text-indigo-600" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">Sunucu Başlatılıyor</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
                Sunucu uyku modundaydı, şu an uyanıyor. Bu işlem yaklaşık 30-50 saniye sürebilir.
                Lütfen sayfayı kapatmadan bekleyin.
            </p>

            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm bg-indigo-50 px-4 py-2 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                Bağlantı deneniyor... ({retryCount + 1})
            </div>
        </div>
    );
};

export default ServerWakeupHandling;
