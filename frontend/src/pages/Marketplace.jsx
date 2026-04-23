import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, Box, X, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Stage, useGLTF, Environment, OrbitControls } from '@react-three/drei';
import { KeralaHouse } from '../components/KeralaHouse';
import PlotCard from '../components/PlotCard';

const Marketplace = () => {
    const [user, setUser] = useState(null);
    const [plots, setPlots] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [show3DModal, setShow3DModal] = useState(false);
    const [glbUrl, setGlbUrl] = useState(null);
    const [selectedPlotPlan, setSelectedPlotPlan] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Auth Check using local token
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Decode simple payload (email)
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ email: payload.sub });
        } catch (e) {
            console.error("Token decode error", e);
            navigate('/login');
            return;
        }

        // Fetch Plots from Backend
        const fetchPlots = async () => {
            try {
                const response = await fetch('/api/plots', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch plots from server");

                const data = await response.json();
                if (data.status === 'success') {
                    setPlots(data.plots);
                }
            } catch (error) {
                console.error("Error fetching plots:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlots();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const filteredPlots = plots.filter(plot =>
        plot.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plot.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const PlotModel = ({ url }) => {
        const { scene } = useGLTF(url);
        return <primitive object={scene} />;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">BuyPlot Safe</h1>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <span className="text-slate-500 text-xs hidden md:block">Active: {user?.email}</span>
                        <button
                            onClick={() => navigate('/add-plot')}
                            className="bg-white hover:bg-slate-200 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            Sell Property
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">

                {/* Header & Search */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                    <div className="space-y-2">
                        <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Available Listings</span>
                        <h2 className="text-4xl font-extrabold text-white tracking-tight">Find Your Safe Plot</h2>
                        <p className="text-slate-500 max-w-md">Browse verified properties with real-time landslide risk assessments for Kerala.</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search location or plot name..."
                            className="w-full bg-slate-900/50 border border-white/10 text-white py-3.5 pl-11 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-600 transition-all backdrop-blur-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
                        <p className="text-slate-500 text-sm animate-pulse">Scanning terrain data...</p>
                    </div>
                )}

                {/* Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlots.length > 0 ? (
                            filteredPlots.map((plot) => (
                                <PlotCard key={plot.id} plot={plot} />
                            ))
                        ) : (
                            <div className="col-span-full bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-20 text-center">
                                <PlusCircle className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-slate-300 mb-2">No Plots Found</h3>
                                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Upload your first plot to start assessing risks and designing your future home.</p>
                                <button 
                                    onClick={() => navigate('/add-plot')}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                                >
                                    Upload Your First Plot
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* --- 3D Preview Modal --- (Keep existing logic but styled consistently) */}
            {show3DModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 text-white">
                            <div>
                                <h3 className="font-extrabold flex items-center gap-2">
                                    <Box className="text-emerald-500" />
                                    {selectedPlotPlan?.name || '3D Preview'}
                                </h3>
                                <p className="text-xs text-slate-500">{selectedPlotPlan?.location}</p>
                            </div>
                            <button onClick={() => setShow3DModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="h-[550px] relative bg-[#020617]">
                            <Canvas camera={{ position: [25, 25, 25], fov: 40 }}>
                                <ambientLight intensity={0.6} />
                                <pointLight position={[15, 15, 15]} intensity={1.2} />
                                <Environment preset="city" />
                                <Stage environment="city" intensity={0.5} contactShadow={false}>
                                    {glbUrl && <PlotModel url={glbUrl} />}
                                    <KeralaHouse position={[0, 0.51, 0]} scale={[0.8, 0.8, 0.8]} />
                                </Stage>
                                <OrbitControls autoRotate autoRotateSpeed={0.5} />
                            </Canvas>

                            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                <div className="bg-slate-950/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 text-xs text-slate-500">
                                    <p className="font-bold text-slate-300 mb-1.5 uppercase tracking-widest">Terrain Preview</p>
                                    <p>• Boundary: {selectedPlotPlan?.area}</p>
                                    <p>• Elevation height matches risk level</p>
                                </div>
                                <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-[10px] font-black border border-emerald-500/20 backdrop-blur-md uppercase tracking-widest">
                                    Real-Time Mesh Generation
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketplace;
