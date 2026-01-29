import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, CheckCircle, Copy, Trash2 } from 'lucide-react';
import api from '../../services/api';

const PortfolioHealthDashboard = () => {
    const [health, setHealth] = useState(null);
    const [duplicates, setDuplicates] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadHealthData();
    }, []);

    const loadHealthData = async () => {
        try {
            setLoading(true);
            const [healthRes, dupRes, anomRes] = await Promise.all([
                api.get('/data-quality/health'),
                api.get('/data-quality/duplicates'),
                api.get('/data-quality/anomalies')
            ]);

            setHealth(healthRes.data);
            setDuplicates(dupRes.data);
            setAnomalies(anomRes.data);
        } catch (error) {
            console.error('Failed to load health data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Analiz ediliyor...</div>;
    }

    if (!health) return null;

    return (
        <div className="space-y-6">
            {/* Health Score Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield size={32} />
                            <h2 className="text-3xl font-black">Portföy Sağlık Skoru</h2>
                        </div>
                        <p className="text-emerald-100">Veri kalitesi ve tutarlılık analizi</p>
                    </div>
                    <div className="text-center">
                        <div className="text-7xl font-black">{health.score}</div>
                        <div className="text-2xl font-bold opacity-90">/ 100</div>
                        <div className={`mt-2 px-4 py-1 rounded-full text-lg font-bold ${health.grade === 'A' ? 'bg-emerald-400' :
                                health.grade === 'B' ? 'bg-blue-400' :
                                    health.grade === 'C' ? 'bg-orange-400' : 'bg-red-400'
                            }`}>
                            Not: {health.grade}
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-4 gap-4">
                <ScoreCard
                    label="Veri Tamlığı"
                    score={health.breakdown.completeness}
                    max={30}
                    icon={<CheckCircle />}
                    color="blue"
                />
                <ScoreCard
                    label="Güncellik"
                    score={health.breakdown.freshness}
                    max={30}
                    icon={<TrendingUp />}
                    color="emerald"
                />
                <ScoreCard
                    label="Benzersizlik"
                    score={health.breakdown.duplicates}
                    max={20}
                    icon={<Copy />}
                    color="purple"
                />
                <ScoreCard
                    label="Fiyat Doğruluğu"
                    score={health.breakdown.pricing}
                    max={20}
                    icon={<Shield />}
                    color="orange"
                />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <TabButton
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        label="Genel Bakış"
                    />
                    <TabButton
                        active={activeTab === 'duplicates'}
                        onClick={() => setActiveTab('duplicates')}
                        label={`Tekrarlar (${duplicates.length})`}
                        badge={duplicates.length}
                    />
                    <TabButton
                        active={activeTab === 'anomalies'}
                        onClick={() => setActiveTab('anomalies')}
                        label={`Anomaliler (${anomalies.length})`}
                        badge={anomalies.length}
                    />
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-2 gap-6">
                            <StatBox label="Toplam İlan" value={health.stats.totalProperties} />
                            <StatBox label="Fotoğraflı" value={health.stats.withImages} percent={(health.stats.withImages / health.stats.totalProperties * 100).toFixed(0)} />
                            <StatBox label="Açıklamalı" value={health.stats.withDescription} percent={(health.stats.withDescription / health.stats.totalProperties * 100).toFixed(0)} />
                            <StatBox label="Son 7 Günde Güncellendi" value={health.stats.recentlyUpdated} percent={(health.stats.recentlyUpdated / health.stats.totalProperties * 100).toFixed(0)} />
                        </div>
                    )}

                    {activeTab === 'duplicates' && (
                        <div className="space-y-4">
                            {duplicates.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">
                                    <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
                                    <p className="text-lg font-bold">Harika! Tekrar eden ilan bulunamadı.</p>
                                </div>
                            ) : (
                                duplicates.map((group, idx) => (
                                    <DuplicateGroup key={idx} group={group} onResolve={loadHealthData} />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'anomalies' && (
                        <div className="space-y-3">
                            {anomalies.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">
                                    <TrendingUp size={48} className="mx-auto mb-4 text-emerald-500" />
                                    <p className="text-lg font-bold">Fiyat anomalisi tespit edilmedi.</p>
                                </div>
                            ) : (
                                anomalies.map((anomaly, idx) => (
                                    <AnomalyCard key={idx} anomaly={anomaly} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ScoreCard = ({ label, score, max, icon, color }) => {
    const percentage = (score / max) * 100;
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        emerald: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600'
    };

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <div className="text-2xl font-black text-gray-800">{score}/{max}</div>
            <div className="text-xs text-gray-500 font-medium mb-2">{label}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full bg-gradient-to-r ${colors[color]} transition-all`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, label, badge }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 font-bold transition relative ${active ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
    >
        {label}
        {badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {badge}
            </span>
        )}
    </button>
);

const StatBox = ({ label, value, percent }) => (
    <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-gray-800">{value}</div>
            {percent && <div className="text-sm text-gray-500">({percent}%)</div>}
        </div>
    </div>
);

const DuplicateGroup = ({ group, onResolve }) => (
    <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
        <div className="flex justify-between items-start mb-3">
            <div>
                <div className="font-bold text-gray-800 flex items-center gap-2">
                    <Copy size={18} className="text-orange-600" />
                    {group.count} Benzer İlan
                </div>
                <div className="text-sm text-gray-600">{group.reason}</div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
            {group.properties.map(prop => (
                <div key={prop.id} className="bg-white p-3 rounded border border-gray-200 text-sm">
                    <div className="font-bold text-gray-800 line-clamp-1">{prop.title}</div>
                    <div className="text-gray-600">{(prop.price / 1000).toFixed(0)}K ₺</div>
                </div>
            ))}
        </div>
    </div>
);

const AnomalyCard = ({ anomaly }) => (
    <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50 flex justify-between items-center">
        <div className="flex-1">
            <div className="font-bold text-gray-800 line-clamp-1 mb-1">
                {anomaly.property.title}
            </div>
            <div className="text-sm text-gray-600">
                {anomaly.type === 'unusually_high' && `Bölge ortalamasının %${anomaly.difference} üzerinde`}
                {anomaly.type === 'unusually_low' && `Bölge ortalamasının %${Math.abs(anomaly.difference)} altında`}
                {anomaly.type === 'drastic_change' && `%${anomaly.changePercent} fiyat değişimi`}
            </div>
        </div>
        <div className="text-right">
            <div className="text-lg font-black text-red-600">
                {(anomaly.property.price / 1000).toFixed(0)}K ₺
            </div>
            {anomaly.districtAvg && (
                <div className="text-xs text-gray-500">
                    Ort: {(anomaly.districtAvg / 1000).toFixed(0)}K ₺
                </div>
            )}
        </div>
    </div>
);

export default PortfolioHealthDashboard;
