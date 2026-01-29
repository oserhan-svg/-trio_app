import React, { useState, useEffect } from 'react';
import { Calculator, Wallet, Percent, Landmark, Info, ArrowUpRight } from 'lucide-react';
import api from '../../services/api';

const FinancialAcceleratorWidget = ({ propertyId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFinancials();
    }, [propertyId]);

    const loadFinancials = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/financials/analyze/${propertyId}`);
            setData(res.data);
        } catch (error) {
            console.error('Financial analysis error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">Finansal plan hazırlanıyor...</div>;
    if (!data) return null;

    const { price, closingCosts, mortgage, investment } = data;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Calculator size={20} />
                    Finansal Yol Haritası & Yatırım Analizi
                </h3>
            </div>

            <div className="p-6">
                {/* Cost Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Purchase Costs */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-1">
                            <Wallet size={12} /> ALIM MALİYETLERİ
                        </div>
                        <div className="space-y-2">
                            <SmallRow label="Tapu Harcı (%4)" value={closingCosts.deedFee.toLocaleString('tr-TR') + ' ₺'} />
                            <SmallRow label="Hizmet Bedeli (%2)" value={closingCosts.agentFee.toLocaleString('tr-TR') + ' ₺'} />
                            <SmallRow label="Döner Sermaye / Noter" value={closingCosts.otherFees.toLocaleString('tr-TR') + ' ₺'} />
                            <div className="pt-2 border-t mt-2 flex justify-between">
                                <span className="text-xs font-black text-slate-800">TOPLAM MALİYET</span>
                                <span className="text-xs font-black text-indigo-600">{(price + closingCosts.total).toLocaleString('tr-TR')} ₺</span>
                            </div>
                        </div>
                    </div>

                    {/* Investment Yield */}
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <div className="text-[10px] font-black text-emerald-600 uppercase mb-3 flex items-center gap-1">
                            <ArrowUpRight size={12} /> YATIRIM ANALİZİ (ROI)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs font-bold text-gray-500">Kira Getirisi (Yıllık)</div>
                                <div className="text-sm font-black text-emerald-700">%{investment.grossCapRate}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-500">Amortisman</div>
                                <div className="text-sm font-black text-emerald-700">{investment.paybackPeriodYears} Yıl</div>
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-emerald-100">
                            <div className="text-[10px] text-emerald-600 font-bold uppercase">TAHMİNİ AYLIK KİRA</div>
                            <div className="text-lg font-black text-emerald-800">{investment.estimatedMonthlyRent.toLocaleString('tr-TR')} ₺</div>
                        </div>
                    </div>
                </div>

                {/* Mortgage Simulator */}
                <div className="bg-white border-2 border-gray-100 rounded-xl p-4">
                    <div className="text-[10px] font-black text-gray-400 uppercase mb-4 flex items-center gap-1">
                        <Landmark size={12} /> KREDİ SİMÜLATÖRÜ (%25 PEŞİNAT İLE)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mortgage.options.map((opt, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div>
                                    <div className="text-xs font-black text-gray-800">{opt.title} Vade</div>
                                    <div className="text-[10px] text-gray-400">Sabit Ödemeli</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-indigo-600">{opt.monthlyPayment.toLocaleString('tr-TR')} ₺</div>
                                    <div className="text-[9px] text-gray-400">aylık</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Gereken Peşinat:</span>
                        <span className="font-black text-gray-800">{mortgage.downPaymentRequired.toLocaleString('tr-TR')} ₺</span>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex gap-2">
                    <Info size={16} className="text-blue-500 shrink-0" />
                    <p className="text-[10px] text-blue-700 leading-tight">
                        * Bu hesaplamalar güncel piyasa verilerine dayalı tahmindir. Kesin maliyetler banka onayına ve belediye rayiçlerine göre değişebilir.
                    </p>
                </div>
            </div>
        </div>
    );
};

const SmallRow = ({ label, value }) => (
    <div className="flex justify-between text-[10px]">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="font-bold text-slate-800">{value}</span>
    </div>
);

export default FinancialAcceleratorWidget;
