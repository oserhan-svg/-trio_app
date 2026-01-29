import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const AILearningDashboard = () => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [stats, setStats] = useState({ processedDeals: 0 });

    useEffect(() => {
        fetchInsights();
        fetchAIStats();
    }, []);

    const fetchAIStats = async () => {
        try {
            const response = await api.get('/ai-learning/stats');
            setStats(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error("Failed to fetch AI stats", error);
        }
    };

    const fetchInsights = async () => {
        try {
            const response = await api.get('/ai-learning/insights');
            setInsights(response.data);
        } catch (error) {
            console.error("Failed to fetch insights", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunOptimization = async () => {
        if (!window.confirm("AI Satış Analizi ve Optimizasyon döngüsünü başlatmak istiyor musunuz? Geçmiş başarılı satışlar analiz edilecektir.")) return;

        setRunning(true);
        try {
            const response = await api.post('/ai-learning/optimize');
            setStats(response.data);
            alert(`Optimizasyon tamamlandı! ${response.data.processedDeals} satış analiz edildi.`);
            fetchInsights();
        } catch (e) {
            alert("Hata: " + e.message);
        } finally {
            setRunning(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.patch(`/ai-learning/insights/${id}/approve`);
            fetchInsights();
        } catch (e) {
            alert("Onaylanamadı: " + e.message);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Bu öneriyi silmek istediğinize emin misiniz?")) return;
        try {
            await api.delete(`/ai-learning/insights/${id}`);
            fetchInsights();
        } catch (e) {
            alert("Silinemedi: " + e.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Zeka verileri yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">AI Öğrenme Merkezi</h1>
                    <p className="text-gray-500">CRM'in satışlardan ve konuşmalardan öğrendiği stratejik veriler.</p>
                </div>
                <button
                    onClick={handleRunOptimization}
                    disabled={running}
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${running
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                        }`}
                >
                    {running ? <span className="animate-spin text-lg">⚙️</span> : '🚀'}
                    {running ? 'Analiz Ediliyor...' : 'Manuel Optimizasyon Başlat'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500 mb-1">AI Başarı Oranı</div>
                    <div className="text-3xl font-bold text-emerald-600">%{stats.performance?.helpfulRate || '0.0'}</div>
                    <div className="mt-2 text-xs text-emerald-600 font-medium">{stats.performance?.helpfulCount} / {stats.performance?.totalFeedback} Olumlu Geri Bildirim</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500 mb-1">Otonom Aksiyonlar</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.automation?.totalInteractions || 0}</div>
                    <div className="mt-2 text-xs text-blue-400 font-medium">AI tarafından kaydedilen işlem</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500 mb-1">Analiz Edilen Satış</div>
                    <div className="text-3xl font-bold text-gray-800">{stats.processedDeals || '20+'}</div>
                    <div className="mt-2 text-xs text-gray-400 font-medium">Son başarılı işlemler</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500 mb-1">Hafıza Kapasitesi</div>
                    <div className="text-3xl font-bold text-purple-600">{insights.length}</div>
                    <div className="mt-2 text-xs text-purple-400 font-medium">Öğrenilen kritik kural</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Market Gaps Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-amber-50">
                        <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                            <span>📊</span> Pazar Boşluk Analizi (Talep &gt; Arz)
                        </h2>
                    </div>
                    <div className="p-6">
                        {stats.marketIntelligence?.gaps?.length > 0 ? (
                            <div className="space-y-4">
                                {stats.marketIntelligence.gaps.map((gap, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                                        <div>
                                            <div className="font-bold text-gray-800">{gap.category}</div>
                                            <div className="text-xs text-gray-500">{gap.demand} Müşteri Talebi vs {gap.supply} İlan Aralığı</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded">
                                                +{gap.gapScore} Puan Boşluk
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 italic py-4">Pazar verisi henüz toplanmadı.</div>
                        )}
                    </div>
                </div>

                {/* Revenue Forecast Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-emerald-50">
                        <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                            <span>💰</span> Tahmini Ciro Öngörüsü (Sıcak Leadler)
                        </h2>
                    </div>
                    <div className="p-6 flex flex-col justify-center h-full">
                        {stats.marketIntelligence?.revenue ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">Sıcak Lead Sayısı</div>
                                        <div className="text-2xl font-bold font-mono text-gray-800">{stats.marketIntelligence.revenue.dealCount}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">Potansiyel Hacim</div>
                                        <div className="text-2xl font-bold font-mono text-indigo-600">
                                            {(stats.marketIntelligence.revenue.potentialVolume / 1000000).toFixed(1)}M ₺
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-emerald-600 p-4 rounded-xl text-white text-center shadow-lg">
                                    <div className="text-xs opacity-80 uppercase tracking-widest font-bold mb-1">Tahmini Komisyon (%2)</div>
                                    <div className="text-3xl font-bold font-mono">
                                        {stats.marketIntelligence.revenue.estimatedCommission.toLocaleString('tr-TR')} ₺
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 text-center italic leading-tight">
                                    * Bu tahminler AI Öncelik Skoru 75+ olan müşteriler ve onlara en uygun güncel ilan fiyatları baz alınarak hesaplanmıştır.
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 italic">Veri hesaplanıyor...</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Öğrenilmiş Öngörüler ve Kurallar</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {insights.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic">
                            Henüz öğrenilmiş bir veri yok. Optimizasyonu başlatarak ilk verileri oluşturabilirsiniz.
                        </div>
                    ) : (
                        insights.map((insight) => (
                            <div key={insight.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${insight.category === 'regional' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {insight.category === 'regional' ? 'Bölgesel Trend' : 'Sistem Talimatı'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${insight.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {insight.status === 'active' ? 'Aktif' : 'Öneri'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(insight.created_at).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">{insight.title}</h3>
                                <div className="bg-white border border-gray-100 rounded-lg p-3 text-sm text-gray-700 mb-4 font-mono leading-relaxed">
                                    {insight.content}
                                </div>
                                {insight.status !== 'active' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(insight.id)}
                                            className="text-xs bg-green-50 text-green-600 px-4 py-2 rounded-lg font-bold hover:bg-green-100 transition-all"
                                        >
                                            ✓ Kuralı Onayla ve Sisteme Dahil Et
                                        </button>
                                        <button
                                            onClick={() => handleReject(insight.id)}
                                            className="text-xs bg-rose-50 text-rose-600 px-4 py-2 rounded-lg font-bold hover:bg-rose-100 transition-all"
                                        >
                                            ✕ Sil
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AILearningDashboard;
