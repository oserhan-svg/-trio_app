import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Save, Clock, Trash2, Send, MapPin, ClipboardList } from 'lucide-react';
import offlineStorage from '../../services/offlineStorage';
import api from '../../services/api';

const FieldVisitManager = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [draftNotes, setDraftNotes] = useState('');
    const [location, setLocation] = useState('');
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        updatePendingCount();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const updatePendingCount = () => {
        const pending = offlineStorage.getPendingSyncings();
        setPendingCount(pending.notes.length);
    };

    const handleSaveOffline = () => {
        if (!draftNotes) return;
        offlineStorage.saveDraft('fieldNotes', {
            text: draftNotes,
            location: location,
            visitDate: new Date().toISOString()
        });
        setDraftNotes('');
        setLocation('');
        updatePendingCount();
    };

    const syncNow = async () => {
        const { notes } = offlineStorage.getPendingSyncings();
        if (notes.length === 0) return;

        for (const note of notes) {
            try {
                await api.post('/field-visits/sync', note.data);
                offlineStorage.markAsSynced('fieldNotes', note.id);
            } catch (err) {
                console.error('Sync failed for note:', note.id);
            }
        }
        updatePendingCount();
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-md mx-auto">
            {/* Status Header */}
            <div className={`p-4 flex items-center justify-between text-white ${isOnline ? 'bg-emerald-600' : 'bg-orange-600'}`}>
                <div className="flex items-center gap-2">
                    {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                    <h3 className="font-bold text-sm">
                        {isOnline ? 'Çevrimiçi (Buluta Bağlı)' : 'Çevrimdışı Mod (Saha Çalışması)'}
                    </h3>
                </div>
                <div className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase">
                    v1.0 Offline-First
                </div>
            </div>

            <div className="p-5">
                {/* Draft Input */}
                <div className="mb-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Saha Notları (Mülk/Müşteri)</label>
                    <textarea
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        placeholder="Örn: Ev sahibi 10.0M altına inmeyecek, camlar yenilenmiş..."
                        className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                </div>

                <div className="flex gap-2 mb-6">
                    <div className="flex-1 relative">
                        <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Konum/Mahalle"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSaveOffline}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                >
                    <Save size={18} />
                    Notu Saha Taslağına Kaydet
                </button>

                {/* Pending Sync Section */}
                {pendingCount > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs uppercase tracking-tight">
                                <Clock size={14} /> {pendingCount} Bekleyen Senkronizasyon
                            </div>
                            <button
                                onClick={syncNow}
                                disabled={!isOnline}
                                className={`text-[10px] font-black px-3 py-1 rounded-lg flex items-center gap-1 transition ${isOnline ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={10} /> ŞİMDİ SENKRONİZE ET
                            </button>
                        </div>
                        <div className="space-y-2">
                            <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-[10px] text-orange-800 italic">
                                İnternet bağlantısı geldiğinde notlarınız otomatik olarak bulut veritabanına aktarılacaktır.
                            </div>
                        </div>
                    </div>
                )}

                {!isOnline && pendingCount === 0 && (
                    <div className="mt-8 text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <ClipboardList className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-xs text-gray-400">Şu an kaydedilmiş saha notu bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FieldVisitManager;
