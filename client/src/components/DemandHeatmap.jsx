import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { Users, Info } from 'lucide-react';

const center = [39.3190, 26.6970]; // Ayvalik Center

const DemandHeatmap = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDemandData = async () => {
            try {
                const res = await api.get('/analytics/demand-heatmap');
                setData(res.data);
            } catch (err) {
                console.error("Demand heatmap load failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDemandData();
    }, []);

    if (loading) return (
        <div className="h-[400px] w-full bg-gray-50 animate-pulse flex items-center justify-center rounded-xl border">
            <div className="text-gray-400 text-sm font-medium">Talep Isı Haritası Yükleniyor...</div>
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <Users size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight">Müşteri Talep Yoğunluğu</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Ayvalık Geneli Sıcak Bölgeler</p>
                    </div>
                </div>
            </div>

            <div className="h-[450px] w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 relative">
                <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />

                    {data.map((point, idx) => {
                        if (!point.lat) return null;

                        // Color logic: Higher concentration -> Hotter color (Purple/Red)
                        const count = point.count;
                        let color = '#3b82f6'; // Blue (Low)
                        if (count >= 10) color = '#ef4444'; // Red (High)
                        else if (count >= 5) color = '#f97316'; // Orange (Medium)
                        else if (count >= 2) color = '#8b5cf6'; // Purple (Active)

                        // Size relative to count (min size 300m)
                        const radius = 300 + (count * 100);

                        return (
                            <Circle
                                key={idx}
                                center={[point.lat, point.lng]}
                                pathOptions={{ fillColor: color, color: color, fillOpacity: 0.4, weight: 2 }}
                                radius={radius}
                            >
                                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                    <div className="text-center font-bold text-xs p-1">
                                        {point.neighborhood}
                                        <div className="font-normal text-blue-600">
                                            {count} Aktif Talep
                                        </div>
                                    </div>
                                </Tooltip>
                                <Popup>
                                    <div className="text-sm">
                                        <strong className="text-gray-900">{point.neighborhood}</strong>
                                        <div className="mt-1 flex flex-col gap-0.5 text-gray-600">
                                            <span>👥 Talep Sayısı: <strong>{count}</strong></span>
                                            {point.avgMaxPrice && (
                                                <span>💰 Beklenti: <strong>~{Math.round(point.avgMaxPrice / 1000)}k ₺</strong></span>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Circle>
                        );
                    })}
                </MapContainer>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-lg text-[10px] space-y-2">
                    <div className="font-bold text-gray-700 border-b border-gray-100 pb-1 mb-1">YOĞUNLUK</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Çok Yüksek (10+)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f97316]"></div> Yüksek (5-10)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div> Orta (2-5)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Düşük (1)</div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                <Info size={16} className="text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bu harita, mevcut müşterilerinizin hangi bölgelerle ilgilendiğini gösterir. Kırmızı bölgelerdeki ilanlar en hızlı "eşleşme" ve "satış" potansiyeline sahiptir.
                </p>
            </div>
        </div>
    );
};

export default DemandHeatmap;
