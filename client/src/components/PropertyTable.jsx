import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, FileSpreadsheet, Instagram, Eye, ChevronLeft, ChevronRight, FileText, TrendingDown } from 'lucide-react';
import api from '../services/api';

const PropertyTable = ({ properties }) => {
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

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-700">
                    İlan Listesi <span className="text-sm font-normal text-gray-500">({properties.length} ilan)</span>
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

            <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200" id="property-table-top">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İlan Başlığı</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konum</th>
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
                                        <div className="text-sm font-medium text-gray-900 line-clamp-1" title={prop.title}>{prop.title}</div>
                                        <div className="text-xs text-gray-500">{prop.external_id}</div>
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
                                        {prop.rooms} • {prop.size_m2} m²
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
            </div>

            {/* Pagination Controls (Bottom) */}
            {totalPages > 1 && (
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
            )}
        </div>
    );
};

export default PropertyTable;
