import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    Map as MapIcon, 
    Library, 
    ShieldAlert, 
    ShieldCheck, 
    Edit3, 
    TrendingUp, 
    AlertTriangle,
    Eye,
    X,
    ChevronRight,
    Save,
    Trash2,
    PlusCircle
} from 'lucide-react';
import { RAW_CATALOG } from '../data/catalog';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    
    // Auth Check
    React.useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            navigate('/admin-login');
        }
    }, [navigate]);

    // Initialize from localStorage or fallback to RAW_CATALOG
    const [localPlots, setLocalPlots] = useState(() => {
        const saved = localStorage.getItem('admin_plots');
        return saved ? JSON.parse(saved) : RAW_CATALOG.plots;
    });

    const [backendPlots, setBackendPlots] = useState([]);
    const [activeTab, setActiveTab] = useState('Manage Plots');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlot, setEditingPlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editSafetyScore, setEditSafetyScore] = useState(8.5);

    // Fetch Backend Plots on mount
    React.useEffect(() => {
        const fetchBackendPlots = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/plots', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setBackendPlots(data.plots);
                }
            } catch (err) {
                console.error("Failed to fetch backend plots", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBackendPlots();
    }, []);

    const plots = [...backendPlots, ...localPlots];

    // Form state for new plot
    const [newPlot, setNewPlot] = useState({
        name: '',
        price: '',
        location: '',
        lat: 10.5276,
        lng: 76.2144,
        riskLevel: 'Low',
        area: '10 Cents',
        glb_url: '/models/plots/plot1.glb'
    });

    // Save localPlots to localStorage whenever they change
    React.useEffect(() => {
        // Path Migration: Automatically fix old plot_1.glb style paths to plot1.glb
        const migratedPlots = localPlots.map(p => {
            if (p.glb_url && p.glb_url.includes('plot_')) {
                return { ...p, glb_url: p.glb_url.replace('plot_', 'plot') };
            }
            return p;
        });

        if (JSON.stringify(migratedPlots) !== JSON.stringify(localPlots)) {
            setLocalPlots(migratedPlots);
            return;
        }

        localStorage.setItem('admin_plots', JSON.stringify(localPlots));
        // Dispatch custom event for immediate sync across tabs
        window.dispatchEvent(new Event('admin_plots_updated'));
    }, [localPlots]);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/marketplace');
    };

    const handleAddPlot = (e) => {
        e.preventDefault();
        const id = `plot_${Date.now()}`;
        const plotToAdd = {
            ...newPlot,
            id,
            image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
            thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
            thumbnail_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
            type: 'plot',
            format: 'glb'
        };
        setLocalPlots([...localPlots, plotToAdd]);
        setNewPlot({
            name: '',
            price: '',
            location: '',
            lat: 10.5276,
            lng: 76.2144,
            riskLevel: 'Low',
            area: '10 Cents',
            glb_url: '/models/plots/plot1.glb'
        });
    };

    const handleDelete = async (id, isBackend) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            if (isBackend) {
                try {
                    const response = await fetch(`/api/plots/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        setBackendPlots(prev => prev.filter(p => String(p.id) !== String(id)));
                        // Sync with Marketplace
                        window.dispatchEvent(new Event('admin_plots_updated'));
                    }
                } catch (err) {
                    alert("Failed to delete from server.");
                }
            } else {
                setLocalPlots(localPlots.filter(p => p.id !== id));
            }
        }
    };

    // Stats calculation
    const stats = {
        totalListings: plots.length,
        highRiskZones: plots.filter(p => p.riskLevel === 'High').length,
        safeZones: plots.filter(p => p.riskLevel === 'Low').length
    };

    const handleEdit = (plot) => {
        const initialScore =
            (typeof plot.safety_score === 'number' && Number.isFinite(plot.safety_score))
                ? plot.safety_score
                : (typeof plot.safetyScore === 'number' && Number.isFinite(plot.safetyScore))
                    ? plot.safetyScore
                    : (plot.risk_score && String(plot.risk_score).match(/Score:\s*([\d.]+)/))
                        ? parseFloat(String(plot.risk_score).match(/Score:\s*([\d.]+)/)?.[1] || '0')
                        : 8.5;

        setEditSafetyScore(initialScore);
        setEditingPlot({ ...plot });
        setIsEditModalOpen(true);
    };

    const riskLabelFromScore = (score) => {
        if (score <= 3.5) return 'High Risk';
        if (score <= 7.0) return 'Moderate Risk';
        return 'Safe';
    };

    const handleSave = async () => {
        const isBackend = !String(editingPlot.id).includes('plot_');
        const nextRiskLevel = riskLabelFromScore(editSafetyScore);

        if (isBackend) {
            try {
                const response = await fetch(`/api/plots/${editingPlot.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        price: editingPlot.price,
                        safety_score: editSafetyScore,
                        risk_level: nextRiskLevel,
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data?.detail || 'Failed to update plot');

                const updatedPlot = data.plot;
                setBackendPlots(prev => prev.map(p => String(p.id) === String(updatedPlot.id) ? updatedPlot : p));
            } catch (err) {
                alert(err.message || 'Failed to save changes');
                return;
            }
        } else {
            const updated = {
                ...editingPlot,
                riskLevel: nextRiskLevel === 'Safe' ? 'Low' : nextRiskLevel === 'Moderate Risk' ? 'Moderate' : 'High',
                safety_score: editSafetyScore,
                safetyScore: editSafetyScore,
            };
            setLocalPlots(prev => prev.map(p => p.id === updated.id ? updated : p));
        }

        setIsEditModalOpen(false);
    };

    const toggleRiskFlag = (id, flagType) => {
        setPlots(plots.map(p => {
            if (p.id === id) {
                // Simplified logic: toggling a risk factor sets risk to High
                const newLevel = p.riskLevel === 'High' ? 'Low' : 'High';
                return { ...p, riskLevel: newLevel };
            }
            return p;
        }));
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black tracking-tighter text-xl text-white">ADMIN PANEL</span>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    {[
                        { name: 'Manage Plots', icon: LayoutDashboard },
                        { name: 'Risk Reports', icon: ShieldAlert },
                        { name: 'Asset Library', icon: Library }
                    ].map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === item.name 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button 
                        onClick={handleLogout}
                        className="text-xs text-slate-500 hover:text-white font-bold uppercase tracking-widest"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{activeTab}</h1>
                        <p className="text-slate-500 text-sm mt-1">Operational oversight of BuyPlot Safe inventory.</p>
                    </div>
                    <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 text-xs font-bold text-slate-400">
                        Last sync: Just now
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                        { label: 'Total Listings', value: stats.totalListings, icon: TrendingUp, color: 'emerald' },
                        { label: 'High Risk Zones', value: stats.highRiskZones, icon: AlertTriangle, color: 'red' },
                        { label: 'Safe Zones', value: stats.safeZones, icon: ShieldCheck, color: 'blue' }
                    ].map((card) => (
                        <div key={card.label} className="bg-slate-900 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10 blur-2xl rounded-full bg-${card.color}-500 transition-all group-hover:scale-150`} />
                            <div className="flex justify-between items-start relative">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                                    <p className="text-3xl font-black text-white">{card.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-${card.color}-500/10 text-${card.color}-500 border border-${card.color}-500/20`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Add New Plot Section */}
                {activeTab === 'Manage Plots' && (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 mb-10 shadow-2xl">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                            <PlusCircle className="text-emerald-500 w-5 h-5" />
                            Add New Marketplace Listing
                        </h2>
                        <form onSubmit={handleAddPlot} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plot Name</label>
                                <input 
                                    type="text" required value={newPlot.name}
                                    onChange={(e) => setNewPlot({...newPlot, name: e.target.value})}
                                    placeholder="e.g. Hilltop Haven"
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price</label>
                                <input 
                                    type="text" required value={newPlot.price}
                                    onChange={(e) => setNewPlot({...newPlot, price: e.target.value})}
                                    placeholder="e.g. ₹50L"
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</label>
                                <input 
                                    type="text" required value={newPlot.location}
                                    onChange={(e) => setNewPlot({...newPlot, location: e.target.value})}
                                    placeholder="e.g. Munnar, Kerala"
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</label>
                                <select 
                                    value={newPlot.riskLevel}
                                    onChange={(e) => setNewPlot({...newPlot, riskLevel: e.target.value})}
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latitude</label>
                                <input 
                                    type="number" step="any" required value={newPlot.lat}
                                    onChange={(e) => setNewPlot({...newPlot, lat: parseFloat(e.target.value)})}
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Longitude</label>
                                <input 
                                    type="number" step="any" required value={newPlot.lng}
                                    onChange={(e) => setNewPlot({...newPlot, lng: parseFloat(e.target.value)})}
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Model Path (.glb)</label>
                                <input 
                                    type="text" required value={newPlot.glb_url}
                                    onChange={(e) => setNewPlot({...newPlot, glb_url: e.target.value})}
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                            </div>
                            <div className="flex items-end">
                                <button 
                                    type="submit"
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    Add Listing
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/2 border-b border-white/5">
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Property Details</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Price</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location (Lat/Lng)</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {plots.map((plot) => (
                                <tr
                                    key={plot.id}
                                    className="hover:bg-white/2 transition-colors group cursor-pointer"
                                    onClick={() => handleEdit(plot)}
                                >
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <img src={plot.thumbnail || plot.image} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt="" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-white text-sm">{plot.name}</p>
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                                                        !String(plot.id).includes('plot_') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                    }`}>
                                                        {!String(plot.id).includes('plot_') ? 'Live' : 'Local'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{plot.area}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 font-bold text-emerald-400 text-sm">{plot.price}</td>
                                    <td className="p-5 text-xs text-slate-400 font-mono">
                                        {(plot.lat || plot.latitude)?.toFixed(4)}, {(plot.lng || plot.longitude)?.toFixed(4)}
                                    </td>
                                    <td className="p-5">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                                            (plot.riskLevel === 'High' || (plot.risk_score && parseFloat(plot.risk_score) <= 3)) ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}>
                                            {plot.riskLevel || (parseFloat(plot.risk_score) <= 3 ? 'High' : 'Low')}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleEdit(plot)}
                                                className="p-2 bg-white/5 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-white/5"
                                                title="Edit Details"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(plot.id, !String(plot.id).includes('plot_'))}
                                                className="p-2 bg-white/5 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-white/5"
                                                title="Delete Listing"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => toggleRiskFlag(plot.id, 'flood')}
                                                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                    plot.riskLevel === 'High' 
                                                    ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' 
                                                    : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'
                                                }`}
                                            >
                                                Flood Prone
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Edit Modal */}
            {isEditModalOpen && editingPlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Edit Plot Details</h2>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Property: {editingPlot.id}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price</label>
                                    <input 
                                        type="text" 
                                        value={editingPlot.price} 
                                        onChange={(e) => setEditingPlot({...editingPlot, price: e.target.value})}
                                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</label>
                                    <div className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold">
                                        {riskLabelFromScore(editSafetyScore)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-end justify-between">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Safety Score</label>
                                    <div className="text-sm font-black text-white">{Number(editSafetyScore).toFixed(1)} / 10</div>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="0.1"
                                    value={editSafetyScore}
                                    onChange={(e) => setEditSafetyScore(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                                <div className="text-[10px] text-slate-500">
                                    Slide to adjust safety score. This overrides geospatial auto-scoring for this plot.
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white/2 border-t border-white/5 flex gap-4">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all border border-white/5"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .bg-emerald-500\\/10 { background-color: rgba(16, 185, 129, 0.1); }
                .text-emerald-500 { color: #10b981; }
                .border-emerald-500\\/20 { border-color: rgba(16, 185, 129, 0.2); }
                .bg-red-500\\/10 { background-color: rgba(239, 68, 68, 0.1); }
                .text-red-500 { color: #ef4444; }
                .border-red-500\\/20 { border-color: rgba(239, 68, 68, 0.2); }
                .bg-blue-500\\/10 { background-color: rgba(59, 130, 246, 0.1); }
                .text-blue-500 { color: #3b82f6; }
                .border-blue-500\\/20 { border-color: rgba(59, 130, 246, 0.2); }
                .bg-white\\/2 { background-color: rgba(255, 255, 255, 0.02); }
            `}} />
        </div>
    );
};

export default AdminDashboard;
