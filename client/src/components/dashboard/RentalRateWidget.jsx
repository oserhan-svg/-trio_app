import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Building2, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const RentalRateWidget = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings(res.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await api.post('/settings/refresh-rental-rate');
            const historyArray = res.data?.data;

            if (!Array.isArray(historyArray) || historyArray.length === 0) {
                toast.error("Format hatası.");
                return;
            }
            const current = historyArray[0];

            setSettings(prev => ({
                ...prev,
                rental_rate_residential: current.residential,
                rental_rate_commercial: current.commercial,
                rental_rate_month: current.month,
                rental_rate_history: JSON.stringify(historyArray)
            }));
            toast.success('Güncellendi');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.details || "Hata oluştu";
            toast.error(msg);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) return null;

    const rate = settings?.rental_rate_residential || '-';
    const commercialRate = settings?.rental_rate_commercial || '-';
    const month = settings?.rental_rate_month || 'Ocak 2026';

    const renderHistory = () => {
        if (!settings?.rental_rate_history) return null;
        try {
            const history = JSON.parse(settings.rental_rate_history);
            if (!Array.isArray(history)) return null;

            return history.slice(1, 4).map((h, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5 last:border-0">
                    <span className="text-indigo-200 w-16 truncate">{h.month}</span>
                    <span className="text-white font-mono">%{h.residential}</span>
                    <span className="text-white font-mono">%{h.commercial}</span>
                </div>
            ));
        } catch (error) {
            return null;
        }
    };

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-4 text-white shadow-md h-full flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
                        TÜİK Kira Oranları
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-medium opacity-90">
                            {month}
                        </span>
                    </h2>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`p-1.5 bg-white/10 hover:bg-white/20 rounded transition-all ${refreshing ? 'animate-spin' : ''}`}
                    title="Güncelle"
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                {/* Residential */}
                <div className="bg-white/10 rounded-lg p-2 flex flex-col justify-center items-center border border-white/5 relative overflow-hidden group">
                    <Building2 className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-white/10 transition-colors" size={40} />

                    <div className="flex items-center gap-1.5 text-indigo-100 text-xs font-medium mb-0.5 z-10">
                        <Building2 size={12} /> Konut
                    </div>
                    <div className="text-xl font-bold tracking-tight z-10">%{rate}</div>
                </div>

                {/* Commercial */}
                <div className="bg-white/10 rounded-lg p-2 flex flex-col justify-center items-center border border-white/5 relative overflow-hidden group">
                    <Store className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-white/10 transition-colors" size={40} />

                    <div className="flex items-center gap-1.5 text-indigo-100 text-xs font-medium mb-0.5 z-10">
                        <Store size={12} /> İşyeri
                    </div>
                    <div className="text-xl font-bold tracking-tight z-10">%{commercialRate}</div>
                </div>
            </div>

            {/* Compact History Toggle */}
            {settings?.rental_rate_history && (
                <div className="mt-2 text-center">
                    <button
                        onClick={() => setHistoryVisible(!historyVisible)}
                        className="text-[10px] font-medium text-indigo-200 hover:text-white transition-colors"
                    >
                        {historyVisible ? 'Geçmişi Gizle' : 'Geçmiş Veriler'}
                    </button>

                    {historyVisible && (
                        <div className="absolute left-0 top-0 w-full h-full bg-indigo-900/95 backdrop-blur-md p-3 z-20 flex flex-col">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                                <span className="font-bold text-xs text-white">Geçmiş Dönemler</span>
                                <button onClick={() => setHistoryVisible(false)} className="text-xs text-indigo-300 hover:text-white">Kapat</button>
                            </div>

                            <div className="flex justify-between text-[10px] font-bold text-indigo-300 mb-2 px-1">
                                <span className="w-16">Dönem</span>
                                <span>Konut</span>
                                <span>İşyeri</span>
                            </div>

                            <div className="space-y-2 overflow-y-auto flex-1">
                                {renderHistory()}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RentalRateWidget;
