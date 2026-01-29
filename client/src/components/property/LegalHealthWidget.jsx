import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, FileSearch, Scale, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const LegalHealthWidget = ({ propertyId, initialData }) => {
    const [analysis, setAnalysis] = useState(initialData?.legal_check?.analysis || null);
    const [analyzing, setAnalyzing] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentType', 'TAPU');

        try {
            setAnalyzing(true);
            const res = await api.post(`/properties/${propertyId}/analyze-legal-doc`, formData);
            setAnalysis(res.data);
        } catch (error) {
            alert('Belge analizi başarısız oldu.');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-900 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Scale size={20} className="text-blue-300" />
                    AI Hukuki Uygunluk & Tapu Analizi
                </h3>
                {analysis && analysis.risks?.some(r => r.level === 'high') ? (
                    <span className="bg-red-500 text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
                        RİSKLİ BELGE
                    </span>
                ) : analysis ? (
                    <span className="bg-emerald-500 text-[10px] font-black px-2 py-1 rounded-full">
                        GÜVENLİ
                    </span>
                ) : null}
            </div>

            <div className="p-6">
                {!analysis && !analyzing ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <FileSearch size={32} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-xs text-gray-500 mb-4">Tapu fotokopisi veya İmar belgesi yükleyerek AI analizini başlatın.</p>
                        <label className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-lg shadow-indigo-100">
                            Belge Yükle ve Analiz Et
                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                        </label>
                    </div>
                ) : analyzing ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-sm font-bold text-gray-700">Tapu Verileri AI Tarafından Çözümleniyor...</p>
                        <p className="text-[10px] text-gray-400">Şerh ve ipotek durumu kontrol ediliyor.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3">
                            <ShieldCheck className="text-indigo-600 shrink-0" size={24} />
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">AI ÖZETİ</div>
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                    {analysis.summary}
                                </p>
                            </div>
                        </div>

                        {/* Doc Info Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <InfoBox label="Ada / Parsel" value={`${analysis.docInfo?.ada || '-'} / ${analysis.docInfo?.parsel || '-'}`} />
                            <InfoBox label="Mülkiyet Tipi" value={analysis.docInfo?.type || 'Bilinmiyor'} />
                            <InfoBox label="Tapu Alanı" value={analysis.docInfo?.m2 || 'Bilinmiyor'} />
                            <InfoBox label="Durum" value={analysis.risks?.length > 0 ? 'Riskli' : 'Sorunsuz'} />
                        </div>

                        {/* Risks Section */}
                        {analysis.risks?.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-1">TESPİT EDİLEN RİSKLER</h4>
                                {analysis.risks.map((risk, idx) => (
                                    <div key={idx} className={`p-3 rounded-lg border flex gap-3 ${risk.level === 'high' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'
                                        }`}>
                                        {risk.level === 'high' ? <AlertTriangle className="text-red-500 shrink-0" size={18} /> : <AlertTriangle className="text-orange-500 shrink-0" size={18} />}
                                        <div className="text-xs font-bold text-gray-700">{risk.description}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Legal Action */}
                        <div className="mt-4 p-3 bg-slate-800 rounded-lg text-white">
                            <div className="text-[10px] font-bold text-white/50 uppercase mb-1">BİR SONRAKİ HUKUKİ ADIM</div>
                            <div className="text-xs font-medium flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-400" />
                                {analysis.actionNeeded}
                            </div>
                        </div>

                        <button
                            onClick={() => setAnalysis(null)}
                            className="w-full text-[10px] text-gray-400 hover:text-indigo-600 font-bold uppercase py-2"
                        >
                            Yeni Belge Analiz Et
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoBox = ({ label, value }) => (
    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
        <div className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{label}</div>
        <div className="text-xs font-black text-gray-800 line-clamp-1">{value}</div>
    </div>
);

export default LegalHealthWidget;
