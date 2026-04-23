import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AIGenerator from '../components/AIGenerator';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const API = '/api';

const RAW_CATALOG = {
    houses: [
        {
            id: 'h1',
            name: 'Modern Kerala Villa',
            thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=300&q=80',
            modelUrl: '/models/houses/part_house1.glb',
            format: 'glb'
        },
        {
            id: 'modern-villa',
            name: 'Modern Villa',
            thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
            glb_url: '/models/houses/part_house2.glb',
            format: 'glb'
        },
        {
            id: 'eco-lodge',
            name: 'Eco Lodge',
            thumbnail: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=300&q=80',
            glb_url: '/models/houses/part_house3.glb',
            format: 'glb'
        }
    ],
    parts: [
        { 
            id: 'part_barricade_doorway_a', 
            name: 'Barricade Doorway A', 
            thumbnail: 'https://images.unsplash.com/photo-1598440939527-810a9f0dff56?auto=format&fit=crop&w=300&q=80',
            glb_url: '/models/parts/Barricade/part_barricade_doorway_a.fbx', 
            type: 'part', 
            format: 'fbx' 
        },
        { 
            id: 'part_border', 
            name: 'Border', 
            thumbnail: 'https://images.unsplash.com/photo-1590069230002-df267a0bb8d3?auto=format&fit=crop&w=300&q=80',
            glb_url: '/models/parts/Border/part_border.fbx', 
            type: 'part', 
            format: 'fbx' 
        },
        { 
            id: 'part_column', 
            name: 'Column', 
            thumbnail: 'https://images.unsplash.com/photo-1590069230002-df267a0bb8d3?auto=format&fit=crop&w=300&q=80',
            glb_url: '/models/parts/Column/part_column.fbx', 
            type: 'part', 
            format: 'fbx' 
        },
        { 
            id: 'part_plating', 
            name: 'Plating', 
            thumbnail: 'https://images.unsplash.com/photo-1632759162353-19c9a540feb7?auto=format&fit=crop&w=300&q=80',
            glb_url: '/models/parts/Corrugated Iron Sheet/part_plating.fbx', 
            type: 'part', 
            format: 'fbx' 
        },
        { 
            id: 'part_floor', 
            name: 'Floor', 
            thumbnail: 'https://images.unsplash.com/photo-1632759162353-19c9a540feb7?auto=format&fit=crop&w=300&q=80',
            glb_url: '/models/parts/Floor/part_floor.fbx', 
            type: 'part', 
            format: 'fbx' 
        }
    ],
};

export default function DesignViewer() {
    const [interactionMode, setInteractionMode] = useState('translate');
    const { id } = useParams();
    const navigate = useNavigate();

    const [plotData, setPlotData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('Base');
    const [sceneObjects, setSceneObjects] = useState([]);
    const [selectedHouse, setSelectedHouse] = useState(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, z: 0, scale: 1, rotation: 0 });

    useEffect(() => {
        // --- YOUR DATA FETCHING LOGIC ---
        const fetchPlotData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const { data } = await axios.get(`${API}/plots/${id}`, { headers });
                setPlotData(data);
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

    const catalogItems = activeTab === 'Base'
        ? (RAW_CATALOG?.houses ?? [])
        : (RAW_CATALOG?.parts ?? []);

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
                                Antigravity AI View · Plot #{plotData.id}
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
                        modelUrl={plotData?.glb_url}
                        plotImage={plotData.thumbnail_url || 'https://images.unsplash.com/photo-1524813686514-a57563d77965'}
                        sceneObjects={sceneObjects}
                        interactionMode={interactionMode}
                        onUpdateObject={(instanceId, newPosition, newRotation, newScale) => {
                            setSceneObjects(prev => prev.map(obj =>
                                obj.instanceId === instanceId
                                    ? { ...obj, position: newPosition, rotation: newRotation, scale: newScale }
                                    : obj
                            ));
                        }}
                    />
                </div>

                {/* Sidebar */}
                <div className="w-[340px] shrink-0 bg-[#1a1d23] border-l border-white/10 flex flex-col h-full overflow-hidden shadow-2xl">

                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/5 bg-[#111318]">
                        {['Base', 'Parts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${activeTab === tab
                                    ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {tab === 'Base' ? '🏠' : '📦'} {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tools */}
                    <div className="p-5 space-y-6 flex-1 overflow-y-auto">

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
                                {activeTab === 'Base' ? 'Pre-Model Houses' : 'Structural Parts'}
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
                                                position: item.type === 'part' ? [0, 0.01, 0] : [0, -1, 0],
                                                rotation: [0, 0, 0],
                                                scale: item.type === 'part' ? [0.5, 0.5, 0.5] : [0.1, 0.1, 0.1]
                                            };
                                            setSelectedHouse(newObject);
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

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                            Confirm &amp; Save Design
                        </button>
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