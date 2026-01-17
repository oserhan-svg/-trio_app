import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, Ruler, Layout, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const PropertyDetailModal = ({ property, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (property?.id) {
            fetchHistory();
        }
    }, [property]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            // Note: Endpoint uses internal ID, make sure property.id is the internal one
            const response = await axios.get(`http://localhost:5000/api/properties/${property.id}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const formattedData = response.data.map(item => ({
                ...item,
                date: new Date(item.changed_at).toLocaleDateString('tr-TR'),
                price: parseFloat(item.price)
            }));

            setHistory(formattedData);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!property) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{property.title}</h2>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <MapPin size={14} /> {property.district} / {property.neighborhood}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Details */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fiyat</span>
                            <div className="flex items-center gap-2 mt-1 text-emerald-600 font-bold text-2xl">
                                <DollarSign size={20} />
                                ₺{parseFloat(property.price).toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Ruler size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Metrekare</p>
                                    <p className="font-medium">{property.size_m2 || '-'} m²</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Layout size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Oda Sayısı</p>
                                    <p className="font-medium">{property.rooms || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Tabloya Eklenme Tarihi</p>
                                    <p className="font-medium">{new Date(property.created_at).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>
                        </div>

                        <a
                            href={property.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-3 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                        >
                            {property.url?.includes('hepsiemlak') ? "Hepsiemlak'ta Gör" :
                                property.url?.includes('sahibinden') ? "Sahibinden.com'da Gör" :
                                    "İlana Git"}
                        </a>
                    </div>

                    {/* Right Column: Chart & Logs */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Chart */}
                        <div className="h-64 bg-white rounded-xl border border-gray-100 p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Fiyat Geçmişi</h3>
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-gray-400">Yükleniyor...</div>
                            ) : history.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₺${val / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(val) => [`₺${val.toLocaleString()}`, 'Fiyat']}
                                        />
                                        <Line type="monotone" dataKey="price" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">Geçmiş verisi yok.</div>
                            )}
                        </div>

                        {/* Change Log Table */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Değişiklik Kaydı</h3>
                            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Tarih</th>
                                            <th className="px-4 py-2">Fiyat</th>
                                            <th className="px-4 py-2">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map((log, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-gray-600">{log.date}</td>
                                                <td className="px-4 py-2 font-medium text-gray-900">₺{log.price.toLocaleString()}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.change_type === 'price_increase' ? 'bg-red-50 text-red-600' :
                                                        log.change_type === 'price_decrease' ? 'bg-green-50 text-green-600' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {log.change_type === 'price_increase' ? 'Artış' :
                                                            log.change_type === 'price_decrease' ? 'Düşüş' : 'İlk Kayıt'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && !loading && (
                                            <tr><td colSpan="3" className="text-center py-4 text-gray-400">Kayıt yok.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailModal;
