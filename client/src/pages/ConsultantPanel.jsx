import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Users, Calculator, Calendar, Plus, FileText, Radar } from 'lucide-react';
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
import { LayoutGrid, TrendingUp, Wallet, BarChart2 } from 'lucide-react';

const ConsultantPanel = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('clients'); // 'clients', 'apps', 'tools', 'agenda'
    const [activeTool, setActiveTool] = useState(null); // 'calculator-gain', etc.
    const [activeApp, setActiveApp] = useState(null); // 'opportunity-generator'
    const [showAddClientMatch, setShowAddClientMatch] = useState(false); // Trigger for ClientTracking

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

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase className="text-emerald-600" />
                                {panelTitle}
                            </h1>
                            <p className="text-sm text-gray-500">Müşteri takibi ve danışmanlık araçları</p>
                        </div>
                    </div>
                    {/* Right Side Actions */}
                    {activeTab === 'clients' && (
                        <Button onClick={() => setShowAddClientMatch(true)} className="flex items-center gap-2">
                            <Plus size={18} /> Yeni Müşteri
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto mt-6 flex gap-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`pb-3 text-sm font-medium flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'clients'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Users size={18} />
                        Müşteri Takip
                    </button>
                    <button
                        onClick={() => setActiveTab('apps')}
                        className={`pb-3 text-sm font-medium flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'apps'
                            ? 'border-purple-500 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <LayoutGrid size={18} />
                        Uygulamalar
                    </button>
                    <button
                        onClick={() => setActiveTab('tools')}
                        className={`pb-3 text-sm font-medium flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'tools'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Calculator size={18} />
                        Diğer Enstrümanlar
                    </button>
                    <button
                        onClick={() => setActiveTab('agenda')}
                        className={`pb-3 text-sm font-medium flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'agenda'
                            ? 'border-gray-500 text-gray-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Calendar size={18} />
                        Ajanda
                    </button>

                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`pb-3 text-sm font-medium flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'performance'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <BarChart2 size={18} />
                            Performans
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto p-6">
                {activeTab === 'clients' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* My Portfolio Stats & Match Feed */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            <div className="lg:col-span-2">
                                <PortfolioDashboard mode="mine" userId={user?.id} />
                            </div>
                            <div className="lg:col-span-1">
                                <MatchNewsfeed />
                            </div>
                        </div>

                        {/* Market Gap Analysis */}
                        <div className="mb-8">
                            <MarketSupplyDemandChart />
                        </div>

                        <ClientTracking
                            isAddModalOpen={showAddClientMatch}
                            onCloseAddModal={() => setShowAddClientMatch(false)}
                        />
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
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Opportunity Generator App Card */}
                                <div
                                    onClick={() => setActiveApp('opportunity-generator')}
                                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer group hover:border-purple-300"
                                >
                                    <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform group-hover:bg-purple-100">
                                        <FileText size={28} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2 truncate w-full">Fırsat Bülteni Oluşturucu</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">Danışmanlara göndermek için fırsat listesi hazırlayın.</p>
                                    <span className="mt-4 text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-medium">Yeni</span>
                                </div>

                                {/* Market Radar App Card */}
                                <div
                                    onClick={() => setActiveApp('market-radar')}
                                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer group hover:border-rose-300"
                                >
                                    <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-4 group-hover:scale-110 transition-transform group-hover:bg-rose-100">
                                        <Radar size={28} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2 truncate w-full">Fırsat Radarı</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">Daire, Villa, Arsa ve Zeytinlik kategorilerinde en iyi fırsatları yakalayın.</p>
                                    <span className="mt-4 text-xs bg-rose-600 text-white px-3 py-1 rounded-full font-medium">Popüler</span>
                                </div>

                                {/* Weekly Report App Card */}
                                <div
                                    onClick={() => setActiveApp('weekly-report')}
                                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer group hover:border-emerald-300"
                                >
                                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform group-hover:bg-emerald-100">
                                        <TrendingUp size={28} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2 truncate w-full">Haftalık Pazar Raporu</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">Müşterileriniz için profesyonel piyasa analiz raporları oluşturun.</p>
                                    <span className="mt-4 text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-medium">Yeni</span>
                                </div>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Capital Gains Tool Card */}
                                <div
                                    onClick={() => setActiveTool('calculator-gain')}
                                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer group hover:border-blue-300"
                                >
                                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform group-hover:bg-blue-100">
                                        <TrendingUp size={28} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2 truncate w-full">Değer Artış Kazancı</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">Gayrimenkul alım-satım vergisini ve 5 yıl kuralını hesaplayın.</p>
                                    <span className="mt-4 text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">Yeni</span>
                                </div>

                                {/* Title Deed Fee Tool Card */}
                                <div
                                    onClick={() => setActiveTool('tapu-calculator')}
                                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer group hover:border-emerald-300"
                                >
                                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform group-hover:bg-emerald-100">
                                        <Wallet size={28} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2 truncate w-full">Tapu Harcı Hesapla</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">Alıcı ve satıcı tapu harcı ile döner sermaye bedellerini görün.</p>
                                    <span className="mt-4 text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-medium">Yeni</span>
                                </div>

                                {/* Mortgage Calculator Tool Card */}
                                <div
                                    onClick={() => setActiveTool('mortgage-calculator')}
                                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer group hover:border-indigo-300"
                                >
                                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform group-hover:bg-indigo-100">
                                        <Calculator size={28} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2">Kredi Hesaplama</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">Konut kredisi faiz ve ödeme planı hesaplayıcısı.</p>
                                    <span className="mt-4 text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-medium">Yeni</span>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer group opacity-60">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                                        <Briefcase size={24} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2">Komisyon Hesaplama</h3>
                                    <p className="text-sm text-gray-500">Hizmet bedeli ve fatura hesaplama aracı.</p>
                                    <span className="mt-4 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Yakında</span>
                                </div>
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

export default ConsultantPanel;
