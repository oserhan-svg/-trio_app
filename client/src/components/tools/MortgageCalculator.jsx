import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Calendar, Percent } from 'lucide-react';
import PriceInput from '../ui/PriceInput';

const MortgageCalculator = ({ onBack }) => {
    const [loanAmount, setLoanAmount] = useState(1000000);
    const [interestRate, setInterestRate] = useState(3.05); // Monthly rate
    const [termMonths, setTermMonths] = useState(120);

    const [result, setResult] = useState(null);

    const calculateLoan = () => {
        const principal = parseFloat(loanAmount);
        const rate = parseFloat(interestRate) / 100;
        const months = parseInt(termMonths);

        if (principal > 0 && rate > 0 && months > 0) {
            // Mortgage Formula: M = P * [ r(1+r)^n ] / [ (1+r)^n – 1 ]
            const x = Math.pow(1 + rate, months);
            const monthlyPayment = (principal * x * rate) / (x - 1);
            const totalRepayment = monthlyPayment * months;
            const totalInterest = totalRepayment - principal;

            setResult({
                monthlyPayment,
                totalRepayment,
                totalInterest
            });
        } else {
            setResult(null);
        }
    };

    useEffect(() => {
        calculateLoan();
    }, [loanAmount, interestRate, termMonths]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto h-full flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calculator size={24} />
                        Kredi Hesaplama Aracı
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">Konut kredisi faiz ve geri ödeme planı oluşturun.</p>
                </div>
                {onBack && (
                    <button onClick={onBack} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition text-white">
                        Geri Dön
                    </button>
                )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-y-auto">
                <div className="space-y-6">
                    {/* Loan Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kredi Tutarı (TL)
                        </label>
                        <PriceInput
                            value={loanAmount}
                            onChange={setLoanAmount}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
                            placeholder="Örn: 1.000.000"
                        />
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aylık Faiz Oranı (%)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Percent size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
                                placeholder="3.05"
                            />
                        </div>
                    </div>

                    {/* Term */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vade (Ay)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Calendar size={20} className="text-gray-400" />
                            </div>
                            <select
                                value={termMonths}
                                onChange={(e) => setTermMonths(e.target.value)}
                                className="block w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg text-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="12">12 Ay (1 Yıl)</option>
                                <option value="24">24 Ay (2 Yıl)</option>
                                <option value="36">36 Ay (3 Yıl)</option>
                                <option value="48">48 Ay (4 Yıl)</option>
                                <option value="60">60 Ay (5 Yıl)</option>
                                <option value="72">72 Ay (6 Yıl)</option>
                                <option value="84">84 Ay (7 Yıl)</option>
                                <option value="96">96 Ay (8 Yıl)</option>
                                <option value="120">120 Ay (10 Yıl)</option>
                                <option value="180">180 Ay (15 Yıl)</option>
                                <option value="240">240 Ay (20 Yıl)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col justify-center h-full">
                    {result ? (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="text-center pb-6 border-b border-gray-200">
                                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Aylık Taksit Tutarınız</span>
                                <div className="text-4xl font-black text-indigo-600 mt-2">
                                    {result.monthlyPayment.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Toplam Geri Ödeme</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {result.totalRepayment.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Kredi Tutarı (Anapara)</span>
                                    <span className="font-medium text-gray-900">
                                        {parseFloat(loanAmount).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span className="text-gray-600">Toplam Faiz Tutarı</span>
                                    <span className="font-bold text-red-500">
                                        {result.totalInterest.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 mt-4">
                                * Yasal vergiler (BSMV, KKDF) bankadan bankaya değişiklik gösterebilir. Bu hesaplama tahmini bir plandır.
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <Calculator size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Bilgileri giriniz.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MortgageCalculator;
