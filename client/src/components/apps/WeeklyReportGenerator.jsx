import React, { useState, useEffect, useRef } from 'react';
import { FileText, ArrowLeft, Download, Send, User, MapPin, TrendingUp, Sparkles, Printer, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../services/api';
import Button from '../ui/Button';
import { useReactToPrint } from 'react-to-print';

const WeeklyReportGenerator = ({ onBack }) => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [companyConfig, setCompanyConfig] = useState(null);

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Pazar_Raporu_${selectedClient?.name || 'Musteri'}`,
    });

    useEffect(() => {
        fetchClients();
        fetchCompanyConfig();
    }, []);

    const fetchCompanyConfig = async () => {
        try {
            const res = await api.get('/settings/company');
            setCompanyConfig(res.data);
        } catch (e) {
            console.error('Failed to fetch company config');
        }
    };

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
            const matchRes = await api.get(`/clients/${client.id}/matches`);
            const analyticsRes = await api.get('/analytics');

            const demand = client.demands?.[0] || {};
            const neighborhoodStats = analyticsRes.data.marketStats?.find(s => s.neighborhood === demand.neighborhood);
            const districtStats = analyticsRes.data.marketStats?.filter(s => s.count > 5).slice(0, 5); // Top 5 for comparison

            setReportData({
                client,
                matches: matchRes.data.slice(0, 3),
                stats: neighborhoodStats || { avgPricePerM2: 0, count: 0 },
                comparisonStats: districtStats || [],
                date: new Date().toLocaleDateString('tr-TR'),
                period: 'Haftalık Piyasa Özeti'
            });
        } catch (error) {
            console.error('Report generation failed:', error);
        } finally {
            setLoading(false);
        }
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
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Action Bar */}
                    <div className="flex justify-end gap-3 print:hidden">
                        <Button variant="outline" onClick={() => setSelectedClient(null) || setReportData(null)}>
                            Değiştir
                        </Button>
                        <Button onClick={handlePrint} className="flex items-center gap-2 bg-gray-900 text-white hover:bg-black">
                            <Printer size={18} /> Yazdır / PDF İndir
                        </Button>
                    </div>

                    {/* Report Content - A4 Scaled */}
                    <div className="overflow-auto bg-gray-100 p-8 print:p-0 print:bg-white flex justify-center">
                        <div
                            ref={componentRef}
                            className="bg-white px-12 py-12 shadow-xl print:shadow-none w-[210mm] min-h-[297mm] flex flex-col relative"
                            style={{ margin: '0 auto' }} // Center for view, print handles itself
                        >
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                <h1 className="text-[12rem] font-black transform -rotate-45">
                                    {companyConfig?.companyName?.split(' ')[0] || 'TRIO'}
                                </h1>
                            </div>

                            {/* Header */}
                            <div className="flex justify-between items-end border-b-2 border-gray-900 pb-6 mb-8">
                                <div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">PİYASA RAPORU</h1>
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm uppercase tracking-wider">
                                        <TrendingUp size={16} />
                                        {reportData.period}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900 text-lg">
                                        {companyConfig?.companyName || 'Trio Emlak'}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center justify-end gap-1">
                                        <Calendar size={12} /> {reportData.date}
                                    </div>
                                </div>
                            </div>

                            {/* Client & Region Summary */}
                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Müşteri</h3>
                                    <div className="text-xl font-bold text-gray-900">{reportData.client.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {reportData.client.demands?.[0]?.neighborhood ?
                                            `${reportData.client.demands[0].neighborhood} Bölgesi İlgisi` :
                                            'Genel Yatırım İlgisi'}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100">
                                    <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Piyasa Analizi</h3>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-2xl font-black text-gray-900">{Math.round(reportData.stats.avgPricePerM2).toLocaleString()} ₺</div>
                                            <div className="text-xs text-emerald-800 font-medium">Bölge m² Ortalaması</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-gray-900">{reportData.stats.count}</div>
                                            <div className="text-xs text-emerald-800 font-medium">Aktif İlan</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Comparison Chart */}
                            {reportData.comparisonStats.length > 0 && (
                                <div className="mb-10">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-3">
                                        Bölgesel Fiyat Karşılaştırması (m²)
                                    </h3>
                                    <div className="h-48 w-full bg-white">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={reportData.comparisonStats}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis dataKey="neighborhood" tick={{ fontSize: 10 }} interval={0} height={30} tickFormatter={(val) => val.split(' ')[0]} />
                                                <Tooltip
                                                    cursor={{ fill: '#f9fafb' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="avgPricePerM2" radius={[4, 4, 0, 0]}>
                                                    {reportData.comparisonStats.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.neighborhood === reportData.stats.neighborhood ? '#059669' : '#e5e7eb'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            <div className="flex-1">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 border-l-4 border-yellow-500 pl-3">
                                    Önerilen Fırsatlar
                                </h3>
                                <div className="space-y-4">
                                    {reportData.matches.length > 0 ? reportData.matches.map((m, idx) => (
                                        <div key={m.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
                                            <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
                                                {/* Image Placeholder or Actual Image if available in future */}
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                    <FileText size={24} />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-gray-900 truncate pr-4">{m.title}</h4>
                                                    <span className="font-black text-emerald-700 whitespace-nowrap">{parseInt(m.price).toLocaleString()} ₺</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">{m.neighborhood}, {m.district} • {m.rooms} • {m.size_m2} m²</p>
                                                <div className="flex gap-2">
                                                    <div className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                        SCORE: %{m.match_quality || 85}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-6 text-center text-sm text-gray-500 italic bg-gray-50 rounded-lg">
                                            Bu hafta kriterlerinize uygun yeni fırsat ilanı düşmemiştir.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto pt-8 border-t border-gray-200">
                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                    <p>Bu rapor Trio Emlak Market Intelligence sistemi tarafından otomatik oluşturulmuştur.</p>
                                    <p>Sadece bilgilendirme amaçlıdır. Yatırım tavsiyesi değildir.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyReportGenerator;
