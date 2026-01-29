import React, { useState, useEffect } from 'react';
import { Filter, Save, Star, X, Plus } from 'lucide-react';
import api from '../../services/api';

const SmartFilterPanel = ({ onFilterChange, currentFilters }) => {
    const [showPanel, setShowPanel] = useState(false);
    const [filters, setFilters] = useState(currentFilters || {});
    const [savedPresets, setSavedPresets] = useState([]);
    const [presetName, setPreset Name] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    useEffect(() => {
        loadSavedPresets();
    }, []);

    const loadSavedPresets = async () => {
        try {
            const res = await api.get('/user-preferences/filter-presets');
            setSavedPresets(res.data || []);
        } catch (error) {
            console.error('Failed to load presets:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };

        // Remove empty filters
        if (!value || value === '') {
            delete newFilters[key];
        }

        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const savePreset = async () => {
        if (!presetName.trim()) {
            alert('Lütfen bir isim girin');
            return;
        }

        try {
            await api.post('/user-preferences/filter-preset', {
                name: presetName,
                filters: filters
            });

            await loadSavedPresets();
            setShowSaveDialog(false);
            setPresetName('');
            alert('Filtre kaydedildi!');
        } catch (error) {
            alert('Kaydetme başarısız: ' + error.message);
        }
    };

    const applyPreset = (preset) => {
        setFilters(preset.filters);
        onFilterChange(preset.filters);
        setShowPanel(false);
    };

    const deletePreset = async (presetId) => {
        if (!confirm('Bu filtreyi silmek istediğinizden emin misiniz?')) return;

        try {
            await api.delete(`/user-preferences/filter-preset/${presetId}`);
            await loadSavedPresets();
        } catch (error) {
            alert('Silme başarısız');
        }
    };

    const clearFilters = () => {
        setFilters({});
        onFilterChange({});
    };

    const activeFilterCount = Object.keys(filters).filter(k => filters[k]).length;

    return (
        <div className="relative">
            {/* Filter Button */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${activeFilterCount > 0
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
            >
                <Filter size={18} />
                Filtreler
                {activeFilterCount > 0 && (
                    <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Filter Panel */}
            {showPanel && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-t-xl flex justify-between items-center">
                        <h3 className="font-bold">Gelişmiş Filtreler</h3>
                        <button onClick={() => setShowPanel(false)} className="hover:bg-white/20 p-1 rounded">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {/* District Filter */}
                        <FilterField
                            label="İlçe"
                            value={filters.district || ''}
                            onChange={(v) => handleFilterChange('district', v)}
                            options={['Ayvalık', 'Cunda', 'Sarımsaklı', 'Altınova', 'Küçükköy']}
                        />

                        {/* Price Range */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Fiyat Aralığı</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minPrice || ''}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxPrice || ''}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        {/* Rooms */}
                        <FilterField
                            label="Oda Sayısı"
                            value={filters.rooms || ''}
                            onChange={(v) => handleFilterChange('rooms', v)}
                            options={['1+1', '2+1', '3+1', '4+1', '5+1']}
                        />

                        {/* Status */}
                        <FilterField
                            label="Durum"
                            value={filters.status || ''}
                            onChange={(v) => handleFilterChange('status', v)}
                            options={['active', 'removed', 'sold']}
                        />

                        {/* Seller Type */}
                        <FilterField
                            label="Satıcı Tipi"
                            value={filters.sellerType || ''}
                            onChange={(v) => handleFilterChange('sellerType', v)}
                            options={[
                                { value: 'owner', label: 'Sahibinden' },
                                { value: 'office', label: 'Emlak Ofisi' }
                            ]}
                        />

                        {/* Has Images */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.hasImages || false}
                                onChange={(e) => handleFilterChange('hasImages', e.target.checked)}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm font-medium text-gray-700">Sadece Fotoğraflı İlanlar</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 p-4 space-y-2">
                        <div className="flex gap-2">
                            <button
                                onClick={clearFilters}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition"
                            >
                                Temizle
                            </button>
                            <button
                                onClick={() => setShowSaveDialog(true)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <Save size={16} />
                                Kaydet
                            </button>
                        </div>

                        {/* Saved Presets */}
                        {savedPresets.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                                <div className="text-xs font-bold text-gray-500 mb-2">Kayıtlı Filtreler</div>
                                <div className="space-y-1">
                                    {savedPresets.map((preset) => (
                                        <div key={preset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                            <button
                                                onClick={() => applyPreset(preset)}
                                                className="flex-1 text-left flex items-center gap-2 text-sm font-medium text-gray-700"
                                            >
                                                <Star size={14} className="text-yellow-500" />
                                                {preset.name}
                                            </button>
                                            <button
                                                onClick={() => deletePreset(preset.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Filtre Kaydet</h3>
                        <input
                            type="text"
                            placeholder="Filtre adı (örn: Cunda Müstakiller)"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowSaveDialog(false);
                                    setPresetName('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-bold"
                            >
                                İptal
                            </button>
                            <button
                                onClick={savePreset}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FilterField = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
            <option value="">Tümü</option>
            {options.map((opt) => (
                <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
    </div>
);

export default SmartFilterPanel;
