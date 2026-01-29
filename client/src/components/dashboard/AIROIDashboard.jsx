import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Zap, Award, BarChart3 } from 'lucide-react';
import api from '../../services/api';

const AIROIDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(30);

    useEffect(() => {
        fetchROIData();
    }, [timeRange]);

    const fetchROIData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/ai-analytics/roi?days=${timeRange}`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch ROI data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Veriler yükleniyor...</div>;
    }

    if (!data) return null;

    const { summary, featureUsage, acceptanceRates } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="text-purple-600" />
                    AI Yatırım Getirisi (ROI) Analizi
                </h2>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                >
                    <option value={7}>Son 7 Gün</option>
                    <option value={30}>Son 30 Gün</option>
                    <option value={90}>Son 90 Gün</option>
                </select>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<DollarSign className="text-emerald-600" />}
                    label="AI Destekli Ciro"
                    value={`${(summary.totalRevenue / 1000000).toFixed(1)}M ₺`}
                    change="+24%"
                    color="emerald"
                />
                <MetricCard
                    icon={<Award className="text-blue-600" />}
                    label="AI Katkılı Anlaşma"
                    value={summary.aiInfluencedDeals}
                    subtitle={`Ort: ${(summary.avgDealSize / 1000).toFixed(0)}K ₺`}
                    color="blue"
                />
                <MetricCard
                    icon={<Clock className="text-orange-600" />}
                    label="Kazanılan Zaman"
                    value={`${Math.round(summary.totalTimeSaved / 60)}h`}
                    subtitle={`${summary.totalTimeSaved} dakika`}
                    color="orange"
                />
                <MetricCard
                    icon={<Zap className="text-purple-600" />}
                    label="AI Aksiyon Sayısı"
                    value={featureUsage.reduce((sum, f) => sum + f.uses, 0)}
                    subtitle="Toplam kullanım"
                    color="purple"
                />
            </div>

            {/* Feature Performance */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-gray-700">
                    Özellik Bazlı Performans
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-medium text-left">Özellik</th>
                                <th className="px-4 py-3 font-medium text-right">Kullanım</th>
                                <th className="px-4 py-3 font-medium text-right">Kabul Oranı</th>
                                <th className="px-4 py-3 font-medium text-right">Ciro Katkısı</th>
                                <th className="px-4 py-3 font-medium text-right">Zaman Tasarrufu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {featureUsage.map((feature, idx) => {
                                const acceptance = acceptanceRates.find(a => a.feature === feature.feature);
                                const featureNames = {
                                    'semantic_match': 'Semantik Eşleşme',
                                    'negotiation_assist': 'Müzakere Asistanı',
                                    'proactive_pitch': 'Proaktif Öneri',
                                    'market_analysis': 'Piyasa Analizi',
                                    'content_generation': 'İçerik Üretimi'
                                };

                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {featureNames[feature.feature] || feature.feature}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">{feature.uses}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-blue-600 font-bold">
                                                {acceptance?.acceptanceRate || 0}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                                            {(feature.revenue / 1000).toFixed(0)}K ₺
                                        </td>
                                        <td className="px-4 py-3 text-right text-orange-600">
                                            {feature.timeSaved} dk
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insight Box */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <TrendingUp className="text-purple-600 mt-1" size={20} />
                    <div>
                        <h3 className="font-bold text-gray-800 mb-1">AI Etki Özeti</h3>
                        <p className="text-sm text-gray-600">
                            Son {timeRange} günde AI özellikleri <strong className="text-purple-600">{summary.aiInfluencedDeals} anlaşmayı</strong> doğrudan etkiledi,
                            danışmanlarınıza toplam <strong className="text-orange-600">{Math.round(summary.totalTimeSaved / 60)} saat</strong> kazandırdı ve
                            <strong className="text-emerald-600"> {(summary.totalRevenue / 1000000).toFixed(1)}M ₺</strong> ciroya katkıda bulundu.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, subtitle, change, color }) => {
    const colors = {
        emerald: 'bg-emerald-50 border-emerald-100',
        blue: 'bg-blue-50 border-blue-100',
        orange: 'bg-orange-50 border-orange-100',
        purple: 'bg-purple-50 border-purple-100',
    };

    return (
        <div className={`${colors[color]} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
                {icon}
                {change && <span className="text-xs font-bold text-emerald-600">{change}</span>}
            </div>
            <div className="text-2xl font-black text-gray-800 mb-1">{value}</div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </div>
    );
};

export default AIROIDashboard;
