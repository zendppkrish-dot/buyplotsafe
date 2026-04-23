import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Image as ImageIcon, Calendar, HardDrive, User } from 'lucide-react';

const PlotGallery = () => {
    const navigate = useNavigate();
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);

    const fetchPlots = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('[GALLERY] Fetching plots from API...');
            const response = await fetch('/api/plots?limit=50');

            if (!response.ok) {
                throw new Error(`Failed to fetch plots: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[GALLERY] Received plots:', data);

            setPlots(data.plots || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('[GALLERY] Error fetching plots:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlots();
    }, []);

    const formatDate = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return isoString;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Plot Gallery</h1>
                            <p className="text-slate-400 mt-1">
                                {total > 0 ? `${total} uploaded plot${total !== 1 ? 's' : ''}` : 'No plots yet'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchPlots}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 text-lg">Loading plots...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-8 text-center">
                        <p className="text-red-400 mb-4">Failed to load plots: {error}</p>
                        <button
                            onClick={fetchPlots}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && plots.length === 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                        <ImageIcon className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-300 mb-2">No Plots Yet</h2>
                        <p className="text-slate-400 mb-6">Upload your first plot to get started!</p>
                        <button
                            onClick={() => navigate('/add-plot')}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-semibold"
                        >
                            Add Your First Plot
                        </button>
                    </div>
                )}

                {/* Gallery Grid */}
                {!loading && !error && plots.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {plots.map((plot) => (
                            <div
                                key={plot.id}
                                className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-slate-900 overflow-hidden">
                                    <img
                                        src={plot.image_url}
                                        alt={plot.original_name}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                </div>

                                {/* Details */}
                                <div className="p-4 space-y-3">
                                    {/* Filename */}
                                    <div className="flex items-start gap-2">
                                        <ImageIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-white font-medium truncate" title={plot.original_name}>
                                            {plot.original_name}
                                        </p>
                                    </div>

                                    {/* Upload Date */}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                        <p className="text-xs text-slate-400">
                                            {formatDate(plot.upload_date)}
                                        </p>
                                    </div>

                                    {/* File Size */}
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                        <p className="text-xs text-slate-400">
                                            {formatFileSize(plot.file_size)}
                                        </p>
                                    </div>

                                    {/* User Email */}
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                        <p className="text-xs text-slate-400 truncate" title={plot.user_email}>
                                            {plot.user_email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlotGallery;
