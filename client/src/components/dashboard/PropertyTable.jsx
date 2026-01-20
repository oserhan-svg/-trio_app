import React from 'react';
import { ExternalLink, Eye, ArrowUp, ArrowDown } from 'lucide-react';

const PropertyTable = ({ properties, onViewDetail }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Başlık</th>
                            <th className="px-6 py-4">Fiyat</th>
                            <th className="px-6 py-4">m²</th>
                            <th className="px-6 py-4">Oda</th>
                            <th className="px-6 py-4">Mahalle</th>
                            <th className="px-6 py-4">Durum</th>
                            <th className="px-6 py-4">Kaynak</th>
                            <th className="px-6 py-4">İlan Tarihi</th>
                            <th className="px-6 py-4 text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {properties.map((prop) => {
                            const isRemoved = prop.status === 'removed';
                            const isSold = prop.status === 'sold';

                            let source = 'Diğer';
                            let sourceClass = 'bg-gray-100 text-gray-800';

                            if (prop.url?.includes('hepsiemlak')) {
                                source = 'Hepsiemlak';
                                sourceClass = 'bg-red-100 text-red-800';
                            } else if (prop.url?.includes('sahibinden')) {
                                source = 'Sahibinden';
                                sourceClass = 'bg-yellow-100 text-yellow-800';
                            } else if (prop.url?.includes('emlakjet')) {
                                source = 'Emlakjet';
                                sourceClass = 'bg-blue-100 text-blue-800';
                            }

                            return (
                                <tr key={prop.id} className={`hover:bg-gray-50 transition-colors ${isRemoved ? 'opacity-50 bg-gray-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={prop.title}>
                                            <div className={`font-semibold ${isRemoved ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{prop.title?.split('#')[0].trim()}</div>
                                            {prop.seller_name && (
                                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                    <span className="truncate">{prop.seller_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 font-bold whitespace-nowrap ${isRemoved ? 'text-gray-400' : 'text-emerald-600'}`}>
                                        ₺{parseFloat(prop.price).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">{prop.size_m2 ? `${prop.size_m2} m²` : '-'}</td>
                                    <td className="px-6 py-4">{prop.rooms || '-'}</td>
                                    <td className="px-6 py-4">{prop.neighborhood || '-'}</td>
                                    <td className="px-6 py-4">
                                        {isRemoved ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                                Kaldırıldı
                                            </span>
                                        ) : isSold ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                Satıldı
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                Aktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${sourceClass}`}>
                                            {source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {prop.listing_date ? new Date(prop.listing_date).toLocaleDateString('tr-TR') : '-'}
                                    </td>
                                    <td className="px-6 py-4 flex justify-center gap-2">
                                        <button
                                            onClick={() => onViewDetail(prop)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Detay"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <a
                                            href={prop.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="İlanı Aç"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    </td>
                                </tr>
                            );
                        })}
                        {properties.length === 0 && (
                            <tr>
                                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                    Henüz veri bulunmuyor. Scraper'ı çalıştırın veya filtreleri genişletin.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PropertyTable;
