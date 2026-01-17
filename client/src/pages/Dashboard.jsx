import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, List, LogOut, Search, Users, RefreshCw, FileText } from 'lucide-react';
import api from '../services/api';
import MapView from '../components/MapView';
import PropertyTable from '../components/PropertyTable';
import DashboardStatsHeader from '../components/DashboardStatsHeader';
import HeatmapView from '../components/HeatmapView';

import toast from 'react-hot-toast';

const Dashboard = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [stats, setStats] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        rooms: '',
        district: '',
        source: '',
        seller_type: 'all',
        opportunity_filter: ''
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async (currentFilters = filters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
            if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
            if (currentFilters.rooms && currentFilters.rooms !== 'Tümü') params.append('rooms', currentFilters.rooms);
            if (currentFilters.district) params.append('district', currentFilters.district);
            if (currentFilters.source) params.append('source', currentFilters.source);
            if (currentFilters.seller_type && currentFilters.seller_type !== 'all') params.append('seller_type', currentFilters.seller_type);
            if (currentFilters.opportunity_filter) params.append('opportunity_filter', currentFilters.opportunity_filter);

            // Parallel fetch for properties and stats
            const [propRes, statRes] = await Promise.all([
                api.get(`/properties?${params.toString()}`),
                api.get('/analytics')
            ]);

            setProperties(propRes.data);
            setStats(statRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMsg(error.message + (error.response ? ` (${error.response.status})` : ''));
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                localStorage.removeItem('token'); // Clear invalid token
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAllData(filters);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        toast.success('Başarıyla çıkış yapıldı.');
    };

    const handleScrape = async () => {
        if (!confirm('Veri güncelleme işlemini başlatmak istiyor musunuz? Bu işlem birkaç dakika sürebilir.')) return;

        toast.promise(
            api.post('/properties/scrape'),
            {
                loading: 'Veri toplama arka planda başlatıldı...',
                success: 'Scraper tetiklendi! Birkaç dakika içinde veriler güncellenecek.',
                error: 'Güncelleme başlatılamadı.'
            }
        );
    };

    const [user] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">TrioApp</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">v2.1</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleScrape} className="flex items-center gap-1 text-gray-600 hover:text-green-600 font-medium">
                        <RefreshCw size={18} />
                        <span className="hidden md:inline">Verileri Güncelle</span>
                    </button>
                    <button onClick={() => navigate('/consultant-panel')} className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium">
                        <Users size={18} />
                        <span className="hidden md:inline">{user?.role === 'admin' ? 'Admin Paneli' : 'Danışman Paneli'}</span>
                    </button>
                    <div className="text-sm text-gray-500 hidden md:block">
                        {properties.length} ilan listeleniyor
                    </div>
                    <button onClick={() => navigate('/report')} className="flex items-center gap-1 text-gray-500 hover:text-purple-600 transition" title="Proje Raporu">
                        <FileText size={20} />
                    </button>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition">
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-6 max-w-7xl mx-auto space-y-6">

                {/* Stats Header now includes Rental Widget */}
                <DashboardStatsHeader properties={properties} stats={stats} />

                {/* Filters */}
                <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end relative z-40">
                    {/* ... filter inputs ... */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">En Az Fiyat</label>
                        <input type="number" name="minPrice" placeholder="Örn: 1000000" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.minPrice} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">En Çok Fiyat</label>
                        <input type="number" name="maxPrice" placeholder="Örn: 5000000" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.maxPrice} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Oda Sayısı</label>
                        <select name="rooms" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.rooms} onChange={handleFilterChange}>
                            <option value="">Tümü</option>
                            <option value="1+1">1+1 ve Stüdyo</option>
                            <option value="2+1">2+1 ve Türevleri</option>
                            <option value="3+1">3+1 ve Türevleri</option>
                            <option value="4+">4 Odalılar</option>
                            <option value="5+">5+ ve Üzeri</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fırsat Filtresi</label>
                        <select name="opportunity_filter" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.opportunity_filter} onChange={handleFilterChange}>
                            <option value="">Tümü</option>
                            <option value="price_drop">📉 Fiyatı Düşenler</option>
                            <option value="opportunity">⚡ Fırsat ve Kelepir</option>
                            <option value="bargain">🔥 Sadece Kelepir</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Portal</label>
                        <select name="source" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.source} onChange={handleFilterChange}>
                            <option value="">Tümü</option>
                            <option value="hepsiemlak">Hepsiemlak</option>
                            <option value="sahibinden">Sahibinden</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Kimden (Satıcı)</label>
                        <select name="seller_type" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.seller_type} onChange={handleFilterChange}>
                            <option value="all">Tümü</option>
                            <option value="owner">Bireysel (Sahibinden)</option>
                            <option value="office">Emlak Ofisi / Kurumsal</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Bölge / İlan No</label>
                            <input type="text" name="district" placeholder="Mahalle..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.district} onChange={handleFilterChange} />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center translate-y-[-1px]">
                            <Search size={20} />
                        </button>
                    </div>
                </form>


                {/* Debug / Error Message */}
                {(properties.length === 0 && !loading) && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Görüntülenecek ilan bulunamadı.
                                    <br />
                                    <strong>Sistem Mesajı:</strong> {errorMsg || 'Veri yok veya filtre sonucu boş.'}
                                    <br />
                                    (Veritabanı: {properties.length} / API: {loading ? 'Yükleniyor' : 'Hazır'})
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Toggler & Content */}
                <div className="space-y-4">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border'}`}>
                            <List size={18} /> Liste
                        </button>
                        <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${viewMode === 'map' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border'}`}>
                            <Map size={18} /> Harita
                        </button>
                        <button onClick={() => setViewMode('heatmap')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${viewMode === 'heatmap' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border'}`}>
                            <Map size={18} /> Isı Haritası
                        </button>
                    </div>


                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Yükleniyor...</div>
                    ) : (
                        viewMode === 'list' ? <PropertyTable properties={properties} /> :
                            viewMode === 'map' ? <MapView properties={properties} /> :
                                <HeatmapView />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
