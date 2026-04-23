import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Html, Cylinder, Sphere } from '@react-three/drei';
import { DownloadCloud, ArrowLeft, ShieldCheck, ShieldAlert, Shield, Box } from 'lucide-react';
import client from '../api/client';
import Breadcrumb from '../components/Breadcrumb';

// ── Colour by risk level ──────────────────────────────────────────────────────
function getRiskInfo(score) {
    if (score <= 3) return { color: '#ef4444', label: 'High Risk', icon: ShieldAlert, range: 'text-red-500', bg: 'bg-red-500/20' };
    if (score <= 6) return { color: '#f59e0b', label: 'Moderate', icon: Shield, range: 'text-amber-500', bg: 'bg-amber-500/20' };
    return { color: '#10b981', label: 'Safe', icon: ShieldCheck, range: 'text-emerald-500', bg: 'bg-emerald-500/20' };
}

// ── Download summary as .txt ──────────────────────────────────────────────────
function downloadTxt(summary, plotId) {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buyplot_risk_report_plot${plotId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Safety Scorecard Component ──────────────────────────────────────────────────
function SafetyScorecard({ score }) {
    const risk = getRiskInfo(score);
    const Icon = risk.icon;
    const percentage = (score / 10) * 100;
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/8 flex flex-col items-center relative overflow-hidden">
            {/* Background Glow */}
            <div 
                className={`absolute inset-0 opacity-10 blur-2xl rounded-full ${risk.bg}`} 
                style={{ transform: 'scale(1.5)' }} 
            />
            
            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">Safety Score</h3>
            
            <div className="relative flex items-center justify-center">
                {/* Background Ring */}
                <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className="stroke-slate-800/50"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Progress Ring */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke={risk.color}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out drop-shadow-lg"
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 8px ${risk.color})` }}
                    />
                </svg>
                
                {/* Center Content */}
                <div className="absolute flex flex-col items-center">
                    <span className={`text-4xl font-black ${risk.range}`}>{score.toFixed(1)}</span>
                    <span className="text-slate-500 text-[10px] font-bold">/ 10</span>
                </div>
            </div>

            <div className={`mt-6 flex items-center gap-2 font-bold tracking-tight ${risk.range}`}>
                <Icon className="w-5 h-5" />
                <span>{risk.label.toUpperCase()}</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PlotViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [plotData, setPlotData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        client.get(`/generate-mesh/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => { setPlotData(res.data); setLoading(false); })
            .catch(err => {
                console.error('[PlotViewer] Fetch error:', err);
                if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
                    setError('Error: Backend Offline. Please check your connection.');
                } else if (err.response?.status === 401) { 
                    navigate('/login'); return; 
                } else if (err.response?.status === 404) {
                    setError(`Plot #${id} was not found in the database.`);
                } else {
                    setError(err.response?.data?.detail || 'Failed to load plot data.');
                }
                setLoading(false);
            });
    }, [id, navigate]);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) return (
        <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-400 font-inter gap-4">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <div className="text-lg font-medium tracking-wide">Synthesizing Terrain...</div>
            </div>
        </div>
    );

    // ── Error state ───────────────────────────────────────────────────────────
    if (error) return (
        <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-red-400 font-inter gap-4">
            <ShieldAlert className="w-16 h-16 opacity-80" />
            <div className="text-lg">{error}</div>
            <button
                onClick={() => navigate(-1)}
                className="mt-4 px-6 py-2 rounded-lg bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-white/5 flex items-center gap-2"
            >
                <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
        </div>
    );

    const w = plotData.metadata.side_units || 5;
    const d = plotData.metadata.side_units || 5;
    const riskInfo = getRiskInfo(parseFloat(plotData.metadata.risk_score || 10));

    return (
        <div className="w-screen h-screen bg-slate-950 relative overflow-hidden font-inter text-white">
            
            {/* ── Immersive Full-Screen 3D Canvas ── */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows>
                    <PerspectiveCamera makeDefault position={[w * 1.5, w * 1.2, d * 1.5]} fov={45} />
                    <ambientLight intensity={0.4} color="#fff5e0" />
                    <directionalLight 
                        position={[10, 20, 5]} 
                        intensity={2.0} 
                        color="#fffaf0"
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-far={100}
                    />
                    <hemisphereLight skyColor="#87ceeb" groundColor="#8B6914" intensity={0.5} />

                    <Environment preset="forest" />

                    {/* Outer Ground (Beyond plot) */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                        <planeGeometry args={[200, 200]} />
                        <meshStandardMaterial color="#020617" roughness={1} />
                    </mesh>

                    {/* Scale grid */}
                    <Grid args={[40, 40]} cellColor="#1e293b" sectionColor="#0f172a" fadeDistance={50} position={[0, 0.01, 0]} />

                    {/* ── The Plot ── */}
                    <group position={[0, 0.05, 0]}>
                        {/* 1. Ground texture instead of flat colour */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                            <planeGeometry args={[w, d]} />
                            <meshStandardMaterial color="#8B6914" roughness={0.95} metalness={0.0} />
                        </mesh>
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                            <planeGeometry args={[w, d]} />
                            <meshStandardMaterial color="#4a7c3f" opacity={0.6} transparent roughness={1.0} />
                        </mesh>

                        {/* 2. Compound wall border around the plot */}
                        {/* Front Wall */}
                        <mesh position={[0, 0.3, -d/2]} castShadow receiveShadow>
                            <boxGeometry args={[w, 0.6, 0.15]} />
                            <meshStandardMaterial color="#d4c5a9" roughness={0.9} />
                        </mesh>
                        {/* Back Wall */}
                        <mesh position={[0, 0.3, d/2]} castShadow receiveShadow>
                            <boxGeometry args={[w, 0.6, 0.15]} />
                            <meshStandardMaterial color="#d4c5a9" roughness={0.9} />
                        </mesh>
                        {/* Left Wall */}
                        <mesh position={[-w/2, 0.3, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.15, 0.6, d]} />
                            <meshStandardMaterial color="#d4c5a9" roughness={0.9} />
                        </mesh>
                        {/* Right Wall */}
                        <mesh position={[w/2, 0.3, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.15, 0.6, d]} />
                            <meshStandardMaterial color="#d4c5a9" roughness={0.9} />
                        </mesh>

                        {/* 3. Coconut trees at the corners offset inward by 0.3 */}
                        {[
                            [-w/2 + 0.3, -d/2 + 0.3],
                            [w/2 - 0.3, -d/2 + 0.3],
                            [-w/2 + 0.3, d/2 - 0.3],
                            [w/2 - 0.3, d/2 - 0.3]
                        ].map(([x, z], i) => (
                            <group key={i}>
                                <Cylinder args={[0.05, 0.08, 1.8, 8]} position={[x, 0.9, z]} castShadow>
                                    <meshStandardMaterial color="#7c5c2e" roughness={1} />
                                </Cylinder>
                                <Sphere args={[0.4, 8, 8]} position={[x, 1.9, z]} scale={[1, 0.6, 1]} castShadow>
                                    <meshStandardMaterial color="#2d6a2d" roughness={1} />
                                </Sphere>
                            </group>
                        ))}

                        {/* 4. Safety zone marker in the centre */}
                        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
                            <circleGeometry args={[0.8, 32]} />
                            <meshStandardMaterial color={riskInfo.color} opacity={0.7} transparent />
                        </mesh>
                    </group>

                    {/* 6. Floating Label Upgrade */}
                    <Html position={[0, 2.5, 0]} center distanceFactor={12}>
                        <div style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{plotData.metadata.name}</div>
                            <div style={{ color: riskInfo.color, fontWeight: 600, fontSize: 12 }}>{parseFloat(plotData.metadata.risk_score || 10).toFixed(1)} / 10</div>
                            <div style={{ color: '#94a3b8', fontSize: 10 }}>{plotData.metadata.area}</div>
                        </div>
                    </Html>

                    {/* Auto-rotating Camera */}
                    <OrbitControls makeDefault enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.5} minDistance={1} maxDistance={100} />
                </Canvas>
            </div>

            {/* ── Glassmorphic Sidebar ── */}
            <div className="absolute top-0 left-0 w-80 h-full z-10 bg-slate-900/60 backdrop-blur-xl border-r border-white/8 p-6 flex flex-col justify-between shadow-2xl">
                
                {/* Top Section */}
                <div className="flex flex-col h-full overflow-hidden">
                    <Breadcrumb 
                      items={[
                        { label: 'Dashboard', href: '/marketplace' },
                        { label: `Plot #${id}` }
                      ]} 
                    />

                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="text-slate-500 hover:text-white mb-4 flex items-center gap-2 transition-colors w-fit group text-[10px] font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            Back to Gallery
                        </button>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                            Plot Overview
                        </h1>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
                        {/* Details Card */}
                        <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5 space-y-4">
                            <div>
                                <h2 className="text-white font-bold text-sm mb-1">{plotData.metadata.name}</h2>
                                <p className="text-slate-500 text-xs">{plotData.metadata.location}</p>
                            </div>
                            <div className="h-px w-full bg-white/5" />
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Dimensions</span>
                                <span className="text-slate-300 font-semibold">{plotData.metadata.area}</span>
                            </div>
                            <div className="h-px w-full bg-white/5" />
                            <div className="text-xs">
                                <span className="block text-slate-500 font-bold uppercase tracking-[0.1em] text-[9px] mb-2">Analysis Summary</span>
                                <p className="text-slate-300 leading-relaxed">
                                    {plotData.summary || 'Awaiting detailed terrain scan results...'}
                                </p>
                            </div>
                        </div>

                        {/* Glowing Safety Scorecard */}
                        <SafetyScorecard score={parseFloat(plotData.metadata.risk_score || 10)} />
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 mt-auto space-y-3">
                    <button
                        onClick={() => navigate(`/design/${id}`)}
                        className="w-full bg-white hover:bg-slate-200 text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl shadow-white/5"
                    >
                        <Box className="w-4 h-4" />
                        Open Design Studio →
                    </button>

                    <button
                        onClick={() => downloadTxt(plotData.summary || 'No summary available.', id)}
                        className="w-full relative group overflow-hidden rounded-2xl bg-slate-800/50 hover:bg-slate-800 transition-all border border-white/5 p-3"
                    >
                        <div className="relative flex justify-center items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">
                            <DownloadCloud className="w-3.5 h-3.5" />
                            Download Report
                        </div>
                    </button>
                </div>
            </div>

            {/* ── Corner Hint ── */}
            <div className="absolute bottom-6 right-6 z-10 text-[9px] font-bold uppercase tracking-widest text-slate-600 pointer-events-none select-none flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-full backdrop-blur-xl border border-white/5">
                <span>🖱</span> Drag to orbit • Scroll to zoom
            </div>
            
        </div>
    );
}