import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, TrendingUp, Info } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CapitalGainsCalculator = ({ onBack }) => {
    // Constants for 2024 (Can be updated)
    const EXEMPTION_AMOUNT = 87000; // 2024 İstisna Tutarı
    const TAX_BRACKETS = [
        { limit: 110000, rate: 0.15 },
        { limit: 230000, rate: 0.20 },
        { limit: 870000, rate: 0.27 },
        { limit: 3000000, rate: 0.35 },
        { limit: Infinity, rate: 0.40 }
    ];

    const [values, setValues] = useState({
        purchaseDate: '',
        purchasePrice: '',
        saleDate: '',
        salePrice: '',
        expenses: '0',
        purchasePPI: '', // Yİ-ÜFE Alış
        salePPI: ''      // Yİ-ÜFE Satış
    });

    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        setValues({ ...values, [e.target.id]: e.target.value });
    };

    const calculate = (e) => {
        e.preventDefault();

        const pDate = new Date(values.purchaseDate);
        const sDate = new Date(values.saleDate);
        const pPrice = parseFloat(values.purchasePrice);
        const sPrice = parseFloat(values.salePrice);
        const expense = parseFloat(values.expenses) || 0;
        const pPPI = parseFloat(values.purchasePPI) || 0;
        const sPPI = parseFloat(values.salePPI) || 0;

        if (!pDate || !sDate || !pPrice || !sPrice) {
            alert('Lütfen tarih ve fiyat bilgilerini eksiksiz giriniz.');
            return;
        }

        // 1. 5 Year Rule Check
        const diffTime = Math.abs(sDate - pDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fiveYearsDays = 365 * 5 + 1; // Approx
        // More precise 5 year check
        const fiveYearCheckDate = new Date(pDate);
        fiveYearCheckDate.setFullYear(pDate.getFullYear() + 5);

        if (sDate >= fiveYearCheckDate) {
            setResult({
                isExempt: true,
                message: '5 yılı doldurduğunuz için değer artış kazancı vergisinden muafsınız.',
                tax: 0
            });
            return;
        }

        // 2. Inflation Adjustment (Endeksleme)
        // Rule: Price difference in PPI must be > 10% to apply indexing
        let adjustedCost = pPrice;
        let inflationRate = 0;

        if (pPPI > 0 && sPPI > 0) {
            inflationRate = (sPPI - pPPI) / pPPI;
            if (inflationRate > 0.10) {
                adjustedCost = pPrice * (sPPI / pPPI);
            }
        }

        // 3. Profit Calculation
        // Gross Profit = Sale Price - (Adjusted Cost + Expenses)
        let realProfit = sPrice - (adjustedCost + expense);

        // 4. Exemption Deduction
        let taxableIncome = realProfit - EXEMPTION_AMOUNT;

        if (taxableIncome <= 0) {
            setResult({
                isExempt: true,
                message: 'Elde edilen kazanç istisna tutarının altında kaldığı için vergi çıkmamaktadır.',
                realProfit,
                tax: 0
            });
            return;
        }

        // 5. Tax Calculation (Progressive)
        let remainingIncome = taxableIncome;
        let totalTax = 0;
        let previousLimit = 0;

        for (const bracket of TAX_BRACKETS) {
            if (remainingIncome <= 0) break;

            const currentBracketRange = bracket.limit - previousLimit;
            const taxableInThisBracket = Math.min(remainingIncome, currentBracketRange);

            totalTax += taxableInThisBracket * bracket.rate;
            remainingIncome -= taxableInThisBracket;
            previousLimit = bracket.limit;
        }

        setResult({
            isExempt: false,
            adjustedCost,
            realProfit,
            taxableIncome,
            tax: totalTax,
            inflationRate
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calculator size={24} />
                        Değer Artış Kazancı Hesaplama Robotu
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">Gayrimenkul alım-satım vergisini kolayca hesaplayın.</p>
                </div>
                {onBack && (
                    <button onClick={onBack} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition">
                        Geri Dön
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Form Section */}
                <div className="p-6 border-r border-gray-100">
                    <form onSubmit={calculate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                id="purchaseDate" type="date" label="Alış Tarihi"
                                value={values.purchaseDate} onChange={handleChange} required
                            />
                            <Input
                                id="purchasePrice" type="number" label="Alış Bedeli (TL)"
                                value={values.purchasePrice} onChange={handleChange} required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                id="saleDate" type="date" label="Satış Tarihi"
                                value={values.saleDate} onChange={handleChange} required
                            />
                            <Input
                                id="salePrice" type="number" label="Satış Bedeli (TL)"
                                value={values.salePrice} onChange={handleChange} required
                            />
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <TrendingUp size={16} /> Enflasyon Düzeltmesi (İsteğe Bağlı)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    id="purchasePPI" type="number" label="Alış Tarihi Yİ-ÜFE"
                                    placeholder="Örn: 2500.50"
                                    value={values.purchasePPI} onChange={handleChange}
                                />
                                <Input
                                    id="salePPI" type="number" label="Satış Tarihi Yİ-ÜFE"
                                    placeholder="Örn: 4800.75"
                                    value={values.salePPI} onChange={handleChange}
                                />
                            </div>
                            <div className="mt-2 text-xs text-blue-600">
                                <a href="https://www.tuik.gov.tr/" target="_blank" rel="noreferrer" className="underline">
                                    Güncel Yİ-ÜFE oranlarını görmek için tıklayın (TÜİK)
                                </a>
                            </div>
                        </div>

                        <Input
                            id="expenses" type="number" label="Masraflar (Tapu Harcı vs.)"
                            value={values.expenses} onChange={handleChange}
                        />

                        <Button type="submit" className="w-full">
                            Hesapla
                        </Button>
                    </form>
                </div>

                {/* Result Section */}
                <div className="p-6 bg-gray-50 flex flex-col justify-center">
                    {!result ? (
                        <div className="text-center text-gray-400">
                            <Calculator size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Sonuçları görmek için bilgileri girip hesapla butonuna basın.</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-300 space-y-4">
                            {result.isExempt ? (
                                <div className="bg-green-100 border border-green-200 p-4 rounded-xl text-center">
                                    <div className="text-green-700 font-bold text-lg mb-2">Vergi Ödemeniz Yok! 🎉</div>
                                    <p className="text-green-800">{result.message}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">Enflasyonlu Maliyet</div>
                                        <div className="font-bold text-gray-900">{parseFloat(result.adjustedCost).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL</div>
                                        {result.inflationRate > 0.10 && (
                                            <div className="text-xs text-green-600 mt-1">Enflasyon farkı uygulandı.</div>
                                        )}
                                    </div>

                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">Vergiye Tabi Matrah</div>
                                        <div className="font-bold text-gray-900">{parseFloat(result.taxableIncome).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL</div>
                                        <div className="text-xs text-gray-400 mt-1">İstisna ({EXEMPTION_AMOUNT.toLocaleString()} TL) düşüldükten sonra</div>
                                    </div>

                                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
                                        <div className="text-red-600 text-sm font-bold uppercase tracking-wider mb-2">Ödenecek Vergi</div>
                                        <div className="text-4xl font-black text-red-700">
                                            {parseFloat(result.tax).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL
                                        </div>
                                        <p className="text-xs text-red-400 mt-2">
                                            Hesaplanan tutar 2024 yılı vergi dilimlerine göre tahmindir.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CapitalGainsCalculator;
