import React, { useState } from 'react';
import {
    Calculator,
    TrendingUp,
    Wallet
} from 'lucide-react';

// Tools
import CapitalGainsCalculator from '../components/tools/CapitalGainsCalculator';
import TitleDeedFeeCalculator from '../components/tools/TitleDeedFeeCalculator';
import MortgageCalculator from '../components/tools/MortgageCalculator';

const ToolsPage = () => {
    const [activeSubSection, setActiveSubSection] = useState(null);

    const renderContent = () => {
        if (activeSubSection) {
            switch (activeSubSection) {
                case 'calculator-gain': return <CapitalGainsCalculator onBack={() => setActiveSubSection(null)} />;
                case 'tapu-calculator': return <TitleDeedFeeCalculator onBack={() => setActiveSubSection(null)} />;
                case 'mortgage-calculator': return <MortgageCalculator onBack={() => setActiveSubSection(null)} />;
                default: return null;
            }
        }

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Hesaplama Araçları</h2>
                    <p className="text-sm text-gray-500">Müşterileriniz için hızlı finansal analizler yapın.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AppCard title="Değer Artış Kazancı" desc="Gayrimenkul satışında vergi ve istisna hesaplama." icon={TrendingUp} onClick={() => setActiveSubSection('calculator-gain')} color="text-blue-600" bg="bg-blue-50" />
                    <AppCard title="Tapu Harcı Hesapla" desc="Güncel oranlarla alım-satım masrafları." icon={Wallet} onClick={() => setActiveSubSection('tapu-calculator')} color="text-emerald-600" bg="bg-emerald-50" />
                    <AppCard title="Kredi Hesaplama" desc="Konut kredisi faiz ve geri ödeme planı." icon={Calculator} onClick={() => setActiveSubSection('mortgage-calculator')} color="text-indigo-600" bg="bg-indigo-50" />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-6 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <Calculator size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Hesaplama Araçları</h1>
                    <p className="text-sm text-slate-500 font-medium">Finansal analiz ve vergi hesaplamaları.</p>
                </div>
            </div>
            <div className="min-h-[600px] animate-in fade-in duration-500">
                {renderContent()}
            </div>
        </div>
    );
};

const AppCard = ({ title, desc, icon: Icon, onClick, color, bg }) => (
    <div onClick={onClick} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col items-start h-full">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color} mb-3 group-hover:scale-110 transition-transform`}>
            <Icon size={20} />
        </div>
        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

export default ToolsPage;
