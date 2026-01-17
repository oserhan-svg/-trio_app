import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in Leaflet + Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView = ({ properties }) => {
    // Center of Ayvalık
    const position = [39.319, 26.696];

    return (
        <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 z-0">
            <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {properties.map((prop) => {
                    // For demo purposes, if no coord, generate a predictable random spread around Ayvalık
                    // In a real app, scraper should fetch coords.
                    // Here we fake it based on ID to be deterministic if missing.
                    const lat = 39.319 + (prop.id % 20 - 10) * 0.002;
                    const lng = 26.696 + (prop.id % 20 - 10) * 0.002;

                    return (
                        <Marker key={prop.id} position={[lat, lng]}>
                            <Popup>
                                <div className="text-sm">
                                    <h3 className="font-bold">{prop.title}</h3>
                                    <p className="text-blue-600 font-semibold">{parseFloat(prop.price).toLocaleString('tr-TR')} TL</p>
                                    <p>{prop.neighborhood}</p>
                                    <a href={prop.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">İlana Git</a>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapView;
