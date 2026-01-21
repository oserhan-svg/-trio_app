import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Users, Calculator, Calendar, Plus, FileText, Radar, Upload, LayoutGrid, TrendingUp, Wallet, BarChart2, UserPlus, Search, Trash2 } from 'lucide-react';
import ClientTracking from '../components/crm/ClientTracking';
import Button from '../components/ui/Button';

import CapitalGainsCalculator from '../components/tools/CapitalGainsCalculator';
import TitleDeedFeeCalculator from '../components/tools/TitleDeedFeeCalculator';
import MortgageCalculator from '../components/tools/MortgageCalculator';
import OpportunityListGenerator from '../components/apps/OpportunityListGenerator';
import MarketRadar from '../components/apps/MarketRadar';
import WeeklyReportGenerator from '../components/apps/WeeklyReportGenerator';
import PortfolioDashboard from '../components/admin/PortfolioDashboard';
import Agenda from '../components/agenda/Agenda';
import PerformanceDashboard from '../components/admin/PerformanceDashboard';
import MatchNewsfeed from '../components/crm/MatchNewsfeed';
import MarketSupplyDemandChart from '../components/dashboard/MarketSupplyDemandChart';
import RemovedListingsViewer from '../components/apps/RemovedListingsViewer';

import ContactImportModal from '../components/crm/ContactImportModal';
import PendingContactsTable from '../components/crm/PendingContactsTable';
import MyListings from '../components/consultant/MyListings';
import AdminManagement from './AdminManagement';

