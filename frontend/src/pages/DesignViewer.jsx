import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AIGenerator from '../components/AIGenerator';
import { ArrowLeft, Loader2, Search, Save, Trash2, Box, Home, Plus, Edit3, ShieldAlert } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import RiskAnalysisCard from '../components/RiskAnalysisCard';

const API = '/api';

import { RAW_CATALOG } from '../data/catalog';

const DEFAULT_HOUSE_SCALE = [1, 1, 1];
const DEFAULT_PART_SCALE = [1, 1, 1];

export default function DesignViewer() {
    const [interactionMode, setInteractionMode] = useState('translate');
    const { id } = useParams();
    const navigate = useNavigate();

    const [plotData, setPlotData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('Houses');
    const [searchTerm, setSearchTerm] = useState('');
    const [sceneObjects, setSceneObjects] = useState([]);
    const [selectedHouse, setSelectedHouse] = useState(null);
    const [selectedPlotData, setSelectedPlotData] = useState(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, z: 0, scale: 1, rotation: 0 });

    useEffect(() => {
        // --- YOUR DATA FETCHING LOGIC ---
        const fetchPlotData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                let rawData = null;
                try {
                    const { data } = await axios.get(`${API}/plots/${id}`, { headers });
                    rawData = data;
                } catch (apiErr) {
                    // Fallback to localStorage for admin-added plots
                    const saved = localStorage.getItem('admin_plots');
                    if (saved) {
                        const localPlots = JSON.parse(saved);
                        const found = localPlots.find(p => String(p.id) === String(id));
                        if (found) {
                            rawData = found;
                        } else {
                            throw apiErr;
                        }
                    } else {
                        throw apiErr;
                    }
                }

                if (rawData) {
                    // Normalize data (handle both backend snake_case and local camelCase)
                    const parsedRiskScore = (() => {
                        const rawRisk = rawData.risk_score || rawData.riskScore || '';
                        const match = String(rawRisk).match(/Score:\s*([\d.]+)/);
                        return match ? parseFloat(match[1]) : undefined;
                    })();

                    const normalized = {
                        ...rawData,
                        safety_score: rawData.safety_score ?? rawData.safetyScore ?? parsedRiskScore ?? (rawData.riskLevel === 'High' ? 2.5 : rawData.riskLevel === 'Moderate' ? 5.5 : 0),
                        risk_level: rawData.risk_level ?? rawData.riskLevel ?? 'Unknown',
                        description: rawData.description ?? rawData.desc ?? 'Geospatial risk assessment verified.'
                    };
                    setPlotData(normalized);
                    setSelectedPlotData(normalized);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    navigate('/login');
                } else {
                    setError('Failed to fetch plot data. Please check if the plot exists.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPlotData();

        // --- NEW USER-FRIENDLY KEYBOARD SHORTCUTS ---
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 't') setInteractionMode('translate'); // T for Translate (Move)
            if (key === 'r') setInteractionMode('rotate');    // R for Rotate
            if (key === 's') setInteractionMode('scale');     // S for Scale
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [id, navigate]); // Dependencies remain the same

    const handleDeleteObject = () => {
        if (!selectedHouse || !selectedHouse.instanceId) return;
        setSceneObjects(prev => prev.filter(obj => obj.instanceId !== selectedHouse.instanceId));
        setSelectedHouse(null);
    };

    const handleClearAll = () => {
        setSceneObjects([]);
        setSelectedHouse(null);
    };

    const handleSave = async () => {
        try {
            await axios.patch(`${API}/plots/${id}`, {
                house_x: transform.x,
                house_z: transform.z,
                house_layout: selectedHouse?.id,
            });
            console.log('Placement saved successfully!');
        } catch (err) {
            console.error('Failed to sync design', err);
        }
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-400 gap-4">
                <Loader2 className="animate-spin w-10 h-10 text-emerald-500" />
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Loading Plot Setup...</p>
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 gap-4">
                <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
                <button
                    onClick={() => navigate('/marketplace')}
                    className="mt-4 bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 transition"
                >
                    Back to Gallery
                </button>
            </div>
        );
    }

    // ── No data guard ──
    if (!plotData) {
        return (
            <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-400 gap-4">
                <p className="text-sm font-bold uppercase tracking-widest">Plot not found.</p>
            </div>
        );
    }

    const baseItems = activeTab === 'Plots'
        ? (RAW_CATALOG?.plots || [])
        : activeTab === 'Houses'
            ? (RAW_CATALOG?.houses || [])
            : (RAW_CATALOG?.parts || []);

    const catalogItems = baseItems.filter(item =>
        (item?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    // ── Main UI ──
    return (
        <div className="h-screen bg-[#0a0c10] text-slate-200 p-6 flex flex-col overflow-hidden">
            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-6 shrink-0">
                <div className="flex flex-col gap-4">
                    <Breadcrumb
                        items={[
                            { label: 'Dashboard', href: '/marketplace' },
                            { label: `Plot #${id} Studio` },
                        ]}
                    />
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors group text-[10px] font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            Back to Gallery
                        </button>
                        <div>
                            <h1 className="text-4xl font-extrabold text-white tracking-tight">Design Studio</h1>
                            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-semibold opacity-50">
                                Antigravity AI View · Plot #{plotData?.id || id}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Workspace ── */}
            <div className="flex-1 flex flex-row overflow-hidden rounded-[32px] border border-white/5 bg-[#0f1116] shadow-2xl">

                {/* Viewport */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#0a0c10]">
                    {/* AIGenerator provides its own HUD, removed duplicate static badge */}
                    <AIGenerator
                        plotId={plotData.id}
                        selectedPlot={selectedPlotData}
                        modelUrl={plotData?.glb_url}
                        plotImage={plotData.thumbnail_url || 'https://images.unsplash.com/photo-1524813686514-a57563d77965'}
                        sceneObjects={sceneObjects}
                        interactionMode={interactionMode}
                        selectedObjectId={selectedHouse?.instanceId}
                        onSelectObject={(object) => setSelectedHouse(object)}
                        onUpdateObject={(instanceId, newPosition, newRotation, newScale) => {
                            setSceneObjects(prev => prev.map(obj => {
                                if (obj.instanceId !== instanceId) {
                                    return obj;
                                }

                                const updatedObject = { ...obj, position: newPosition, rotation: newRotation, scale: newScale };
                                if (selectedHouse?.instanceId === instanceId) {
                                    setSelectedHouse(updatedObject);
                                }
                                return updatedObject;
                            }));
                        }}
                    />
                </div>

                {/* Sidebar */}
                <div className="w-[340px] shrink-0 bg-[#1a1d23] border-l border-white/10 flex flex-col h-full overflow-hidden shadow-2xl">

                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/5 bg-[#111318]">
                        {['Safety', 'Houses', 'Parts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${activeTab === tab
                                    ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {tab === 'Safety' ? '🛡️' : tab === 'Houses' ? '🏠' : '📦'} {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tools */}
                    <div className="p-5 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                        {/* Tab-specific content */}
                        {activeTab === 'Safety' ? (
                            <div className="space-y-6 pb-20">
                                <RiskAnalysisCard 
                                    safetyScore={plotData?.safety_score || 0}
                                    riskLevel={plotData?.risk_level}
                                    description={plotData?.description}
                                />
                                
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">KSDMA Analysis Data</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                        "{plotData?.description || 'All geospatial parameters verified against the latest KSDMA hazard reports.'}"
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Search Bar */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab.toLowerCase()}...`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-[#0f1116] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    />
                                </div>

                                {/* Transform Controls */}
                        <div className="flex bg-[#0f1116] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                            {['translate', 'rotate', 'scale'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setInteractionMode(mode)}
                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${interactionMode === mode ? 'bg-[#00a3ff] text-white' : 'text-slate-500'
                                        }`}
                                >
                                    {mode === 'translate' ? 'Move' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>

                                {/* Asset Grid */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-4">
                                        {activeTab === 'Houses' ? 'Pre-Model Houses' : 'Structural Parts'}
                                        <span className="h-px flex-1 bg-white/5" />
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                {catalogItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            const modelUrl = item.modelUrl || item.glb_url;
                                            console.log("Loading path:", modelUrl);
                                            const newObject = {
                                                ...item,
                                                instanceId: Date.now(),
                                                modelUrl: item.modelUrl || item.glb_url,
                                                position: [6, -1, 0],
                                                // Rotation values in three.js are radians.
                                                // Convert the intended -200deg default orientation.
                                                rotation: [0, (150 * Math.PI) / -50, 0],
                                                scale: item.type === 'part' ? DEFAULT_PART_SCALE : DEFAULT_HOUSE_SCALE
                                            };
                                            setSelectedHouse(newObject);
                                            if (item.type === 'plot') {
                                                setSelectedPlotData(item);
                                            }
                                            setSceneObjects(prev => [...prev, newObject]);
                                        }}
                                        className="group cursor-pointer"
                                    >
                                        <div
                                            className={`aspect-square bg-[#242933] rounded-3xl border transition-all p-2 relative overflow-hidden flex items-center justify-center ${selectedHouse?.id === item.id
                                                ? 'border-emerald-500 ring-4 ring-emerald-500/10'
                                                : 'border-white/5'
                                                }`}
                                        >
                                            <div className="absolute top-2 right-2 bg-black/40 text-emerald-400 text-[7px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-black">
                                                ✔ SAFE
                                            </div>
                                            <img
                                                src={item.thumbnail}
                                                alt={item.name}
                                                className="w-[85%] object-contain group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold mt-3 text-center uppercase truncate">
                                            {item.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Object Controls */}
                        <div className="flex gap-2 mb-4">
                            {selectedHouse && (
                                <button
                                    onClick={handleDeleteObject}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                                >
                                    Delete Active
                                </button>
                            )}
                            {sceneObjects.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    Confirm &amp; Save Design
                                </button>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-[#111318] border-t border-white/5 text-center">
                        <p className="text-[9px] text-slate-600 font-black tracking-widest uppercase">
                            [T] Move · [R] Rotate · [S] Scale
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}