import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, List, LogOut, Search, Users, FileText, Settings, Activity } from 'lucide-react';
import api from '../services/api';
import PriceInput from '../components/ui/PriceInput';
import MapView from '../components/MapView';
import PropertyTable from '../components/PropertyTable';
// import DashboardStatsHeader from '../components/DashboardStatsHeader';
// import HeatmapView from '../components/HeatmapView';

import toast from 'react-hot-toast';
import MobileNav from '../components/MobileNav';
// import MarketHealthWidget from '../components/dashboard/MarketHealthWidget';
import AILocationHeatmap from '../components/dashboard/AILocationHeatmap';
import ErrorBoundary from '../components/ErrorBoundary';
import FilterBar from '../components/dashboard/FilterBar';
import MarketHealthWidget from '../components/dashboard/MarketHealthWidget';
import MarketSupplyDemandChart from '../components/dashboard/MarketSupplyDemandChart';
import RentalRateWidget from '../components/dashboard/RentalRateWidget';
import AIOpportunitiesFeed from '../components/dashboard/AIOpportunitiesFeed';

const Dashboard = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [stats, setStats] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [filterMetadata, setFilterMetadata] = useState({ categories: [], rooms: [], districts: [] });
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        minPrice: '',
        maxPrice: '',
        minSize: '',
        maxSize: '',
        rooms: '',
        district: '',
        neighborhood: '',
        source: '',
        seller_type: 'all',
        opportunity_filter: '',
        category: 'all',
        listingType: 'all',
        sort: 'newest',
        building_age: '',
        heating_type: '',
        floor_location: ''
    });

    const [meta, setMeta] = useState({ page: 1, totalPages: 1 });


    const fetchAllData = React.useCallback(async (currentFilters, pageParam = 1, append = false) => {
        if (append) setIsFetchingNextPage(true);
        else setLoading(true);

        try {
            const params = new URLSearchParams();
            params.append('page', pageParam);
            params.append('limit', 15);

            if (currentFilters.search) params.append('search', currentFilters.search);
            if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
            if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
            if (currentFilters.minSize) params.append('minSize', currentFilters.minSize);
            if (currentFilters.maxSize) params.append('maxSize', currentFilters.maxSize);
            if (currentFilters.rooms && currentFilters.rooms !== 'Tümü' && currentFilters.rooms !== '') {
                params.append('rooms', Array.isArray(currentFilters.rooms) ? currentFilters.rooms.join(',') : currentFilters.rooms);
            }
            if (currentFilters.district) params.append('district', currentFilters.district);
            if (currentFilters.neighborhood) params.append('neighborhood', currentFilters.neighborhood);
            if (currentFilters.source) params.append('source', currentFilters.source);
            if (currentFilters.seller_type && currentFilters.seller_type !== 'all') params.append('seller_type', currentFilters.seller_type);
            if (currentFilters.opportunity_filter) params.append('opportunity_filter', currentFilters.opportunity_filter);
            if (currentFilters.category && currentFilters.category !== 'all') params.append('category', currentFilters.category);
            if (currentFilters.listingType && currentFilters.listingType !== 'all') params.append('listingType', currentFilters.listingType);
            if (currentFilters.sort) params.append('sort', currentFilters.sort);
            if (currentFilters.building_age) params.append('building_age', currentFilters.building_age);
            if (currentFilters.heating_type) params.append('heating_type', currentFilters.heating_type);
            if (currentFilters.floor_location) params.append('floor_location', currentFilters.floor_location);

            const requests = [api.get(`/properties?${params.toString()}`)];
            if (!append && pageParam === 1) requests.push(api.get('/analytics'));

            const results = await Promise.allSettled(requests);

            const propResult = results[0];
            if (propResult.status === 'fulfilled') {
                const propRes = propResult.value;
                const newProps = propRes.data.data || propRes.data || [];

                if (append) {
                    setProperties(prev => [...prev, ...newProps]);
                } else {
                    setProperties(newProps);
                }

                if (propRes.data.meta) {
                    setMeta(propRes.data.meta);
                    setHasMore(propRes.data.meta.page < propRes.data.meta.totalPages);
                } else {
                    setHasMore(newProps.length === 15);
                }
            } else {
                throw propResult.reason;
            }

            if (!append && pageParam === 1 && results[1]) {
                const analyticsResult = results[1];
                if (analyticsResult.status === 'fulfilled') {
                    setStats(analyticsResult.value.data.marketStats || []);
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
            setIsFetchingNextPage(false);
        }
    }, [navigate]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await api.get('/properties/metadata');
                setFilterMetadata(res.data);
            } catch (err) {
                console.error('Failed to fetch filter metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchAllData(filters);
    }, [fetchAllData, filters]);

    const handleLoadMore = () => {
        if (!isFetchingNextPage && hasMore) {
            const nextPage = meta.page + 1;
            fetchAllData(filters, nextPage, true);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            minPrice: '',
            maxPrice: '',
            minSize: '',
            maxSize: '',
            rooms: '',
            district: '',
            neighborhood: '',
            source: '',
            seller_type: 'all',
            opportunity_filter: '',
            category: 'all',
            listingType: 'all',
            sort: 'newest',
            building_age: '',
            heating_type: '',
            floor_location: ''
        });
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        fetchAllData(filters);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        toast.success('Başarıyla çıkış yapıldı.');
    };


    const [user] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error('User parsing failed:', e);
            return null;
        }
    });

    return (
        <ErrorBoundary>
            <div className="space-y-8 pb-20">
                {/* Dashboard Header & Primary Actions */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-1">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">SİSTEM AKTİF</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Emlak <span className="text-blue-600 dark:text-blue-500">Portföyü</span>
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Şu anda <span className="text-slate-900 dark:text-slate-200 font-bold">{meta.total || properties.length}</span> ilan analiz ediliyor.
                        </p>
                    </div>

                </div>

                {/* AI & Market Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* Advanced FilterBar */}
                        <div className="relative group z-[48] h-full">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative z-10 h-full">
                                <FilterBar
                                    filters={filters}
                                    metadata={filterMetadata}
                                    properties={properties}
                                    onChange={handleFilterChange}
                                    onClearAll={handleClearFilters}
                                    totalResults={meta.total || properties.length}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <AIOpportunitiesFeed />
                        <AILocationHeatmap />
                    </div>
                </div>

                {/* Content Area - Explicitly lower stacking priority to prevent table elements mixing with filter dropdowns */}
                <div className="space-y-6 relative z-0">
                    {/* View Toggler & Content Header */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 w-fit">
                            <ViewTab active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={List} label="Liste Görünümü" />
                            <ViewTab active={viewMode === 'map'} onClick={() => setViewMode('map')} icon={Map} label="Harita Keşfi" />
                            <ViewTab active={viewMode === 'heatmap'} onClick={() => setViewMode('heatmap')} icon={Settings} label="Pazar Analizi" />
                        </div>

                        {!errorMsg && !loading && (
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <Activity size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                    Canlı Veri: {properties.length} Kayıt Gösteriliyor
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="min-h-[500px]">
                        {errorMsg && (
                            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-10 text-center animate-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <LogOut size={32} className="rotate-90" />
                                </div>
                                <h3 className="text-xl font-black text-rose-900 mb-2">Bağlantı Hatası</h3>
                                <p className="text-sm text-rose-800/70 font-medium max-w-sm mx-auto">{errorMsg}</p>
                            </div>
                        )}

                        {loading && !properties.length ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
                                    <div className="absolute top-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 font-black text-lg tracking-tight">Veriler İşleniyor</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Lütfen bekleyin...</p>
                                </div>
                            </div>
                        ) : (
                            properties.length === 0 && !loading && (
                                <div className="bg-white dark:bg-slate-800/30 rounded-[3rem] border border-slate-200 dark:border-slate-700 border-dashed py-32 text-center shadow-sm">
                                    <div className="mx-auto w-24 h-24 bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                        <Search size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Sonuç Bulunamadı</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mt-3 font-medium leading-relaxed">
                                        Uygulanan filtreler sonucunda ilan bulunamadı. Filtre kombinasyonlarınızı gözden geçirebilirsiniz.
                                    </p>
                                </div>
                            )
                        )}

                        {properties.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {viewMode === 'list' && (
                                    <PropertyTable
                                        properties={properties}
                                        currentSort={filters.sort}
                                        onSortChange={(val) => handleFilterChange({ target: { name: 'sort', value: val } })}
                                        hasMore={hasMore}
                                        onLoadMore={handleLoadMore}
                                        isLoadingMore={isFetchingNextPage}
                                    />
                                )}

                                {viewMode === 'map' && (
                                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[750px] glow-blue">
                                        <MapView properties={properties} />
                                    </div>
                                )}

                                {viewMode === 'heatmap' && (
                                    <div className="space-y-8">
                                        <MarketHealthWidget data={properties} totalCount={meta.total} />
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2">
                                                <MarketSupplyDemandChart />
                                            </div>
                                            <div className="lg:col-span-1">
                                                <RentalRateWidget />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ErrorBoundary >
    );
};

const ViewTab = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-black transition-all duration-300 relative overflow-hidden group
            ${active
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md translate-y-[-1px]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50'}
        `}
    >
        <Icon size={18} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
        <span className="tracking-tight">{label}</span>
    </button>
);

export default Dashboard;
