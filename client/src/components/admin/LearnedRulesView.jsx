import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const LearnedRulesView = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await api.get('/ai/knowledge?category=instruction,fix');
            setRules(response.data);
        } catch (error) {
            console.error("Failed to fetch rules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunDiagnostics = async () => {
        if (!window.confirm("Tanılama ve Optimizasyon Döngüsünü şimdi çalıştırmak istiyor musunuz? (Bu işlem 1-2 dakika sürebilir)")) return;

        setRunning(true);
        try {
            // 1. Trigger Tests
            await api.post('/ai/bot/trigger', { action: 'test' });
            alert("Testler başlatıldı. Analiz servisi sonuçları işlediğinde yeni kurallar buraya düşecektir.");

            // Optional: Refresh rules after a delay
            setTimeout(fetchRules, 5000);

        } catch (e) {
            alert("Hata: " + e.message);
        } finally {
            setRunning(false);
        }
    };

    if (loading) return <div className="p-4 text-gray-500">Kendi kendini optimize eden kurallar yükleniyor...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span>🧠</span>
                    Oto-Öğrenilen Kurallar
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{rules.length} Kural</span>
                </h2>
                <button
                    onClick={handleRunDiagnostics}
                    disabled={running}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors font-bold flex items-center gap-1"
                >
                    {running ? <span className="animate-spin">⏳</span> : '⚡'}
                    {running ? 'Çalışıyor...' : 'Tanılama Başlat'}
                </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {rules.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">Henüz otomatik öğrenilmiş bir kural yok.</p>
                ) : (
                    rules.map((rule) => (
                        <div key={rule.id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-indigo-700 text-xs uppercase tracking-wider">{rule.category}</span>
                                <span className="text-xs text-gray-400">{new Date(rule.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{rule.content}</p>
                            <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                                <span>Kaynak:</span>
                                <span className="font-medium text-gray-500">{rule.title}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LearnedRulesView;
