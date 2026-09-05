import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { LayoutGrid, Map as MapIcon, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import PlotCard from './PlotCard';

const HomeMapSearch = ({ plots, loading }) => {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
    const navigate = useNavigate();

    // Default center for Kerala
    const center = [10.5276, 76.2144];

    // Helper to determine risk info
    const getRiskInfo = (plot) => {
        if (plot.riskLevel) {
            const colors = { High: '#ef4444', Moderate: '#f59e0b', Low: '#10b981' };
            return { color: colors[plot.riskLevel], label: plot.riskLevel, level: plot.riskLevel };
        }
        const score = Number.isFinite(plot.safety_score)
            ? plot.safety_score
            : parseFloat(String(plot.risk_score || 0).match(/Score:\s*([\d.]+)/)?.[1] || '0');
        if (score <= 3) return { color: '#ef4444', label: 'High', level: 'High' };
        if (score <= 6) return { color: '#f59e0b', label: 'Moderate', level: 'Moderate' };
        return { color: '#10b981', label: 'Low', level: 'Low' };
    };

    return (
        <div className="w-full">
            {/* View Toggle */}
            <div className="flex justify-end mb-6">
                <div className="bg-slate-900/50 backdrop-blur-md p-1 rounded-2xl border border-white/5 flex gap-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'grid' 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Grid View
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'map' 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <MapIcon className="w-4 h-4" />
                        Map View
                    </button>
                </div>
            </div>

            {/* Results Area */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plots.map((plot) => (
                        <PlotCard key={plot.id} plot={plot} />
                    ))}
                </div>
            ) : (
                <div className="h-[600px] w-full rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative">
                    <MapContainer 
                        center={center} 
                        zoom={7} 
                        style={{ height: '100%', width: '100%', background: '#020617' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        
                        {plots.map((plot) => {
                            // Use coordinates if available (handle both backend and admin formats)
                            const lat = plot.latitude || plot.lat;
                            const lng = plot.longitude || plot.lng;

                            const pos = (lat && lng) 
                                ? [lat, lng] 
                                : [
                                    center[0] + (Math.random() - 0.5) * 2, 
                                    center[1] + (Math.random() - 0.5) * 2
                                  ];
                            
                            const risk = getRiskInfo(plot);

                            return (
                                <CircleMarker
                                    key={plot.id}
                                    center={pos}
                                    radius={12}
                                    pathOptions={{
                                        fillColor: risk.color,
                                        color: 'white',
                                        weight: 2,
                                        fillOpacity: 0.8,
                                    }}
                                >
                                    <Popup minWidth={240} className="custom-popup">
                                        <div className="p-1 font-inter">
                                            <div className="relative h-32 mb-3 rounded-xl overflow-hidden">
                                                <img 
                                                    src={plot.image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'} 
                                                    alt={plot.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                                                    {risk.level === 'High' ? (
                                                        <ShieldAlert className="w-3 h-3 text-red-500" />
                                                    ) : (
                                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                                    )}
                                                    <span className="text-[10px] font-bold text-white uppercase">{risk.level} Risk</span>
                                                </div>
                                            </div>
                                            
                                            <div className="px-1">
                                                <h4 className="font-bold text-slate-900 text-sm mb-0.5">{plot.name || 'Unnamed Plot'}</h4>
                                                <p className="text-emerald-600 font-bold text-xs mb-3">{plot.price}</p>
                                                
                                                <button
                                                    onClick={() => navigate(`/design/${plot.id}`)}
                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                                                >
                                                    View in 3D <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>

                    {/* Leaflet Custom Styles to match app theme */}
                    <style dangerouslySetInnerHTML={{ __html: `
                        .leaflet-container { font-family: inherit; }
                        .leaflet-popup-content-wrapper { 
                            background: white; 
                            border-radius: 20px; 
                            padding: 0;
                            overflow: hidden;
                        }
                        .leaflet-popup-content { margin: 8px; }
                        .leaflet-popup-tip { background: white; }
                        .leaflet-tile { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
                    `}} />
                </div>
            )}
        </div>
    );
};

export default HomeMapSearch;
