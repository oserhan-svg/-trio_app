import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, FileSpreadsheet, Instagram, Eye, ChevronLeft, ChevronRight, FileText, TrendingDown, Home, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../services/api';

const PropertyTable = ({ properties, currentSort, onSortChange, totalCount }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    // Reset page when data changes (e.g. filter applied)
    useEffect(() => {
        setCurrentPage(1);
    }, [properties]);

    // Pagination Logic
    const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentData = properties.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Optional: Scroll to top of table
            // document.getElementById('property-table-top')?.scrollIntoView({ behavior: 'smooth' }); 
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/properties/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'emlak_listesi.xlsx');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Excel indirilemedi.');
        }
    };

    const handleGenerateStory = async (id) => {
        try {
            const response = await api.get(`/images/story/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `instagram_story_${id}.jpg`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Image generation failed:', error);
            alert('Görsel oluşturulamadı.');
        }
    };

    const SortHeader = ({ label, sortKeyBase, currentSort, onSortChange }) => {
        const isCurrent = currentSort === `${sortKeyBase}_asc` || currentSort === `${sortKeyBase}_desc` || (sortKeyBase === 'date' && currentSort === 'newest');
        const isDesc = currentSort === `${sortKeyBase}_desc` || (sortKeyBase === 'date' && currentSort === 'newest');

        const handleClick = () => {
            if (!onSortChange) return;
            if (sortKeyBase === 'date') {
                onSortChange(currentSort === 'newest' ? 'date_asc' : 'newest');
            } else {
                onSortChange(isDesc ? `${sortKeyBase}_asc` : `${sortKeyBase}_desc`);
            }
        };

        return (
            <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition group"
                onClick={handleClick}
            >
                <div className="flex items-center gap-1">
                    {label}
                    <div className={`transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                        {isDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </div>
                </div>
            </th>
        );
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-700">
                    İlan Listesi <span className="text-sm font-normal text-gray-500">({totalCount || properties.length} ilan)</span>
                </h2>
                <div className="flex items-center gap-4">
                    {/* Pagination Controls (Top) */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span>Sayfa {currentPage} / {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                    >
                        <FileSpreadsheet size={16} />
                        Excel
                    </button>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4 bg-gray-100">
                {currentData.length > 0 ? (
                    currentData.map((prop) => (
                        <div key={prop.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3 relative">
                            {/* Image & Header Container */}
                            <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div className="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden relative">
                                    {prop.images && prop.images.length > 0 ? (
                                        <img
                                            src={prop.images[0]}
                                            alt={prop.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Home size={24} />
                                        </div>
                                    )}
                                    {prop.has_recent_price_drop && (
                                        <div className="absolute top-1 left-1 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                            <TrendingDown size={10} />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            {prop.url.includes('hepsiemlak') && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white shadow-sm">
                                                    Hepsiemlak
                                                </span>
                                            )}
                                            {prop.url.includes('sahibinden') && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-400 text-black shadow-sm">
                                                    Sahibinden
                                                </span>
                                            )}
                                            <span className="text-[10px] text-gray-400">#{prop.external_id?.split('block')[0]}</span>
                                        </div>
                                        <div className="text-right whitespace-nowrap pl-1">
                                            <div className="font-bold text-blue-600 text-sm">
                                                {(parseFloat(prop.price) / 1000).toLocaleString('tr-TR')}k
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight mb-1">{prop.title?.split('#')[0].trim()}</h3>

                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                        {prop.seller_name && prop.seller_name !== 'Bilinmiyor' ? (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${prop.seller_type === 'owner' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                {prop.seller_name}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic">Sahiplik Bilgisi Yok</span>
                                        )}
                                        <div className="text-xs text-gray-500">
                                            {prop.district} / {prop.neighborhood}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Opportunity Badge */}
                            {prop.opportunity_label && prop.opportunity_label !== 'Normal' && prop.opportunity_label !== 'Veri Yok' && (
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold w-full justify-center
                                ${prop.opportunity_label.includes('Kelepir') ? 'bg-green-600 text-white' :
                                        prop.opportunity_label.includes('Fırsat') ? 'bg-green-100 text-green-800' :
                                            prop.opportunity_label.includes('Uygun') ? 'bg-blue-50 text-blue-700' :
                                                prop.opportunity_label.includes('pahalı') || prop.opportunity_label.includes('Yüksek') ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {prop.opportunity_label}
                                    {prop.deviation > 0 && ` (%${prop.deviation})`}
                                </div>
                            )}

                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 border-t border-b border-gray-100 py-2">
                                <div>
                                    <span className="block text-gray-400 text-[10px]">Konum</span>
                                    {prop.district} / {prop.neighborhood}
                                </div>
                                <div>
                                    <span className="block text-gray-400 text-[10px]">Özellikler</span>
                                    {prop.rooms} • {prop.size_m2}m²
                                </div>
                                <div>
                                    <span className="block text-gray-400 text-[10px]">Kat / Yaş</span>
                                    {prop.floor_location} | {prop.building_age} Yıl
                                </div>
                                <div>
                                    <span className="block text-gray-400 text-[10px]">Tahmini Kira</span>
                                    {prop.roi ? `${prop.roi.estimatedMonthlyRent.toLocaleString('tr-TR')} TL` : '-'}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                                <Link
                                    to={`/property/${prop.id}`}
                                    className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 rounded text-center text-sm font-medium flex items-center justify-center gap-1"
                                >
                                    <Eye size={16} /> Detay
                                </Link>
                                <a
                                    href={prop.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center"
                                >
                                    <ExternalLink size={16} />
                                </a>
                                <button
                                    onClick={() => handleGenerateStory(prop.id)}
                                    className="px-3 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded flex items-center justify-center"
                                >
                                    <Instagram size={16} />
                                </button>
                                <button
                                    onClick={() => navigate(`/property-listing/${prop.id}`)}
                                    className="px-3 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded flex items-center justify-center"
                                >
                                    <FileText size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        Bu filtreleme kriterlerine uygun ilan bulunamadı.
                    </div>
                )}
            </div >

            {/* Desktop Table View */}
            < div className="hidden md:block overflow-x-auto flex-1" >
                <table className="min-w-full divide-y divide-gray-200" id="property-table-top">
                    {/* ... (keep existing desktop Thead and Tbody) */}
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <SortHeader label="Tarih" sortKeyBase="date" currentSort={currentSort} onSortChange={onSortChange} />
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İlan Başlığı</th>
                            <SortHeader label="Fiyat" sortKeyBase="price" currentSort={currentSort} onSortChange={onSortChange} />
                            <SortHeader label="Konum" sortKeyBase="location" currentSort={currentSort} onSortChange={onSortChange} />
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Özellikler</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yatırım (ROI)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.length > 0 ? (
                            currentData.map((prop) => (
                                <tr key={prop.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(prop.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            {prop.url.includes('hepsiemlak') && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white shadow-sm">
                                                    Hepsiemlak
                                                </span>
                                            )}
                                            {prop.url.includes('sahibinden') && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-black shadow-sm">
                                                    Sahibinden
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 line-clamp-1" title={prop.title}>{prop.title?.split('#')[0].trim()}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {prop.seller_name && prop.seller_name !== 'Bilinmiyor' ? (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${prop.seller_type === 'owner' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                    {prop.seller_name}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 font-medium italic">Sahiplik Bilgisi Yok</span>
                                            )}
                                            <span className="text-[10px] text-gray-400">İlan No: {prop.external_id?.split('block')[0]}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                        <div className="flex items-center">
                                            {parseFloat(prop.price).toLocaleString('tr-TR')} TL
                                            {prop.has_recent_price_drop && (
                                                <span className="ml-2 text-green-600 bg-green-100 p-0.5 rounded-full" title="Son 30 gün içinde fiyatı düştü">
                                                    <TrendingDown size={16} />
                                                </span>
                                            )}
                                        </div>
                                        {prop.opportunity_label && prop.opportunity_label !== 'Normal' && prop.opportunity_label !== 'Veri Yok' && (
                                            <span className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold shadow-sm 
                                            ${prop.opportunity_label.includes('Kelepir') ? 'bg-green-600 text-white animate-pulse' :
                                                    prop.opportunity_label.includes('Fırsat') ? 'bg-green-100 text-green-800' :
                                                        prop.opportunity_label.includes('Uygun') ? 'bg-blue-50 text-blue-700' :
                                                            prop.opportunity_label.includes('pahalı') || prop.opportunity_label.includes('Yüksek') ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {prop.opportunity_label}
                                                {prop.deviation > 0 && ` (%${prop.deviation})`}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {prop.neighborhood}, {prop.district}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="font-medium text-gray-700">{prop.rooms} • {prop.size_m2} m²</div>
                                            <div className="text-[10px] text-gray-500 flex flex-wrap gap-1">
                                                {prop.building_age && <span>{prop.building_age} Yıl</span>}
                                                {prop.heating_type && <span>• {prop.heating_type}</span>}
                                                {prop.floor_location && <span>• {prop.floor_location}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {prop.roi ? (
                                            <div className="flex flex-col">
                                                <span className="font-bold text-green-600">
                                                    {prop.roi.estimatedMonthlyRent.toLocaleString('tr-TR')} TL <span className="text-xs font-normal text-gray-500">/ay</span>
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Amort: {prop.roi.amortizationYears} Yıl
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                to={`/property/${prop.id}`}
                                                className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded inline-flex items-center gap-1"
                                            >
                                                <Eye size={14} /> Detay
                                            </Link>
                                            <a
                                                href={prop.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded inline-flex items-center gap-1"
                                            >
                                                <ExternalLink size={14} /> Site
                                            </a>
                                            <button
                                                onClick={() => handleGenerateStory(prop.id)}
                                                className="text-white bg-pink-600 hover:bg-pink-700 px-3 py-1 rounded inline-flex items-center gap-1"
                                                title="Instagram Görseli Oluştur"
                                            >
                                                <Instagram size={14} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/property-listing/${prop.id}`)}
                                                className="text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded inline-flex items-center gap-1"
                                                title="İlan Sayfası Oluştur"
                                            >
                                                <FileText size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                    Bu filtreleme kriterlerine uygun ilan bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div >

            {/* Pagination Controls (Bottom) */}
            {
                totalPages > 1 && (
                    <div className="bg-gray-50 border-t px-4 py-3 flex items-center justify-between sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Önceki
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Sonraki
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Toplam <span className="font-medium">{properties.length}</span> ilandan <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, properties.length)}</span> arası gösteriliyor
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Önceki</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>

                                    {/* Page Numbers - Simplified for now to just show current/total text or limited range */}
                                    <div className="flex items-center px-4 border-t border-b border-gray-300 bg-white text-sm">
                                        {currentPage} / {totalPages}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Sonraki</span>
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PropertyTable;
