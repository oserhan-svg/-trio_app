import React, { useState } from 'react';
import {
    LayoutGrid,
    FileText,
    TrendingUp,
    Radar,
    Trash2,
    Share2,
    Map as MapIcon,
    ArrowLeft,
    Wallet
} from 'lucide-react';

// Apps
import OpportunityListGenerator from '../components/apps/OpportunityListGenerator';
import MarketRadar from '../components/apps/MarketRadar';
import WeeklyReportGenerator from '../components/apps/WeeklyReportGenerator';
import RemovedListingsViewer from '../components/apps/RemovedListingsViewer';
import DemandHeatmap from '../components/DemandHeatmap';
import MarketingCenter from '../components/apps/MarketingCenter';
import RevenueTracker from '../components/apps/RevenueTracker';
import MapInsight from '../components/apps/MapInsight';

const AppsPage = () => {
    const [activeSubSection, setActiveSubSection] = useState('overview');

    const appGroups = [
        {
            id: 'observation',
            label: 'Pazar Gözlemi',
            icon: Radar,
            apps: [
                { id: 'market-radar', title: 'Fırsat Radarı', icon: Radar, color: 'text-rose-600', bg: 'bg-rose-50' },
                { id: 'map-insight', title: 'Pazar Radarı (Harita)', icon: MapIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
                { id: 'demand-heatmap', title: 'Talep Haritası', icon: Radar, color: 'text-blue-600', bg: 'bg-blue-50' },
            ]
        },
        {
            id: 'reporting',
            label: 'Raporlama',
            icon: FileText,
            apps: [
                { id: 'opportunity-generator', title: 'Fırsat Bülteni', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
                { id: 'weekly-report', title: 'Pazar Raporu', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'removed-listings', title: 'Pasif İlanlar', icon: Trash2, color: 'text-gray-600', bg: 'bg-gray-100' },
            ]
        },
        {
            id: 'operations',
            label: 'Operasyon & Finans',
            icon: Wallet,
            apps: [
                { id: 'marketing-center', title: 'Pazarlama Merkezi', icon: Share2, color: 'text-pink-600', bg: 'bg-pink-50' },
                { id: 'revenue-tracker', title: 'Finansal Takip', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ]
        }
    ];

    const allApps = appGroups.flatMap(g => g.apps);

    const getAppDesc = (id) => {
        const descs = {
            'opportunity-generator': 'Danışman listesi ve fırsat bülteni oluşturucu.',
            'market-radar': 'Piyasadaki anlık fiyat değişimlerini ve fırsatları izle.',
            'weekly-report': 'Haftalık detaylı pazar analizi ve raporlama aracı.',
            'removed-listings': 'Yayından kalkan ilanların detaylı arşivi.',
            'demand-heatmap': 'Müşteri taleplerinin yoğunlaştığı bölgeleri izle.',
            'marketing-center': 'Instagram Story ve postlar için otomatik içerik üretici.',
            'revenue-tracker': 'Satış adetleri ve hak edişlerin istatistiksel dökümü.',
            'map-insight': 'Ayvalık piyasasını interaktif harita üzerinde incele.'
        };
        return descs[id] || '';
    };

    const renderContent = () => {
        switch (activeSubSection) {
            case 'overview': return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {allApps.map(app => (
                        <AppCard
                            key={app.id}
                            title={app.title}
                            desc={getAppDesc(app.id)}
                            icon={app.icon}
                            color={app.color}
                            bg={app.bg}
                            onClick={() => setActiveSubSection(app.id)}
                        />
                    ))}
                </div>
            );
            case 'opportunity-generator': return <OpportunityListGenerator onBack={() => setActiveSubSection('overview')} />;
            case 'market-radar': return <MarketRadar onBack={() => setActiveSubSection('overview')} />;
            case 'weekly-report': return <WeeklyReportGenerator onBack={() => setActiveSubSection('overview')} />;
            case 'removed-listings': return <RemovedListingsViewer onBack={() => setActiveSubSection('overview')} />;
            case 'demand-heatmap': return (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative animate-in fade-in duration-300">
                    <button
                        onClick={() => setActiveSubSection('overview')}
                        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
                    >
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-bold uppercase tracking-widest">Geri Dön</span>
                    </button>
                    <DemandHeatmap />
                </div>
            );
            case 'marketing-center': return (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative animate-in fade-in duration-300">
                    <button
                        onClick={() => setActiveSubSection('overview')}
                        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
                    >
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-bold uppercase tracking-widest">Geri Dön</span>
                    </button>
                    <MarketingCenter />
                </div>
            );
            case 'revenue-tracker': return <RevenueTracker onBack={() => setActiveSubSection('overview')} />;
            case 'map-insight': return <MapInsight onBack={() => setActiveSubSection('overview')} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-6 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <LayoutGrid size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Uygulamalar</h1>
                    <p className="text-sm text-slate-500 font-medium">Tüm emlak araçları tek bir yerde.</p>
                </div>
            </div>

            <div className="bg-slate-50/50 rounded-3xl min-h-[700px] p-1">
                {renderContent()}
            </div>
        </div>
    );
};

const AppCard = ({ title, desc, icon: Icon, onClick, color, bg }) => (
    <div
        onClick={onClick}
        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col items-start h-full"
    >
        <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center ${color} mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
            <Icon size={24} />
        </div>
        <h3 className="font-black text-gray-900 text-base mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed font-medium opacity-80">{desc}</p>
        <div className="mt-auto pt-6 flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Uygulamayı Aç</span>
            <ArrowLeft size={14} className="rotate-180" />
        </div>
    </div>
);

export default AppsPage;
