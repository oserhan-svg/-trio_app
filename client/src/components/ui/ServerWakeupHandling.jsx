import React, { useState, useEffect } from 'react';
import { Loader2, Server, Activity, Sparkles, Wifi } from 'lucide-react';
import api from '../../services/api';

const ServerWakeupHandling = () => {
    const [status, setStatus] = useState('checking'); // checking, sleeping, awake, error
    const [retryCount, setRetryCount] = useState(0);

    const MAX_RETRIES = 60; // 2 minutes total coverage

    useEffect(() => {
        let isMounted = true;
        let timeoutId;

        const checkServer = async () => {
            try {
                // Use health endpoint with cache-busting
                await api.get('/health', {
                    timeout: 6000,
                    params: { _t: Date.now() }
                });
                if (isMounted) setStatus('awake');
            } catch (error) {
                console.warn("Server wakeup check:", error.message);

                // Any response (like 404, 500, etc.) means the server process is RUNNING
                if (error.response || (error.code && error.code !== 'ECONNABORTED')) {
                    console.log("Server process detected (via error response). Awakening UI...");
                    if (isMounted) setStatus('awake');
                    return;
                }

                if (isMounted) {
                    if (retryCount >= MAX_RETRIES) {
                        setStatus('error');
                        return;
                    }

                    setStatus('sleeping');
                    timeoutId = setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                    }, 2500);
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

    if (status === 'error') {
        return (
            <div className="fixed inset-0 bg-[#f8fafc]/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-700">
                <div className="bg-rose-50 p-8 rounded-[2.5rem] mb-8 shadow-2xl shadow-rose-500/10 border border-rose-100">
                    <Wifi className="w-16 h-16 text-rose-600 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Bağlantı Kesildi</h2>
                <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium leading-relaxed uppercase text-[11px] tracking-widest opacity-70">
                    Sunucu şu an erişilebilir değil. Lütfen internet hattınızı kontrol edin veya teknik ekibe danışın.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    if (status === 'checking') return null;

    return (
        <div className="fixed inset-0 bg-[#f8fafc]/90 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full animate-pulse delay-700" />

            <div className="relative mb-10">
                <div className="bg-white/50 backdrop-blur-3xl p-10 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white relative z-10 group overflow-hidden">
                    {/* Animated Beam */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                    <Server className="w-20 h-20 text-slate-900 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />

                    <div className="h-1.5 w-32 bg-slate-100 rounded-full mx-auto overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                            style={{ width: `${Math.min(100, ((retryCount + 1) / MAX_RETRIES) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Floating Status Indicator */}
                <div className="absolute -top-3 -right-3 bg-white px-4 py-2 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-2 z-20 animate-bounce">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">GÜÇ VERİLİYOR</span>
                </div>
            </div>

            <div className="space-y-4 max-w-sm relative z-10">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Sunucu <span className="text-blue-600">Başlatılıyor</span></h2>
                <div className="flex flex-col gap-1 items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-60">Sİstem Bulut Modunda Uyuyordu</span>
                    <span className="text-sm font-bold text-slate-600">Merkezİ Verİ Tabanı Uyandırılıyor...</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed pt-2">
                    Bu işlem yaklaşık 30-50 saniye sürebilir.<br />Lütfen sayfayı kapatmadan bekleyİn.
                </p>

                {retryCount > 10 && (
                    <button
                        onClick={() => setStatus('awake')}
                        className="mt-6 text-[10px] font-black text-blue-600 underline uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                    >
                        Yİne de Devam Et (Dashboard'u Zorla Aç)
                    </button>
                )}
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 relative z-10">
                <div className="flex items-center gap-4 px-6 py-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-xl">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                    </div>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                        DENEME #{retryCount + 1}
                    </span>
                    <div className="w-px h-4 bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase">AKTİF</span>
                    </div>
                </div>

                <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
                    Bulut Altyapısı Senkronİze Edİlİyor
                </div>
            </div>
        </div>
    );
};

export default ServerWakeupHandling;
