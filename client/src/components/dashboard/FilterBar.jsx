import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronDown, Filter, Trash2, Home, Building2, Landmark, Store, Users, User, Briefcase, Sparkles, TrendingDown, Flame, BarChart3, Target, Activity, Database, Wind, Layers } from 'lucide-react';

const FilterBar = ({ filters, metadata, properties = [], onChange, onClearAll, totalResults }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [savedSearches, setSavedSearches] = useState([]);
    const [showSavedSearches, setShowSavedSearches] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);

    // Debounced Local States for Range Inputs to prevent API spam
    const [localPrice, setLocalPrice] = useState({ min: filters.minPrice || '', max: filters.maxPrice || '' });
    const [localSize, setLocalSize] = useState({ min: filters.minSize || '', max: filters.maxSize || '' });

    // Sync local range states when filters change externally (e.g. Clear All)
    useEffect(() => {
        setLocalPrice({ min: filters.minPrice || '', max: filters.maxPrice || '' });
        setLocalSize({ min: filters.minSize || '', max: filters.maxSize || '' });
        setSearchTerm(filters.search || '');
    }, [filters.minPrice, filters.maxPrice, filters.minSize, filters.maxSize, filters.search]);

    // Load saved and history on mount
    useEffect(() => {
        const storedSaved = localStorage.getItem('trio_saved_searches');
        if (storedSaved) {
            try { setSavedSearches(JSON.parse(storedSaved)); } catch (e) { console.error(e); }
        }

        const storedHistory = localStorage.getItem('trio_search_history');
        if (storedHistory) {
            try { setSearchHistory(JSON.parse(storedHistory)); } catch (e) { console.error(e); }
        }
    }, []);

    const addToHistory = (term) => {
        if (!term || term.length < 3) return;
        const updated = [term, ...searchHistory.filter(t => t !== term)].slice(0, 5);
        setSearchHistory(updated);
        localStorage.setItem('trio_search_history', JSON.stringify(updated));
    };

    const saveCurrentSearch = () => {
        const name = prompt('Bu arama için bir isim girin:', `Arama ${savedSearches.length + 1}`);
        if (!name) return;

        const newSearch = {
            id: Date.now(),
            name,
            filters: { ...filters }
        };

        const updated = [...savedSearches, newSearch];
        setSavedSearches(updated);
        localStorage.setItem('trio_saved_searches', JSON.stringify(updated));
    };

    const deleteSavedSearch = (e, id) => {
        e.stopPropagation();
        const updated = savedSearches.filter(s => s.id !== id);
        setSavedSearches(updated);
        localStorage.setItem('trio_saved_searches', JSON.stringify(updated));
    };

    const loadSavedSearch = (savedFilters) => {
        onClearAll();
        Object.entries(savedFilters).forEach(([key, val]) => {
            onChange({ target: { name: key, value: val } });
        });
        setShowSavedSearches(false);
    };

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.search) {
                onChange({ target: { name: 'search', value: searchTerm } });
                if (searchTerm) addToHistory(searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Debounce range inputs
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localPrice.min !== filters.minPrice) onChange({ target: { name: 'minPrice', value: localPrice.min } });
            if (localPrice.max !== filters.maxPrice) onChange({ target: { name: 'maxPrice', value: localPrice.max } });
        }, 800);
        return () => clearTimeout(timer);
    }, [localPrice.min, localPrice.max]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSize.min !== filters.minSize) onChange({ target: { name: 'minSize', value: localSize.min } });
            if (localSize.max !== filters.maxSize) onChange({ target: { name: 'maxSize', value: localSize.max } });
        }, 800);
        return () => clearTimeout(timer);
    }, [localSize.min, localSize.max]);

    const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'sort' || key === 'page' || key === 'limit') return false;
        if (key === 'seller_type' && value === 'all') return false;
        if (key === 'category' && value === 'all') return false;
        if (key === 'listingType' && value === 'all') return false;
        return value !== '' && value !== null && (Array.isArray(value) ? value.length > 0 : true);
    }).length;

    const removeFilter = (key) => {
        if (key === 'seller_type' || key === 'category' || key === 'listingType') {
            onChange({ target: { name: key, value: 'all' } });
        } else if (key === 'rooms' && Array.isArray(filters.rooms)) {
            onChange({ target: { name: key, value: [] } });
        } else {
            onChange({ target: { name: key, value: '' } });
        }
    };

    const getFilterLabel = (key, value) => {
        switch (key) {
            case 'listingType': return value === 'sale' ? 'Satılık' : value === 'rent' ? 'Kiralık' : '';
            case 'category': return value.charAt(0).toUpperCase() + value.slice(1);
            case 'rooms': return Array.isArray(value) ? `${value.length} Oda` : value;
            case 'seller_type': return value === 'owner' ? 'Sahibinden' : 'Emlak Ofisi';
            case 'opportunity_filter':
                if (value === 'price_drop') return '📉 Düşüş';
                if (value === 'opportunity') return '⚡ Fırsat';
                if (value === 'bargain') return '🔥 Kelepir';
                return '';
            case 'source': return value.charAt(0).toUpperCase() + value.slice(1);
            case 'building_age': return `Yaş: ${value}`;
            case 'heating_type': return `Isıtma: ${value}`;
            case 'floor_location': return `Kat: ${value}`;
            case 'minPrice':
                return value >= 1000000 ? `Min: ${(value / 1000000).toFixed(1)}M ₺` : `Min: ${(value / 1000).toFixed(0)}k ₺`;
            case 'maxPrice':
                return value >= 1000000 ? `Max: ${(value / 1000000).toFixed(1)}M ₺` : `Max: ${(value / 1000).toFixed(0)}k ₺`;
            case 'minSize': return `Min: ${value}m²`;
            case 'maxSize': return `Max: ${value}m²`;
            default: return value;
        }
    };

    return (
        <div className="space-y-6">
            {/* Desktop Filter Bar - Internal z-index elevated to ensure children clear sibling widgets */}
            <div className="hidden lg:flex flex-col gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl shadow-blue-900/5 dark:shadow-blue-900/40 relative group z-[100] border border-transparent dark:border-slate-800 transition-colors duration-300">
                {/* Decorative Background Glow removed for better stacking clarity */}

                <div className="grid grid-cols-12 gap-6">
                    {/* Search Input */}
                    <div className="col-span-4 relative group/search">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="text-slate-400 group-focus-within/search:text-blue-500 transition-colors" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="İlan başlığı, mahalle veya ID ile derinden ara..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500/30 dark:focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchHistory.length > 0 && !searchTerm && (
                            <div className="absolute left-0 top-full mt-2 flex flex-wrap gap-1.5 z-[1000] bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-2xl w-full border border-slate-100 dark:border-slate-700">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] block w-full mb-2 ml-1 opacity-60">GEÇMİŞ ARAMALAR</span>
                                {searchHistory.map((h, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSearchTerm(h)}
                                        className="text-[11px] font-black text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-700/50 px-3 py-1 rounded-full hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-95"
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="col-span-2">
                        <DropdownFilter
                            label="İşlem Tipi"
                            name="listingType"
                            value={filters.listingType}
                            options={[
                                { value: 'all', label: 'TÜM İLANLAR' },
                                { value: 'sale', label: 'SATILIK' },
                                { value: 'rent', label: 'KİRALIK' }
                            ]}
                            onChange={onChange}
                        />
                    </div>

                    <div className="col-span-2">
                        <DropdownFilter
                            label="Mülk Tipi"
                            name="category"
                            value={filters.category}
                            options={[
                                { value: 'all', label: 'TÜMÜ' },
                                ...(metadata?.categories || [])
                                    .filter(c => c.label)
                                    .map(c => ({
                                        value: c.label,
                                        label: `${c.label.toUpperCase()} (${c.count})`
                                    }))
                            ]}
                            onChange={onChange}
                        />
                    </div>

                    <div className="col-span-2">
                        <MultiSelectRoom
                            label="Metraj / Oda"
                            selectedValues={filters.rooms ? (Array.isArray(filters.rooms) ? filters.rooms : filters.rooms.split(',')) : []}
                            options={(metadata?.rooms || []).filter(r => r.label)}
                            onChange={(vals) => onChange({ target: { name: 'rooms', value: vals } })}
                        />
                    </div>

                    <div className="col-span-2">
                        <DropdownFilter
                            label="Yatırım Radarı"
                            name="opportunity_filter"
                            value={filters.opportunity_filter}
                            isOpportunity={true}
                            options={[
                                { value: '', label: 'TÜMÜ' },
                                { value: 'price_drop', label: '📉 FİYATI DÜŞEN' },
                                { value: 'opportunity', label: '⚡ FIRSAT & KELEPİR' },
                                { value: 'bargain', label: '🔥 SADECE KELEPİR' }
                            ]}
                            onChange={onChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 pt-6 border-t border-slate-200/50 dark:border-slate-800">
                    <div className="col-span-4 flex gap-6">
                        <RangeInput
                            label="Fİyat Aralığı"
                            minName="min"
                            maxName="max"
                            minPlaceholder="0 ₺"
                            maxPlaceholder="Max ₺"
                            minValue={localPrice.min}
                            maxValue={localPrice.max}
                            onChange={(e) => setLocalPrice(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                        />
                        <RangeInput
                            label="m² Değerİ"
                            minName="min"
                            maxName="max"
                            minPlaceholder="Min"
                            maxPlaceholder="Max"
                            minValue={localSize.min}
                            maxValue={localSize.max}
                            onChange={(e) => setLocalSize(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                        />
                    </div>

                    <div className="col-span-4 flex gap-4">
                        <DropdownFilter
                            label="Lokasyon / İlçe"
                            name="district"
                            value={filters.district}
                            options={[
                                { value: '', label: 'TÜM İLÇELER' },
                                ...(metadata?.districts || [])
                                    .filter(d => d.label)
                                    .map(d => ({
                                        value: d.label,
                                        label: `${d.label.toUpperCase()} (${d.count})`
                                    }))
                            ]}
                            onChange={onChange}
                        />
                        <LocationInput
                            label="Mahalle Seçİmİ"
                            name="neighborhood"
                            value={filters.neighborhood}
                            placeholder="Spesifik bir yer..."
                            onChange={onChange}
                        />
                    </div>

                    <div className="col-span-4 grid grid-cols-3 gap-3">
                        <DropdownFilter
                            label="Bİna Yaşı"
                            name="building_age"
                            value={filters.building_age}
                            options={[
                                { value: '', label: 'TÜMÜ' },
                                { value: '0', label: 'SIFIR' },
                                { value: '1-5', label: '1-5 YIL' },
                                { value: '5-10', label: '5-10 YIL' },
                                { value: '11-15', label: '11-15 YIL' },
                                { value: '16-20', label: '16-20 YIL' },
                                { value: '21+', label: '21+' }
                            ]}
                            onChange={onChange}
                        />
                        <DropdownFilter
                            label="Isıtma"
                            name="heating_type"
                            value={filters.heating_type}
                            options={[
                                { value: '', label: 'TÜMÜ' },
                                { value: 'Kombi', label: 'KOMBİ' },
                                { value: 'Merkezi', label: 'MERKEZİ' },
                                { value: 'Yerden', label: 'YERDEN' },
                                { value: 'Klima', label: 'KLİMA' }
                            ]}
                            onChange={onChange}
                        />
                        <DropdownFilter
                            label="Kat"
                            name="floor_location"
                            value={filters.floor_location}
                            options={[
                                { value: '', label: 'TÜMÜ' },
                                { value: 'Bahçe', label: 'GİRİŞ/BAHÇE' },
                                { value: 'Ara Kat', label: 'ARA KAT' },
                                { value: 'En Üst', label: 'EN ÜST KAT' },
                                { value: 'Dublex', label: 'DUBLEX' }
                            ]}
                            onChange={onChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 pt-6 border-t border-slate-200/50 dark:border-slate-800">
                    <div className="col-span-4 flex items-center gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">İlan Kaynağı</label>
                            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl shadow-inner border border-transparent focus-within:border-blue-500/20 transition-all">
                                <QuickToggle
                                    active={filters.seller_type === 'owner'}
                                    onClick={() => onChange({ target: { name: 'seller_type', value: filters.seller_type === 'owner' ? 'all' : 'owner' } })}
                                    icon={User}
                                    label="Bİreysel"
                                />
                                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1 my-auto opacity-30" />
                                <div className="relative flex-1 group/source">
                                    <select
                                        name="source"
                                        value={filters.source}
                                        onChange={onChange}
                                        className="w-full bg-transparent border-none text-[11px] font-black text-slate-800 dark:text-slate-200 py-2 focus:ring-0 cursor-pointer appearance-none px-2 uppercase tracking-widest outline-none"
                                    >
                                        <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">TÜM PORTALLAR</option>
                                        <option value="sahibinden" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">SAHİBİNDEN</option>
                                        <option value="hepsiemlak" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">HEPSİEMLAK</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/source:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-8 flex items-end justify-end gap-3">
                        <button
                            onClick={onClearAll}
                            className="h-12 w-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm border border-rose-100/50"
                            title="Filtreleri Sıfırla"
                            aria-label="Filtreleri Sıfırla"
                        >
                            <Trash2 size={20} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowSavedSearches(!showSavedSearches)}
                                className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 ${savedSearches.length > 0 ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-900 dark:hover:bg-slate-100 dark:hover:text-slate-900 hover:text-white' : 'text-slate-300 dark:text-slate-600 opacity-50'}`}
                            >
                                <Sparkles size={14} />
                                <span>Kayıtlı Aramalar ({savedSearches.length})</span>
                            </button>

                            {showSavedSearches && (
                                <div className="absolute right-0 bottom-full mb-3 w-72 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-blue-900/40 z-[1000] border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Favorİ Aramalar</span>
                                        <Target size={14} className="text-blue-500" />
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                        {savedSearches.length === 0 ? (
                                            <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs italic">Kayıtlı arama yok.</div>
                                        ) : (
                                            savedSearches.map(s => (
                                                <div key={s.id} onClick={() => loadSavedSearch(s.filters)} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer transition-all border border-transparent hover:shadow-lg hover:shadow-blue-500/20">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-white truncate pr-2">{s.name}</span>
                                                    <button aria-label="Kaydı Sil" onClick={(e) => { e.stopPropagation(); deleteSavedSearch(e, s.id); }} className="p-1.5 text-slate-400 dark:text-slate-500 group-hover:text-white/50 hover:text-white! transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats Bar Integrated Inside */}
                <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <QuickStats properties={properties} />
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={saveCurrentSearch}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-800 transition-colors flex items-center gap-1.5"
                            >
                                <Flame size={12} className="animate-pulse" />
                                Bu Kombİnasyonu Kaydet
                            </button>
                        )}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                        Canlı Pazar Derİnlİğİ: <span className="text-slate-900 dark:text-slate-100 font-bold">{totalResults.toLocaleString()} İLAN</span>
                    </div>
                </div>
            </div>

            {/* Active Filter Chips - Redesigned */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2.5 px-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-1">Aktİf Fİltreler:</div>
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value || key === 'sort' || key === 'page' || key === 'limit') return null;
                        if (key === 'seller_type' && value === 'all') return null;
                        if (key === 'category' && value === 'all') return null;
                        if (key === 'listingType' && value === 'all') return null;
                        if (Array.isArray(value) && value.length === 0) return null;

                        return (
                            <div
                                key={key}
                                className="flex items-center gap-2 pl-3 pr-1 py-1 bg-white dark:bg-slate-800 rounded-full text-[11px] font-black text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-left duration-500"
                            >
                                <span className="uppercase tracking-tight opacity-70 border-r border-slate-100 dark:border-slate-700 pr-2 mr-1">
                                    {key === 'search' ? 'ARAMA' :
                                        key === 'building_age' ? 'YAŞ' :
                                            key === 'heating_type' ? 'ISITMA' :
                                                key === 'floor_location' ? 'KAT' :
                                                    key.toUpperCase()}
                                </span>
                                <span className="text-blue-600 dark:text-blue-400 truncate max-w-[150px]">{getFilterLabel(key, value)}</span>
                                <button
                                    aria-label={`${key} filtresini kaldır`}
                                    onClick={() => removeFilter(key)}
                                    className="p-1 px-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 transition-all active:scale-75"
                                >
                                    <X size={12} strokeWidth={3} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Mobile View remains the same but technical filters can be added if needed later */}
        </div>
    );
};

const DropdownFilter = ({ label, name, value, options, onChange, isOpportunity = false, compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    const handleSelect = (val) => {
        onChange({ target: { name, value: val } });
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col gap-2 w-full group relative" ref={containerRef}>
            {!compact && <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2 group-focus-within:text-blue-500 transition-colors">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full appearance-none bg-slate-100/50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl px-4 font-black transition-all shadow-inner outline-none cursor-pointer flex items-center justify-between
                    ${compact ? 'py-2 text-[10px] tracking-wider' : 'py-4 text-[10px] tracking-tight'} 
                    ${value !== 'all' && value !== '' ? 'bg-white dark:bg-slate-800 border-blue-500/20 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/5' : 'text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'} 
                    ${isOpen ? 'bg-white dark:bg-slate-800 border-blue-500/30 dark:border-blue-500/50 ring-4 ring-blue-500/5' : ''}
                `}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} size={16} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-3 w-full bg-white dark:bg-slate-800 p-3 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-blue-900/40 z-[1000] border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {options.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={`
                                    flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all
                                    ${value === opt.value ? 'bg-blue-600 text-white shadow-md glow-blue' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-[11px]'}
                                `}
                            >
                                <span className={`tracking-tight ${value === opt.value ? 'font-black' : ''}`}>{opt.label}</span>
                                {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const RangeInput = ({ label, minName, maxName, minPlaceholder, maxPlaceholder, minValue, maxValue, onChange }) => (
    <div className="flex flex-col gap-2 flex-1 group">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2 group-focus-within:text-blue-500 transition-colors uppercase">{label}</label>
        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-transparent focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-blue-500/10 dark:focus-within:border-blue-500/30 transition-all shadow-inner">
            <input
                type="number"
                name={minName}
                value={minValue}
                placeholder={minPlaceholder}
                onChange={onChange}
                className="w-full bg-transparent border-none px-3 py-2.5 text-xs font-black placeholder:text-slate-300 focus:ring-0 uppercase tracking-widest text-slate-800 outline-none"
            />
            <div className="h-4 w-1 flex items-center justify-center opacity-20">—</div>
            <input
                type="number"
                name={maxName}
                value={maxValue}
                placeholder={maxPlaceholder}
                onChange={onChange}
                className="w-full bg-transparent border-none px-3 py-2.5 text-xs font-black placeholder:text-slate-300 focus:ring-0 uppercase tracking-widest text-slate-800 outline-none"
            />
        </div>
    </div>
);

const LocationInput = ({ label, name, value, placeholder, onChange }) => (
    <div className="flex flex-col gap-2 flex-1 group">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-blue-500 transition-colors uppercase">{label}</label>
        <div className="relative">
            <input
                type="text"
                name={name}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                className="w-full pl-4 pr-10 py-4 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-[11px] font-black text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500/30 dark:focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner uppercase tracking-wider outline-none"
            />
            <Activity size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
        </div>
    </div>
);

const MultiSelectRoom = ({ label, selectedValues, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleValue = (val) => {
        const newVals = selectedValues.includes(val) ? selectedValues.filter(v => v !== val) : [...selectedValues, val];
        onChange(newVals);
    };

    const sortedOptions = [...options].filter(o => o.label).sort((a, b) => a.label.localeCompare(b.label));

    return (
        <div className="flex flex-col gap-2 w-full group relative" ref={containerRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-blue-500 transition-colors uppercase">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full min-h-[50px] bg-slate-100/50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl px-4 py-2
                    text-[10px] font-black text-slate-800 dark:text-slate-200 cursor-pointer transition-all shadow-inner
                    flex items-center justify-between uppercase tracking-widest
                    ${selectedValues.length > 0 ? 'bg-white dark:bg-slate-800 border-blue-500/20 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/5' : 'hover:bg-white dark:hover:bg-slate-800 focus-within:bg-white'}
                `}
            >
                <span className="truncate">
                    {selectedValues.length === 0 ? 'TÜM SEÇENEKLER' : `${selectedValues.length} ODA TİPİ`}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-blue-900/40 z-[1000] border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3 opacity-60">ODA SEÇENEKLERİ</div>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {sortedOptions.map(opt => (
                            <label key={opt.label} className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all group ${selectedValues.includes(opt.label) ? 'bg-blue-600 text-white shadow-md glow-blue' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                <div className={`w-4 h-4 rounded-lg border-2 flex items-center justify-center transition-all ${selectedValues.includes(opt.label) ? 'border-white bg-white text-blue-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400'}`}>
                                    {selectedValues.includes(opt.label) && <Sparkles size={10} fill="currentColor" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedValues.includes(opt.label)}
                                    onChange={() => toggleValue(opt.label)}
                                />
                                <span className={`ml-3 text-[11px] font-black tracking-tight ${selectedValues.includes(opt.label) ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600'}`}>
                                    {opt.label} <span className={`ml-1 font-medium ${selectedValues.includes(opt.label) ? 'opacity-60' : 'text-slate-400 dark:text-slate-500'}`}>({opt.count})</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const QuickToggle = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all
            ${active
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-blue-500/10'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }
        `}
    >
        <Icon size={14} className={active ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-600'} />
        {label}
    </button>
);

const MobileFilterGroup = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em]">{label}</label>
        {children}
    </div>
);

const QuickStats = ({ properties = [] }) => {
    const stats = useMemo(() => {
        if (!properties || properties.length === 0) return null;
        const prices = properties.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
        if (prices.length === 0) return null;

        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const opportunities = properties.filter(p => p.opportunity_score > 70 || p.deviation > 10).length;
        const density = (opportunities / properties.length) * 100;

        return { avg: Math.round(avg), density: Math.round(density) };
    }, [properties]);

    if (!stats) return null;

    return (
        <div className="flex items-center gap-6 animate-in slide-in-from-left duration-700">
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5 opacity-60">
                    <BarChart3 size={11} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">ORT. PORTFÖY DEĞERİ</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">₺{(stats.avg / 1000).toLocaleString('tr-TR')}k</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5 opacity-60">
                    <Target size={11} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">FIRSAT YOĞUNLUĞU</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">%{stats.density}</span>
                    <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${stats.density}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
