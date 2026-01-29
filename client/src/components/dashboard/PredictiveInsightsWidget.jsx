import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Zap, Calendar, Brain, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const PredictiveInsightsWidget = ({ clientId, dealId }) => {
    const [prediction, setPrediction] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [nextAction, setNextAction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPredictions();
    }, [clientId, dealId]);

    const loadPredictions = async () => {
        try {
            setLoading(true);

            if (dealId) {
                const predRes = await api.get(`/predictive/deal/${dealId}`);
                setPrediction(predRes.data);
            }

            if (clientId) {
                const actionRes = await api.get(`/predictive/next-action/${clientId}`);
                setNextAction(actionRes.data);
            }

            const forecastRes = await api.get('/predictive/revenue-forecast');
            setForecast(forecastRes.data);
        } catch (error) {
            console.error('Prediction load error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse bg-gray-100 h-48 rounded-xl"></div>;
    }

    return (
        <div className="space-y-4">
            {/* Revenue Forecast */}
            {forecast && (
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-5 shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="text-sm opacity-90 mb-1 flex items-center gap-2">
                                <TrendingUp size={16} />
                                Tahmin Edilen Ciro (30 Gün)
                            </div>
                            <div className="text-3xl font-black">
                                {(forecast.forecastedRevenue / 1000000).toFixed(2)}M ₺
                            </div>
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                            {forecast.highProbabilityDeals} Yüksek Olasılık
                        </div>
                    </div>
                    <div className="text-xs opacity-75">
                        {forecast.totalDealsInPipeline} aktif anlaşma analiz edildi
                    </div>
                </div>
            )}

            {/* Deal Prediction */}
            {prediction && (
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Brain size={18} className="text-purple-600" />
                                Anlaşma Kapanma Tahmini
                            </h3>
                            <ProbabilityBadge value={prediction.closeProbability} />
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Key Factors */}
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Temel Faktörler</div>
                            <div className="flex flex-wrap gap-2">
                                {prediction.keyFactors?.map((factor, idx) => (
                                    <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                                        {factor}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Suggested Actions */}
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Önerilen Aksiyonlar</div>
                            <div className="space-y-2">
                                {prediction.suggestedActions?.map((action, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                        <Zap size={14} className="text-orange-500 mt-1 shrink-0" />
                                        <span className="text-gray-700">{action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-gray-600">
                                Tahmini kapanış: <strong className="text-gray-800">{prediction.estimatedDaysToClose} gün</strong>
                            </span>
                        </div>

                        {/* Confidence */}
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Güven seviyesi: <span className="font-bold capitalize">{prediction.confidence}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Next Best Action */}
            {nextAction && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-orange-500 text-white p-2 rounded-lg">
                            <Target size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-gray-800 mb-1">Sıradaki En İyi Aksiyon</div>
                            <div className="text-sm text-gray-700 mb-2">{nextAction.reasoning}</div>
                            <div className="flex items-center gap-3 text-xs">
                                <span className={`px-2 py-1 rounded-full font-bold ${nextAction.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                        nextAction.urgency === 'medium' ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {nextAction.urgency === 'high' ? '🔴 Acil' :
                                        nextAction.urgency === 'medium' ? '🟡 Orta' : '🟢 Düşük'} Öncelik
                                </span>
                                <span className="text-gray-600">
                                    Beklenen Etki: <strong>{nextAction.estimatedImpact}%</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProbabilityBadge = ({ value }) => {
    const getColor = () => {
        if (value >= 75) return 'bg-emerald-500';
        if (value >= 50) return 'bg-blue-500';
        if (value >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex items-center gap-2">
            <div className="text-right">
                <div className="text-2xl font-black text-gray-800">{value}%</div>
                <div className="text-xs text-gray-500">Olasılık</div>
            </div>
            <div className={`w-2 h-12 rounded-full ${getColor()}`}></div>
        </div>
    );
};

export default PredictiveInsightsWidget;
