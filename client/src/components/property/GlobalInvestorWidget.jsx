import React, { useState, useEffect } from 'react';
import { Languages, DollarSign, Euro, Globe, Loader2, Check, Copy } from 'lucide-react';
import api from '../../services/api';

const GlobalInvestorWidget = ({ propertyId, basePrice }) => {
    const [localized, setLocalized] = useState(null);
    const [currencies, setCurrencies] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedLang, setSelectedLang] = useState('EN');

    useEffect(() => {
        fetchCurrency();
    }, [basePrice]);

    const fetchCurrency = async () => {
        try {
            const res = await api.get('/market/convert', { params: { price: basePrice } });
            setCurrencies(res.data);
        } catch (error) {
            console.error('Currency error:', error);
        }
    };

    const handleLocalize = async (lang) => {
        try {
            setLoading(true);
            setSelectedLang(lang);
            const res = await api.get(`/market/translate/${propertyId}`, { params: { lang } });
            setLocalized(res.data);
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2 text-sm italic">
                    <Globe size={18} className="text-blue-400" />
                    Global Investor Bridge
                </h3>
            </div>

            <div className="p-6">
                {/* Currency Section */}
                <div className="flex gap-2 mb-6">
                    <CurrencyCard icon={<DollarSign size={14} />} label="USD" value={currencies?.USD?.toLocaleString()} />
                    <CurrencyCard icon={<Euro size={14} />} label="EUR" value={currencies?.EUR?.toLocaleString()} />
                    <CurrencyCard icon={<span className="text-xs font-bold">£</span>} label="GBP" value={currencies?.GBP?.toLocaleString()} />
                </div>

                {/* Language Toggles */}
                <div className="flex items-center gap-2 mb-4">
                    <LangBtn active={selectedLang === 'EN'} label="English" onClick={() => handleLocalize('EN')} />
                    <LangBtn active={selectedLang === 'DE'} label="German" onClick={() => handleLocalize('DE')} />
                    <LangBtn active={selectedLang === 'RU'} label="Russian" onClick={() => handleLocalize('RU')} />
                </div>

                {loading ? (
                    <div className="p-10 text-center animate-pulse text-gray-400 text-[10px] font-black uppercase">
                        AI Content Localizing...
                    </div>
                ) : localized ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                        <div className="text-[9px] font-black text-indigo-600 uppercase mb-2">Localized Sales Description</div>
                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                            {localized.translatedContent}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Languages size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Select language to generate pitch</p>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 text-[9px] text-gray-400 italic">
                    * Prices converted using daily bank exchange rates. AI localization adds regional marketing touch.
                </div>
            </div>
        </div>
    );
};

const CurrencyCard = ({ icon, label, value }) => (
    <div className="flex-1 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
        <div className="text-[8px] font-black text-slate-400 uppercase flex items-center justify-center gap-1">
            {icon} {label}
        </div>
        <div className="text-sm font-black text-slate-800">{value || '...'}</div>
    </div>
);

const LangBtn = ({ active, label, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 rounded-full text-[10px] font-black border transition ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400'
            }`}
    >
        {label}
    </button>
);

export default GlobalInvestorWidget;