const ConsultantPanel = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('clients'); // 'clients', 'mylistings', 'apps', 'tools', 'agenda'
    const [activeTool, setActiveTool] = useState(null); // 'calculator-gain', etc.
    const [activeApp, setActiveApp] = useState(null);
    const [showAddClientMatch, setShowAddClientMatch] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const [user] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error('User parsing failed:', e);
            return null;
        }
    });

    const panelTitle = user?.role === 'admin' ? 'Admin Paneli' : 'Danışman Paneli';

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`pb-3 text-sm font-medium flex items-center gap-2 transition-all border-b-2 whitespace-nowrap px-1 ${activeTab === id
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
        >
            <Icon size={16} className={activeTab === id ? 'stroke-[2.5px]' : ''} />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-brand-gray font-sans text-brand-dark">
            {/* Header */}
            <div className="bg-white border-b border-brand-border px-6 py-3 sticky top-0 z-20">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                                <Briefcase className="text-brand-red" size={20} />
                                {panelTitle}
                            </h1>
                        </div>
                    </div>
                    {/* Right Side Actions */}
                    {activeTab === 'clients' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAddClientMatch(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-brand-dark text-white text-sm font-medium rounded hover:bg-black transition shadow-sm"
                            >
                                <Plus size={14} /> <span className="hidden sm:inline">Yeni Müşteri</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="max-w-[1400px] mx-auto mt-4 flex gap-6 overflow-x-auto no-scrollbar">
                    <TabButton id="clients" label="Müşteri Takip" icon={Users} />
                    <TabButton id="mylistings" label="İlanlarım" icon={FileText} />
                    <TabButton id="pending" label="Müşteri Havuzu" icon={UserPlus} />
                    <TabButton id="apps" label="Uygulamalar" icon={LayoutGrid} />
                    <TabButton id="tools" label="Araçlar" icon={Calculator} />
                    <TabButton id="agenda" label="Ajanda" icon={Calendar} />
                    {user?.role === 'admin' && (
                        <>
                            <TabButton id="performance" label="Performans" icon={BarChart2} />
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
                {activeTab === 'clients' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Compact Grid Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                            <div className="lg:col-span-3">
                                <MarketSupplyDemandChart />
                            </div>
                            <div className="lg:col-span-1 h-full">
                                <MatchNewsfeed />
                            </div>
                        </div>

                        <div className="mb-6">
                            <PortfolioDashboard mode="mine" userId={user?.id} />
                        </div>

                        <ClientTracking
                            isAddModalOpen={showAddClientMatch}
                            onCloseAddModal={() => setShowAddClientMatch(false)}
                        />
                        <ContactImportModal
                            isOpen={showImportModal}
                            onClose={() => setShowImportModal(false)}
                            onImportSuccess={() => window.location.reload()}
                        />
                    </div>
                )}

                {activeTab === 'mylistings' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <MyListings userId={user?.id} />
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <PendingContactsTable onImportClick={() => setShowImportModal(true)} />
                    </div>
                )}

                {activeTab === 'apps' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeApp === 'opportunity-generator' ? (
                            <OpportunityListGenerator onBack={() => setActiveApp(null)} />
                        ) : activeApp === 'market-radar' ? (
                            <MarketRadar onBack={() => setActiveApp(null)} />
                        ) : activeApp === 'weekly-report' ? (
                            <WeeklyReportGenerator onBack={() => setActiveApp(null)} />
                        ) : activeApp === 'removed-listings' ? (
                            <RemovedListingsViewer onBack={() => setActiveApp(null)} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <AppCard
                                    title="Fırsat Bülteni"
                                    desc="Danışmanlara özel liste hazırla."
                                    icon={FileText}
                                    onClick={() => setActiveApp('opportunity-generator')}
                                    color="text-brand-red"
                                    bg="bg-red-50"
                                />
                                <AppCard
                                    title="Fırsat Radarı"
                                    desc="Piyasadaki en iyi fırsatları yakala."
                                    icon={Radar}
                                    onClick={() => setActiveApp('market-radar')}
                                    color="text-brand-dark"
                                    bg="bg-gray-100"
                                />
                                <AppCard
                                    title="Pazar Raporu"
                                    desc="Haftalık piyasa analizi oluştur."
                                    icon={TrendingUp}
                                    onClick={() => setActiveApp('weekly-report')}
                                    color="text-brand-dark"
                                    bg="bg-gray-100"
                                />
                                <AppCard
                                    title="Pasif İlanlar"
                                    desc="Portallardan kalkan ilanları incele."
                                    icon={Trash2}
                                    onClick={() => setActiveApp('removed-listings')}
                                    color="text-gray-600"
                                    bg="bg-gray-100"
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tools' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTool === 'calculator-gain' ? (
                            <CapitalGainsCalculator onBack={() => setActiveTool(null)} />
                        ) : activeTool === 'tapu-calculator' ? (
                            <TitleDeedFeeCalculator onBack={() => setActiveTool(null)} />
                        ) : activeTool === 'mortgage-calculator' ? (
                            <MortgageCalculator onBack={() => setActiveTool(null)} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <AppCard
                                    title="Değer Artış Kazancı"
                                    desc="Vergi ve 5 yıl kuralı hesabı."
                                    icon={TrendingUp}
                                    onClick={() => setActiveTool('calculator-gain')}
                                    color="text-blue-600"
                                    bg="bg-blue-50"
                                />
                                <AppCard
                                    title="Tapu Harcı"
                                    desc="Alım-satım masrafları."
                                    icon={Wallet}
                                    onClick={() => setActiveTool('tapu-calculator')}
                                    color="text-emerald-600"
                                    bg="bg-emerald-50"
                                />
                                <AppCard
                                    title="Kredi Hesaplama"
                                    desc="Faiz ve ödeme planı."
                                    icon={Calculator}
                                    onClick={() => setActiveTool('mortgage-calculator')}
                                    color="text-indigo-600"
                                    bg="bg-indigo-50"
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'agenda' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Agenda />
                    </div>
                )}

                {activeTab === 'performance' && user?.role === 'admin' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <PerformanceDashboard />
                    </div>
                )}


            </div>
        </div>
    );
};

// Helper Component for consistency
const AppCard = ({ title, desc, icon: Icon, onClick, color, bg }) => (
    <div
        onClick={onClick}
        className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col items-start"
    >
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center ${color} mb-3 group-hover:scale-105 transition-transform`}>
            <Icon size={20} />
        </div>
        <h3 className="font-bold text-brand-dark text-base mb-1">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

export default ConsultantPanel;
