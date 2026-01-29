import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Layers, Info, Navigation, ArrowLeft, Loader } from 'lucide-react';
import api from '../../services/api';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapInsight = ({ onBack }) => {
    const [properties, setProperties] = useState([]);
    const [neighborhoodStats, setNeighborhoodStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('pins'); // 'pins' or 'heatmap'

    // Ayvalık center coordinates
    const center = [39.3193, 26.6939];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [propRes, statsRes] = await Promise.all([
                api.get('/properties?status=active'),
                api.get('/analytics/neighborhood-stats')
            ]);

            // For demo/prototype, we'll assign random coordinates if property lacks them
            // In a real app, we'd geocode neighborhood names
            const geocodedNeighbors = {
                'Mithatpaşa Mah.': [39.3333, 26.6500],
                'Namık Kemal Mah.': [39.3340, 26.6550],
                'Hayrettinpaşa Mah.': [39.3150, 26.7000],
                'Sefa Mah.': [39.3250, 26.6850],
                'Zekibey Mah.': [39.3190, 26.6950],
                'Küçükköy Mah.': [39.2900, 26.6700],
                'Altınova Mah.': [39.2150, 26.7700],
                'Armutçuk': [39.3300, 26.6900],
                'Fethiye Mah.': [39.3220, 26.6920]
            };

            const processedProps = (propRes.data.properties || []).map(p => {
                const coords = geocodedNeighbors[p.neighborhood] || [
                    center[0] + (Math.random() - 0.5) * 0.05,
                    center[1] + (Math.random() - 0.5) * 0.05
                ];
                return { ...p, coords };
            });

            setProperties(processedProps);

            // Process stats for heatmap
            const statsWithCoords = (statsRes.data || []).map(s => ({
                ...s,
                coords: geocodedNeighbors[s.neighborhood] || center
            }));
            setNeighborhoodStats(statsWithCoords);

        } catch (error) {
            console.error("Map data fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    const getHeatColor = (avgPrice) => {
        if (avgPrice > 15000000) return "#ef4444"; // Red (Premium)
        if (avgPrice > 8000000) return "#f59e0b"; // Orange (Mid)
        return "#10b981"; // Green (Value)
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <button onClick={onBack} className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl text-slate-700 hover:bg-white transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="bg-white/90 backdrop-blur px-5 py-3 rounded-2xl shadow-xl border border-white">
                        <h2 className="font-black text-slate-800 flex items-center gap-2">
                            <MapIcon size={18} className="text-blue-600" />
                            Ayvalık Pazar Radar
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => setViewMode('pins')}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all ${viewMode === 'pins' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
                    >
                        Portföy İğneleri
                    </button>
                    <button
                        onClick={() => setViewMode('heatmap')}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all ${viewMode === 'heatmap' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600'}`}
                    >
                        Fiyat Isı Haritası
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="animate-spin text-blue-600" size={40} />
                        <span className="font-bold text-slate-400">Harita verileri hazırlanıyor...</span>
                    </div>
                </div>
            ) : (
                <div className="flex-1 rounded-3xl overflow-hidden m-2 shadow-inner border border-slate-200">
                    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {viewMode === 'pins' && properties.map(p => (
                            <Marker key={p.id} position={p.coords}>
                                <Popup>
                                    <div className="p-1 min-w-[200px]">
                                        <div className="font-black text-slate-800 mb-1">{p.title}</div>
                                        <div className="text-blue-600 font-black text-lg mb-2">{parseFloat(p.price).toLocaleString()} ₺</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-3">{p.neighborhood} / {p.rooms}</div>
                                        <a href={p.url} target="_blank" rel="noreferrer" className="block w-full text-center py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors">
                                            İlanı İncele
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {viewMode === 'heatmap' && neighborhoodStats.map((stat, idx) => (
                            <Circle
                                key={idx}
                                center={stat.coords}
                                radius={800}
                                pathOptions={{
                                    fillColor: getHeatColor(stat.avgPrice),
                                    color: getHeatColor(stat.avgPrice),
                                    fillOpacity: 0.6
                                }}
                            >
                                <Popup>
                                    <div className="p-1">
                                        <div className="font-black text-slate-500 text-[10px] uppercase mb-1">{stat.neighborhood}</div>
                                        <div className="text-slate-800 font-bold mb-2">Ortalama Fiyat:</div>
                                        <div className="text-xl font-black text-slate-900">{Math.round(stat.avgPrice).toLocaleString()} ₺</div>
                                        <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                                            Bu bölgede {stat.count} aktif ilan bulunuyor.
                                        </div>
                                    </div>
                                </Popup>
                            </Circle>
                        ))}
                    </MapContainer>
                </div>
            )}

            {/* Legend Overlay */}
            <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white">
                <div className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Info size={14} /> Fiyat İndeksi
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                        <span className="text-[11px] font-bold text-slate-600">Fırsat / Uygun ( &lt; 8M ₺)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-200"></div>
                        <span className="text-[11px] font-bold text-slate-600">Piyasa Ortalaması (8M - 15M ₺)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>
                        <span className="text-[11px] font-bold text-slate-600">Premium / Lüks ( &gt; 15M ₺)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapInsight;
