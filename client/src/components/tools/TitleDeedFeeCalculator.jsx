import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, Info, Wallet, Building2, User } from 'lucide-react';
import PriceInput from '../ui/PriceInput';

const TitleDeedFeeCalculator = ({ onBack }) => {
    const [price, setPrice] = useState('');
    const [revolvingFund, setRevolvingFund] = useState('6681'); // 2026 Revalued rate for major districts
    const [results, setResults] = useState(null);

    const calculate = () => {
        const p = parseFloat(price) || 0;
        const rf = parseFloat(revolvingFund) || 0;

        if (p <= 0) {
            setResults(null);
            return;
        }

        const buyerFee = p * 0.02;
        const sellerFee = p * 0.02;
        const totalFee = buyerFee + sellerFee;
        const totalCost = totalFee + rf;

        setResults({
            buyerFee,
            sellerFee,
            totalFee,
            revolvingFund: rf,
            totalCost,
            buyerTotal: buyerFee + rf // Usually buyer pays revolving fund
        });
    };

    useEffect(() => {
        calculate();
    }, [price, revolvingFund]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white rounded-full text-gray-500 shadow-sm transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tapu Harcı Hesaplama</h2>
                    <p className="text-sm text-gray-500 text-balance">Satış bedeli üzerinden tapu harcı ve döner sermaye ödemelerini hesaplayın.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inputs Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Calculator size={16} className="text-blue-600" />
                            Hesaplama Bilgileri
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">
                                    Satış Bedeli (TL)
                                </label>
                                <div className="relative">
                                    <PriceInput
                                        placeholder="Örn: 5.000.000"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                                        value={price}
                                        onChange={(val) => setPrice(val)}
                                    />
                                    <div className="absolute right-4 top-3.5 text-slate-400 font-bold">₺</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">
                                    Döner Sermaye Bedeli
                                </label>
                                <div className="relative">
                                    <PriceInput
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                                        value={revolvingFund}
                                        onChange={(val) => setRevolvingFund(val)}
                                    />
                                    <div className="absolute right-4 top-3.5 text-slate-400 font-bold">₺</div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 flex items-start gap-1">
                                    <Info size={12} className="mt-0.5 flex-shrink-0" />
                                    2026 yılı yeniden değerleme oranı sonrası resmi güncel bedeldir (6.681 TL).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-1">
                            <Info size={16} /> Not
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Tapu harcı aksi kararlaştırılmadıkça alıcı ve satıcı tarafından yarı yarıya (%2 + %2) ödenir. Döner sermaye bedeli genellikle alıcı tarafından karşılanır.
                        </p>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-6">
                    {results ? (
                        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Wallet className="text-emerald-600" />
                                Ödeme Detayları
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 text-blue-800 mb-1">
                                        <User size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wide">Alıcı Ödemesi</span>
                                    </div>
                                    <p className="text-2xl font-black text-blue-900">{formatCurrency(results.buyerTotal)}</p>
                                    <div className="mt-2 text-[11px] text-blue-600 space-y-0.5">
                                        <div className="flex justify-between">
                                            <span>%2 Tapu Harcı:</span>
                                            <span className="font-bold">{formatCurrency(results.buyerFee)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Döner Sermaye:</span>
                                            <span className="font-bold">{formatCurrency(results.revolvingFund)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-2 text-orange-800 mb-1">
                                        <Building2 size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wide">Satıcı Ödemesi</span>
                                    </div>
                                    <p className="text-2xl font-black text-orange-900">{formatCurrency(results.sellerFee)}</p>
                                    <div className="mt-2 text-[11px] text-orange-600 space-y-0.5">
                                        <div className="flex justify-between">
                                            <span>%2 Tapu Harcı:</span>
                                            <span className="font-bold">{formatCurrency(results.sellerFee)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Toplam Maliyet</p>
                                        <h4 className="text-3xl font-black">{formatCurrency(results.totalCost)}</h4>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Harcın Tamamı (%4)</p>
                                        <p className="text-xl font-bold">{formatCurrency(results.totalFee)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-[400px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Calculator size={32} className="opacity-40" />
                            </div>
                            <h4 className="text-slate-600 font-bold mb-2">Hesaplamaya Başlayın</h4>
                            <p className="text-sm max-w-xs">Sol taraftaki kutucuğa satış bedelini girerek masrafları anlık olarak görebilirsiniz.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TitleDeedFeeCalculator;
