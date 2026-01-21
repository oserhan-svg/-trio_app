import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, Printer, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const OpportunityListGenerator = ({ onBack }) => {
    // eslint-disable-next-line no-unused-vars
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filter, setFilter] = useState('opportunity'); // 'opportunity' or 'all'

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            // Fetch all listings for selection (Owner + Agency)
            const response = await api.get('/properties', {
                params: {
                    limit: 3000,
                    status: 'active'
                }
            });
            const raw = response.data;
            const allProps = Array.isArray(raw) ? raw : (raw.data || []);

            // Sort by Opportunity Score Desc
            allProps.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));

            setProperties(allProps);
            // Start with empty selection so user is in full control
            setSelectedIds(new Set());

        } catch (error) {
            console.error('Failed to fetch properties:', error);
            toast.error('İlanlar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredProperties.length && filteredProperties.every(p => selectedIds.has(p.id))) {
            // If all filtered ones are already selected, clear selection
            setSelectedIds(new Set());
        } else {
            // Otherwise select all currently filtered ones
            const newSet = new Set(selectedIds);
            filteredProperties.forEach(p => newSet.add(p.id));
            setSelectedIds(newSet);
        }
    };

    const handleCreateList = () => {
        if (selectedIds.size === 0) return toast.error('Lütfen en az bir ilan seçin.');

        if (selectedIds.size > 20) {
            const confirmed = window.confirm(`${selectedIds.size} adet ilan seçtiniz. Bülteni oluşturmak istediğinize emin misiniz?`);
            if (!confirmed) return;
        }

        const idsString = Array.from(selectedIds).join(',');
        window.open(`/reports/opportunities?ids=${idsString}`, '_blank');
    };

    const handleClearSelection = () => {
        setSelectedIds(new Set());
    };

    // Filter Logic
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Filter Logic
    const filteredProperties = properties.filter(p => {
        // 1. Opportunity Score Filter
        const meetsOpportunity = filter === 'opportunity' ? (Number(p.opportunity_score) || 0) >= 7 : true;
        if (!meetsOpportunity) return false;

        // 2. Category Filter
        if (selectedCategory === 'all') return true;

        const cat = (p.category || '').toLowerCase();
        const title = (p.title || '').toLowerCase();

        if (selectedCategory === 'residence') {
            return cat === 'residential' || cat === 'daire' || title.includes('daire') || title.includes('rezidans');
        }
        if (selectedCategory === 'villa') {
            return cat === 'villa' || cat === 'mustakil' || title.includes('villa') || title.includes('müstakil') || title.includes('yazlık');
        }
        if (selectedCategory === 'land') {
            return cat === 'land' || cat === 'tarla' || cat === 'zeytinlik' || cat === 'arsa' ||
                title.includes('arsa') || title.includes('tarla') || title.includes('zeytinlik') || title.includes('arazi') || title.includes('bahçe');
        }
        if (selectedCategory === 'commercial') {
            return cat === 'commercial' || cat === 'tourism' || cat === 'isyeri' ||
                title.includes('dükkan') || title.includes('mağaza') || title.includes('otel') || title.includes('pansiyon') || title.includes('ofis');
        }

        return true;
    });

    // Missing Data Logic Removed

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="mr-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <FileText className="text-purple-600" />
                        Fırsat Bülteni Oluşturucu
                    </h2>
                    <p className="text-sm text-gray-500">Danışmanlara göndermek için fırsat listesi hazırlayın.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600 font-medium">
                        {selectedIds.size} ilan seçildi
                    </div>

                    <Button onClick={handleCreateList} className="flex items-center gap-2">
                        <Printer size={18} />
                        Bülteni Oluştur
                    </Button>
                </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-4 overflow-x-auto border-b border-gray-200 justify-between items-center">
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setFilter('opportunity')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'opportunity'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        Fırsatlar (Puan 7+)
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        Tüm İlanlar
                    </button>

                    <div className="h-6 w-px bg-gray-300 mx-2"></div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                        <option value="all">Tüm Tipler</option>
                        <option value="residence">Konut / Daire</option>
                        <option value="villa">Villa / Müstakil</option>
                        <option value="land">Arsa / Tarla / Zeytinlik</option>
                        <option value="commercial">Ticari / Turistik</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSelectAll}
                        className="text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-200"
                    >
                        <Check size={16} />
                        {selectedIds.size >= filteredProperties.length && filteredProperties.length > 0 ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                    </button>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleClearSelection}
                            className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-2 px-3 py-1.5 rounded hover:bg-red-50"
                        >
                            Seçimi Sıfırla
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 w-10">Seç</th>
                            <th className="px-4 py-3">İlan Başlığı</th>
                            <th className="px-4 py-3">Bölge</th>
                            <th className="px-4 py-3">Fiyat</th>
                            <th className="px-4 py-3 text-center">Puan</th>
                            <th className="px-4 py-3 text-right">M² / Oda</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map(p => (
                                <tr
                                    key={p.id}
                                    className={`hover:bg-purple-50 transition-colors cursor-pointer ${selectedIds.has(p.id) ? 'bg-purple-50/50' : ''}`}
                                    onClick={() => toggleSelection(p.id)}
                                >
                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(p.id)}
                                            onChange={() => toggleSelection(p.id)}
                                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate" title={p.title}>
                                        <div className="flex flex-col">
                                            <span>{p.title}</span>
                                            {(!p.images || p.images.length === 0) && (
                                                <span className="text-[10px] text-orange-600 font-bold bg-orange-100 px-1.5 py-0.5 rounded w-fit mt-1">Resimsiz</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal mt-0.5">{p.seller_name || 'Sahibinden'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {p.neighborhood}, {p.district}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">
                                        {parseFloat(p.price).toLocaleString()} ₺
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${p.opportunity_score >= 8 ? 'bg-emerald-100 text-emerald-700' :
                                            p.opportunity_score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {p.opportunity_score || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-500">
                                        {p.rooms} • {p.size_m2}m²
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-gray-500">
                                    Bu filtreye uygun ilan bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OpportunityListGenerator;
