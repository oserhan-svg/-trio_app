import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard,
    Briefcase,
    ShieldCheck,
    LogOut,
    Menu,
    ChevronLeft,
    ChevronRight,
    Users,
    Columns,
    Settings,
    Bell,
    Search,
    User,
    Sparkles,
    MessageCircle,
    LayoutGrid,
    Brain,
    Calculator,
    Activity,
    Database,
    SearchCode,
    TrendingUp,
    Sun,
    Moon,
    Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import socketService from '../../services/socket';

const AppShell = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        // Listen for new high-priority AI lead recommendations
        socketService.on('new_lead_recommendation', (data) => {
            if (data.score >= 70) {
                toast.custom((t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'
                            } max-w-md w-full bg-slate-900 shadow-2xl rounded-3xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-blue-500/50 overflow-hidden`}
                        onClick={() => {
                            navigate(`/crm/clients/${data.clientId || ''}`);
                            toast.dismiss(t.id);
                        }}
                    >
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white glow-blue">
                                        <Sparkles size={20} />
                                    </div>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-black text-white">Yüksek Öncelikli Fırsat!</p>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">AI Tarafından Tespit Edildi</p>
                                    <p className="mt-1 text-xs font-medium text-slate-400 line-clamp-2">
                                        {data.name}: {data.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex border-l border-slate-800">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.dismiss(t.id);
                                }}
                                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black text-slate-500 hover:text-white uppercase tracking-widest"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                ), { duration: 6000, position: 'top-right' });
            }
        });

        socketService.on('notification', (data) => {
            if (data.type === 'success') {
                toast.success(data.message);
            } else {
                toast(data.message);
            }
        });

        return () => {
            socketService.off('new_lead_recommendation');
            socketService.off('notification');
        };
    }, [navigate]);

    const isAdmin = user?.role === 'admin';

    const menuItems = [
        {
            title: 'Ana Menü',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
                { id: 'portfolio', label: 'Portföy', icon: Briefcase, path: '/portfolio' },
            ]
        },
        {
            title: 'Müşteri & Satış',
            items: [
                { id: 'clients', label: 'Müşteriler', icon: Users, path: '/crm/clients' },
                { id: 'matches', label: 'Eşleşme Akışı', icon: Sparkles, path: '/crm/matches' },
                { id: 'calendar', label: 'Ajanda', icon: Briefcase, path: '/crm/agenda' },
                { id: 'pool', label: 'Aday Havuzu', icon: User, path: '/crm/pool' },
                { id: 'pipeline', label: 'Satış Boru Hattı', icon: Columns, path: '/crm/pipeline' },
                { id: 'apps', label: 'Uygulamalar', icon: LayoutGrid, path: '/crm/apps' },
                { id: 'tools', label: 'Araçlar', icon: Calculator, path: '/crm/tools' },
            ]
        },
        {
            title: 'Analiz & AI',
            items: [
                { id: 'map', label: 'Harita Analizi', icon: Search, path: '/intelligence/map' },
                { id: 'radar', label: 'Pazar Radarı', icon: ShieldCheck, path: '/intelligence/market-radar' },
                { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, path: '/intelligence/whatsapp' },
                { id: 'training', label: 'Eğitim Merkezi', icon: Brain, path: '/intelligence/training' },
            ]
        }
    ];

    if (isAdmin) {
        menuItems.push({
            title: 'Yönetim',
            items: [
                { id: 'admin-overview', label: 'Yönetici Özeti', icon: Activity, path: '/admin/overview' },
                { id: 'team', label: 'Ekip Yönetimi', icon: Users, path: '/admin/team' },
                { id: 'performance', label: 'Performans Analizi', icon: TrendingUp, path: '/admin/performance' },
                { id: 'finance', label: 'Finansal Analiz', icon: Banknote, path: '/admin/finance' },
                { id: 'ai-learning', label: 'AI Öğrenme Merkezi', icon: Brain, path: '/admin/ai-learning' },
                { id: 'scraper-monitor', label: 'Scraper Monitörü', icon: Database, path: '/admin/scraper' },
            ]
        });
    }

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.success('Başarıyla çıkış yapıldı.');
    };

    return (
        <div className="flex h-screen bg-app overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-700 dark:selection:bg-blue-900/30 dark:selection:text-blue-200 transition-colors duration-300">

            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    md:relative md:translate-x-0 flex flex-col m-4 mr-0 rounded-3xl glass shadow-2xl shadow-blue-900/5
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-24 md:translate-x-0'}
                `}
            >
                {/* Sidebar Header */}
                <div className="h-20 flex items-center justify-between px-6">
                    <div className={`flex items-center gap-3 overflow-hidden ${!sidebarOpen && 'md:justify-center w-full'}`}>
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30 glow-blue animate-float">
                            <Sparkles size={22} fill="currentColor" />
                        </div>
                        {sidebarOpen && (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-800 text-xl tracking-tighter leading-none">TRIO<span className="text-blue-600">APP</span></span>
                                <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em]">ULTRA MODERN</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto pt-4 pb-6 px-4 space-y-8 custom-scrollbar">
                    {menuItems.map((group, idx) => (
                        <div key={idx}>
                            {sidebarOpen && (
                                <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 opacity-70">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1.5">
                                {group.items.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => navigate(item.path)}
                                            className={`
                                                w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 group relative
                                                ${active
                                                    ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/25 glow-blue translate-x-1'
                                                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm hover:translate-x-1'}
                                                ${!sidebarOpen ? 'md:justify-center px-0 !translate-x-0' : ''}
                                            `}
                                            title={!sidebarOpen ? item.label : ''}
                                        >
                                            <item.icon
                                                size={20}
                                                className={`shrink-0 transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
                                            />
                                            {sidebarOpen && <span className="text-sm tracking-tight">{item.label}</span>}

                                            {active && sidebarOpen && (
                                                <div className="ml-auto w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 mx-2 mb-2 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                    <div className={`flex items-center gap-3 p-2 rounded-xl mb-1 ${!sidebarOpen && 'justify-center cursor-pointer'}`}>
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ring-4 ring-white shadow-sm transition-transform hover:scale-105">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {sidebarOpen && (
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user?.name || 'Kullanıcı'}</p>
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest opacity-60">{user?.role === 'admin' ? 'Yönetici' : 'Danışman'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative pb-20 md:pb-0">
                {/* Topbar */}
                <header className="h-20 flex items-center justify-between px-4 md:px-8 relative shrink-0 z-40">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Menüyü aç/kapat"
                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:shadow-md transition-all active:scale-90"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Breadcrumb-ish indicator */}
                        <div className="hidden lg:flex items-center gap-2 text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">{location.pathname.split('/')[1] || 'Dashboard'}</span>
                            <ChevronRight size={12} />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{menuItems.flatMap(g => g.items).find(i => isActive(i.path))?.label || 'Genel Bakış'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <Search size={16} className="text-slate-300" />
                            <input type="text" placeholder="Hızlı ara..." aria-label="Hızlı ara" className="bg-transparent border-none text-xs font-bold focus:ring-0 w-32 outline-none dark:text-white" />
                        </div>

                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:shadow-md transition-all active:scale-90"
                            title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <button aria-label="Bildirimler" className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:shadow-md transition-all relative group">
                            <Bell size={20} className="group-hover:animate-bounce" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                        </button>

                        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        <button
                            className="bg-slate-900 dark:bg-blue-600 text-white h-10 px-4 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all text-xs font-black uppercase tracking-widest active:translate-y-0"
                            onClick={handleLogout}
                        >
                            <LogOut size={16} />
                            <span className="hidden lg:inline">Çıkış</span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className={`flex-1 ${location.pathname === '/intelligence/whatsapp' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-8'} custom-scrollbar min-h-0`}>
                    <div className={`mx-auto h-full min-h-0 ${location.pathname === '/intelligence/whatsapp' ? 'max-w-none' : 'max-w-[1600px]'}`}>
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out h-full min-h-0">
                            {children}
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-around px-4 md:hidden z-50 transition-colors duration-300">
                    <BottomNavItem
                        icon={LayoutDashboard}
                        label="Ana Menü"
                        active={location.pathname === '/dashboard'}
                        onClick={() => navigate('/dashboard')}
                    />
                    <BottomNavItem
                        icon={Briefcase}
                        label="Portföy"
                        active={location.pathname === '/portfolio'}
                        onClick={() => navigate('/portfolio')}
                    />
                    <BottomNavItem
                        icon={Users}
                        label="Müşteriler"
                        active={location.pathname === '/crm/clients'}
                        onClick={() => navigate('/crm/clients')}
                    />
                    <BottomNavItem
                        icon={Sparkles}
                        label="Eşleşme"
                        active={location.pathname === '/crm/matches'}
                        onClick={() => navigate('/crm/matches')}
                    />
                </div>
            </main>
        </div>
    );
};

const BottomNavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        aria-label={label}
        className={`flex flex-col items-center justify-center gap-1 w-16 transition-all duration-300 ${active ? 'text-blue-600' : 'text-slate-400'}`}
    >
        <div className={`p-2 rounded-xl transition-all duration-300 ${active ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
            <Icon size={24} className={active ? 'animate-pulse' : ''} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    </button>
);

export default AppShell;
