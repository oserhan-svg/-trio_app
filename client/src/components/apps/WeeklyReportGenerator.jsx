import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft, Download, Send, User, MapPin, TrendingUp, Sparkles, Printer } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';

const WeeklyReportGenerator = ({ onBack }) => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        }
    };

    const generateReport = async (client) => {
        setLoading(true);
        setSelectedClient(client);
        try {
            // Fetch matches and analytics for the target area
            const matchRes = await api.get(`/clients/${client.id}/matches`);
            const analyticsRes = await api.get('/analytics');

            const demand = client.demands?.[0] || {};
            const neighborhoodStats = analyticsRes.data.marketStats?.find(s => s.neighborhood === demand.neighborhood);

            setReportData({
                client,
                matches: matchRes.data.slice(0, 3), // Top 3 matches
                stats: neighborhoodStats || { avgPricePerM2: 0, count: 0 },
                date: new Date().toLocaleDateString('tr-TR'),
                period: 'Haftalık Piyasa Özeti'
            });
        } catch (error) {
            console.error('Report generation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Müşteri Pazar Raporu</h2>
                        <p className="text-sm text-gray-500">Müşteriye özel haftalık piyasa analizi oluşturun.</p>
                    </div>
                </div>
            </div>

            {!reportData ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 print:hidden">
                    <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                        <User size={16} className="text-blue-600" />
                        Rapor Hazırlanacak Müşteriyi Seçin
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => generateReport(client)}
                                className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            >
                                <div className="font-bold text-gray-800">{client.name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {client.demands?.[0]?.neighborhood || 'Bölge Belirtilmemiş'} / {client.demands?.[0]?.rooms || 'Standart'}
                                </div>
                                <div className="mt-3 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Rapor Oluştur <Sparkles size={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Action Bar */}
                    <div className="flex justify-end gap-3 print:hidden">
                        <Button variant="outline" onClick={() => setSelectedClient(null) || setReportData(null)}>
                            Değiştir
                        </Button>
                        <Button onClick={handlePrint} className="flex items-center gap-2">
                            <Printer size={18} /> Yazdır / PDF
                        </Button>
                    </div>

                    {/* Report Content */}
                    <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-lg min-h-[1000px] print:border-0 print:shadow-none print:p-0">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-4 border-emerald-600 pb-8 mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2">PİYASA RAPORU</h1>
                                <p className="text-emerald-700 font-bold tracking-widest text-sm uppercase">{reportData.period}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-800">TrioApp Danışmanlık</p>
                                <p className="text-sm text-gray-500">{reportData.date}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mb-12">
                            <div>
                                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Müşteri Bilgisi</h3>
                                <div className="text-xl font-bold text-gray-900">{reportData.client.name}</div>
                                <div className="text-gray-500 mt-2 flex items-center gap-2">
                                    <MapPin size={16} />
                                    {reportData.client.demands?.[0]?.neighborhood || 'Genel'} Bölgesi
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4">Bölge Verileri</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-emerald-100 pb-2">
                                        <span className="text-sm text-emerald-800">Ort. m² Fiyatı</span>
                                        <span className="font-bold text-gray-900">{Math.round(reportData.stats.avgPricePerM2).toLocaleString()} ₺</span>
                                    </div>
                                    <div className="flex justify-between border-b border-emerald-100 pb-2">
                                        <span className="text-sm text-emerald-800">Bölgedeki Aktif İlan</span>
                                        <span className="font-bold text-gray-900">{reportData.stats.count} Adet</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Matches section */}
                        <div className="mb-12">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Sparkles size={16} />
                                SİZİN İÇİN SEÇTİKLERİMİZ
                            </h3>
                            <div className="space-y-4">
                                {reportData.matches.length > 0 ? reportData.matches.map((m, idx) => (
                                    <div key={m.id} className="p-5 border border-gray-100 rounded-2xl bg-slate-50 flex gap-6">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-xl text-blue-600 shadow-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="font-bold text-gray-900">{m.title}</h4>
                                                <span className="font-black text-emerald-700">{parseInt(m.price).toLocaleString()} ₺</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{m.neighborhood}, {m.district} • {m.rooms} • {m.size_m2} m²</p>
                                            <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                UYUM SCORE: %{m.match_quality || 85}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400">
                                        Bu kriterlere uygun yeni ilan bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Market Trend Footer */}
                        <div className="mt-auto pt-12 border-t border-gray-100 text-center">
                            <p className="text-gray-400 text-xs italic">Tüm veriler TrioApp Market Intelligence sistemi tarafından canlı olarak analiz edilmiştir.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyReportGenerator;
