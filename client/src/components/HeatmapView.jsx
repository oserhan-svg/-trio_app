import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const center = [39.3190, 26.6970]; // Ayvalik Center

const HeatmapView = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/analytics');
                if (res.data && res.data.marketStats) {
                    setData(res.data.marketStats);
                }
            } catch (err) {
                console.error("Heatmap load failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-10 text-center">Harita Yükleniyor...</div>;

    return (
        <div className="h-[600px] w-full bg-white rounded-lg shadow-md overflow-hidden border">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {data.map((neighborhood, idx) => {
                    if (!neighborhood.lat) return null;

                    // Color logic: Green (Cheap) -> Red (Expensive)
                    // Ayvalik Avg base ~30,000 TL
                    const price = neighborhood.avgPricePerM2;
                    let color = '#3b82f6'; // Blue default
                    if (price < 35000) color = '#22c55e'; // Green
                    else if (price < 45000) color = '#eab308'; // Yellow
                    else if (price < 55000) color = '#f97316'; // Orange
                    else color = '#ef4444'; // Red

                    // Size relative to count of listings (min size 200m)
                    const radius = 200 + (neighborhood.count * 30);

                    return (
                        <Circle
                            key={idx}
                            center={[neighborhood.lat, neighborhood.lng]}
                            pathOptions={{ fillColor: color, color: color, fillOpacity: 0.5 }}
                            radius={radius}
                        >
                            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                                <div className="text-center font-bold text-xs">
                                    {neighborhood.neighborhood.replace(' Mah.', '')}
                                    <div className="font-normal">
                                        {Math.round(price).toLocaleString()} TL/m²
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                        ({neighborhood.count} İlan)
                                    </div>
                                </div>
                            </Tooltip>
                            <Popup>
                                <strong>{neighborhood.neighborhood}</strong><br />
                                Ort. Fiyat: {Math.round(price).toLocaleString()} TL/m²<br />
                                İlan Sayısı: {neighborhood.count}
                            </Popup>
                        </Circle>
                    );
                })}
            </MapContainer>
            <div className="p-2 bg-gray-50 flex gap-4 text-xs justify-center border-t">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Ucuz (&lt;35k)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Normal (35k-45k)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Yüksek (45k-55k)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Pahalı (&gt;55k)</div>
            </div>
        </div>
    );
};

export default HeatmapView;
