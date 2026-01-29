import React, { useState } from 'react';
import { X, GitCompare, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

const PropertyComparison = ({ properties, onClose }) => {
    const [selectedProps, setSelectedProps] = useState(properties.slice(0, 3));

    const compareFeatures = () => {
        if (selectedProps.length === 0) return [];

        const allFeatures = new Set();
        selectedProps.forEach(p => {
            (p.features || []).forEach(f => allFeatures.add(f));
        });

        return Array.from(allFeatures);
    };

    const getPriceComparison = () => {
        if (selectedProps.length === 0) return null;
        const prices = selectedProps.map(p => parseFloat(p.price));
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        return { avgPrice, minPrice, maxPrice };
    };

    const priceComp = getPriceComparison();
    const features = compareFeatures();

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <GitCompare size={24} />
                        <h2 className="text-2xl font-black">İlan Karşılaştırma</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Price Summary */}
                {priceComp && (
                    <div className="bg-gray-50 border-b border-gray-200 p-4">
                        <div className="flex justify-around">
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">En Düşük</div>
                                <div className="text-lg font-bold text-emerald-600">
                                    {(priceComp.minPrice / 1000).toFixed(0)}K ₺
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Ortalama</div>
                                <div className="text-lg font-bold text-blue-600">
                                    {(priceComp.avgPrice / 1000).toFixed(0)}K ₺
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">En Yüksek</div>
                                <div className="text-lg font-bold text-orange-600">
                                    {(priceComp.maxPrice / 1000).toFixed(0)}K ₺
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Comparison Table */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedProps.length}, 1fr)` }}>
                        {selectedProps.map((prop, idx) => (
                            <div key={prop.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                                {/* Property Image */}
                                <div className="h-48 bg-gray-100 relative">
                                    {prop.images && prop.images[0] ? (
                                        <img
                                            src={prop.images[0]}
                                            alt={prop.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold">
                                        #{idx + 1}
                                    </div>
                                </div>

                                {/* Property Details */}
                                <div className="p-4 space-y-3">
                                    <h3 className="font-bold text-sm text-gray-800 line-clamp-2 h-10">
                                        {prop.title}
                                    </h3>

                                    <div className="space-y-2">
                                        <CompareRow label="Fiyat" value={
                                            <span className="text-lg font-black text-blue-600">
                                                {(prop.price / 1000).toFixed(0)}K ₺
                                            </span>
                                        } />
                                        <CompareRow label="Konum" value={`${prop.district} / ${prop.neighborhood}`} />
                                        <CompareRow label="Oda" value={prop.rooms || '-'} />
                                        <CompareRow label="M²" value={prop.size_m2 ? `${prop.size_m2} m²` : '-'} />
                                        <CompareRow label="Bina Yaşı" value={prop.building_age || '-'} />
                                        <CompareRow label="Kat" value={prop.floor_location || '-'} />
                                    </div>

                                    {/* Price per M² */}
                                    {prop.size_m2 && (
                                        <div className="pt-2 border-t border-gray-100">
                                            <CompareRow
                                                label="M² Fiyatı"
                                                value={
                                                    <span className="font-bold text-purple-600">
                                                        {(prop.price / prop.size_m2).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                                    </span>
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Feature Comparison */}
                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Özellik Karşılaştırması</h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 text-gray-600 font-medium">Özellik</th>
                                        {selectedProps.map((prop, idx) => (
                                            <th key={idx} className="text-center py-2 text-gray-600 font-medium">
                                                #{idx + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {features.map((feature, idx) => (
                                        <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{feature}</td>
                                            {selectedProps.map((prop, pIdx) => (
                                                <td key={pIdx} className="text-center py-2">
                                                    {(prop.features || []).includes(feature) ? (
                                                        <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                        Kapat
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                        Yazdır
                    </button>
                </div>
            </div>
        </div>
    );
};

const CompareRow = ({ label, value }) => (
    <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}:</span>
        <span className="font-medium text-gray-800">{value}</span>
    </div>
);

export default PropertyComparison;
