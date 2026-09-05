import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Info, ChevronRight } from 'lucide-react';

const RiskAnalysisCard = ({ safetyScore, riskLevel, description }) => {
    // Determine colors based on score
    const isSafe = safetyScore >= 7.0;
    const isModerate = safetyScore >= 4.0 && safetyScore < 7.0;
    const color = isSafe ? '#10b981' : isModerate ? '#f59e0b' : '#ef4444';
    const bgLight = isSafe ? 'rgba(16, 185, 129, 0.1)' : isModerate ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    // Synthetic data for the breakdown (simulated KSDMA parameters)
    const parameters = [
        { label: 'Flood Risk', value: safetyScore > 8 ? 'Minimal' : safetyScore > 5 ? 'Moderate' : 'High', status: safetyScore > 5 ? 'safe' : 'risk' },
        { label: 'Soil Stability', value: safetyScore > 7 ? 'High' : 'Medium', status: 'safe' },
        { label: 'Legal Status', value: 'Verified', status: 'safe' },
        { label: 'Connectivity', value: 'Excellent', status: 'safe' }
    ];

    return (
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden group">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Risk Analysis</h3>
                <div 
                    className="px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest"
                    style={{ color, backgroundColor: bgLight, borderColor: `${color}33` }}
                >
                    {riskLevel || (isSafe ? 'Safe' : isModerate ? 'Moderate' : 'High')}
                </div>
            </div>

            {/* Score Display */}
            <div className="flex items-baseline gap-3 mb-8">
                <span className="text-5xl font-black text-white tracking-tighter">
                    {safetyScore?.toFixed(1) || '0.0'}
                </span>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Safety Score</span>
                    <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full transition-all duration-1000 ease-out"
                            style={{ width: `${(safetyScore || 0) * 10}%`, backgroundColor: color }}
                        />
                    </div>
                </div>
            </div>

            {/* Parameter Breakdown */}
            <div className="space-y-4 mb-8">
                {parameters.map((param, i) => (
                    <div key={i} className="flex justify-between items-center group/item">
                        <span className="text-xs text-slate-400 font-medium">{param.label}</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${param.status === 'safe' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {param.value}
                            </span>
                            <CheckCircle2 className={`w-3.5 h-3.5 ${param.status === 'safe' ? 'text-emerald-500' : 'text-red-500 opacity-20'}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Button */}
            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] group/btn">
                <Info className="w-4 h-4 text-slate-400 group-hover/btn:text-white" />
                <span className="text-[10px] font-black text-slate-300 group-hover/btn:text-white uppercase tracking-widest">View Detailed Report</span>
            </button>

            {/* Tooltip/Detail on hover */}
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                    "{description || 'Geospatial risk assessment complete. Property matches KSDMA safety protocols.'}"
                </p>
            </div>
        </div>
    );
};

export default RiskAnalysisCard;
