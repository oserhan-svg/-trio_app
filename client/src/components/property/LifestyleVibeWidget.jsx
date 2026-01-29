import React, { useState, useEffect } from 'react';
import { Coffee, Map, Compass, Users, Sparkles, Wind } from 'lucide-react';
import api from '../../services/api';

const LifestyleVibeWidget = ({ propertyId }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalysis();
    }, [propertyId]);

    const loadAnalysis = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/lifestyle/analyze/${propertyId}`);
            setAnalysis(res.data);
        } catch (error) {
            console.error('Lifestyle analysis error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">Bölge ruhu analiz ediliyor...</div>;
    if (!analysis) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Wind size={20} />
                    Mahalle Ruhu & Yaşam Senaryosu
                </h3>
                <span className="bg-white/20 text-[10px] font-black px-2 py-1 rounded-full">
                    LIFESTYLE ANALİZİ
                </span>
            </div>

            <div className="p-6">
                {/* Vibe Tags */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    <VibeTag icon={<Sparkles size={14} />} label="Hissiyat" value={analysis.vibe} />
                    <VibeTag icon={<Compass size={14} />} label="Yürünebilirlik" value={analysis.walkability} />
                    <VibeTag icon={<Coffee size={14} />} label="Gürültü" value={analysis.noiseLevel} />
                    <VibeTag icon={<Users size={14} />} label="Heef Kitle" value={analysis.idealAudience} />
                </div>

                {/* Narrative Section */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Map size={64} />
                    </div>
                    <h4 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
                        🌟 Burada Bir Gününüz Nasıl Geçer?
                    </h4>
                    <div className="text-sm text-slate-600 leading-relaxed italic whitespace-pre-line">
                        {analysis.narrative}
                    </div>
                </div>

                <div className="mt-4 text-[10px] text-gray-400 italic text-center">
                    "İnsanlar bina değil, o binanın içindeki hayatı satın alırlar."
                </div>
            </div>
        </div>
    );
};

const VibeTag = ({ icon, label, value }) => (
    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
        <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
            {icon} {label}
        </div>
        <div className="text-xs font-black text-gray-700">{value}</div>
    </div>
);

export default LifestyleVibeWidget;
