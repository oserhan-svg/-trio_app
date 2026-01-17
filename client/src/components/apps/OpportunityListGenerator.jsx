import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, Filter, Search, Printer } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';

const OpportunityListGenerator = () => {
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
            const response = await api.get('/properties');
            // Default Filter: High Score (>7) AND Owner AND Sahibinden
            // But we allow user to see more if they want
            const allProps = response.data;

            // Pre-sort or pre-filter if needed, but let's just save all and filter in render for now
            // Actually, let's filter for relevant ones to avoid overwhelming
            const relevant = allProps.filter(p =>
                p.seller_type === 'owner' &&
                p.url.includes('sahibinden')
            );

            // Sort by Opportunity Score Desc
            relevant.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));

            setProperties(relevant);

            // Auto-select highly recommended ones (Score > 8)
            const autoSelect = new Set();
            relevant.forEach(p => {
                if (p.opportunity_score >= 8) autoSelect.add(p.id);
            });
            setSelectedIds(autoSelect);

        } catch (error) {
            console.error('Failed to fetch properties:', error);
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
        if (selectedIds.size === properties.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(properties.map(p => p.id)));
        }
    };

    const handleCreateList = () => {
        if (selectedIds.size === 0) return alert('Lütfen en az bir ilan seçin.');

        // Pass selected IDs via state or URL params. 
        // URL params is safer for sharing/refreshing but might be long.
        // Let's use State for internal nav, or LocalStorage if we want persistence.
        // Let's use localStorage to "stage" the report data
        localStorage.setItem('report_selected_ids', JSON.stringify(Array.from(selectedIds)));

        // Navigate to report page in new tab? Or same?
        // Usually reports are better in new tabs for printing
        window.open('/reports/opportunities', '_blank');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
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

            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <button
                    onClick={handleSelectAll}
                    className="text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors flex items-center gap-2"
                >
                    <Check size={16} />
                    {selectedIds.size === properties.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                </button>
                {/* Future: Add filters here */}
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
                        {properties.map(p => (
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
                                    {p.title}
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
                                        {p.opportunity_score}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500">
                                    {p.rooms} • {p.size_m2}m²
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {properties.length === 0 && (
                    <div className="p-10 text-center text-gray-500">
                        Şu an uygun fırsat ilanı bulunamadı.
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpportunityListGenerator;
