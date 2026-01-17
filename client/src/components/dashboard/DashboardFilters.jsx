import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Search, Filter } from 'lucide-react';

const DashboardFilters = ({ filters, setFilters, onFilter }) => {
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium">
                <Filter size={18} />
                <span>Filtreler</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1.5">İlçe / Mahalle</label>
                    <select
                        id="district"
                        value={filters.district}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    >
                        <option value="">Tümü (Ayvalık)</option>
                        <option value="Ali Çetinkaya">Ali Çetinkaya</option>
                        <option value="150 Evler">150 Evler</option>
                    </select>
                </div>
                <Input
                    id="minPrice"
                    type="number"
                    label="Min Fiyat"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={handleChange}
                />
                <Input
                    id="maxPrice"
                    type="number"
                    label="Max Fiyat"
                    placeholder="5.000.000"
                    value={filters.maxPrice}
                    onChange={handleChange}
                />
                {/* Room Filter */}
                <div>
                    <label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-1.5">Oda Sayısı</label>
                    <select
                        id="rooms"
                        name="rooms"
                        value={filters.rooms}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    >
                        <option value="">Tümü</option>
                        <option value="1+1">1+1</option>
                        <option value="2+1">2+1</option>
                        <option value="3+1">3+1</option>
                        <option value="4+1">4+1</option>
                        <option value="5+1">5+1</option>
                        <option value="Dubleks">Dubleks</option>
                    </select>
                </div>
                <Button onClick={onFilter} className="flex justify-center items-center gap-2">
                    <Search size={18} /> Filtrele
                </Button>
            </div>
        </div>
    );
};

export default DashboardFilters;
