import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Info } from 'lucide-react';

const RISK_DATA = [
  {
    id: "plot_1",
    name: "Wayanad Plot",
    score: 8.5,
    status: "Safe",
    riskLevel: "Low",
    color: "#10b981",
    factors: [
      { label: "Flood Risk", value: "Minimal", status: "good" },
      { label: "Soil Stability", value: "High", status: "good" },
      { label: "Legal Status", value: "Verified", status: "good" },
      { label: "Connectivity", value: "Excellent", status: "good" }
    ]
  },
  {
    id: "plot_2",
    name: "Standard Plot",
    score: 5.2,
    status: "Caution",
    riskLevel: "Medium",
    color: "#f59e0b",
    factors: [
      { label: "Flood Risk", value: "Moderate", status: "warning" },
      { label: "Soil Stability", value: "Medium", status: "warning" },
      { label: "Legal Status", value: "Pending", status: "warning" },
      { label: "Connectivity", value: "Good", status: "good" }
    ]
  },
  {
    id: "plot_3",
    name: "Corner Plot",
    score: 2.8,
    status: "High Risk",
    riskLevel: "Critical",
    color: "#ef4444",
    factors: [
      { label: "Flood Risk", value: "High", status: "danger" },
      { label: "Soil Stability", value: "Unstable", status: "danger" },
      { label: "Legal Status", value: "Disputed", status: "danger" },
      { label: "Connectivity", value: "Limited", status: "warning" }
    ]
  }
];

export default function RiskAnalysisOverlay({ plotId }) {
  // Step 3: Risk Lookup logic - handles both "1" and "plot_1" formats
  const plotRisk = RISK_DATA.find(item => {
    const idA = String(item.id).replace('plot_', '');
    const idB = String(plotId).replace('plot_', '');
    return idA === idB;
  });

  if (!plotRisk) return null;

  return (
    <div className="absolute top-6 right-6 w-64 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-right-8 duration-700 font-inter pointer-events-auto z-[50]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Risk Analysis</h3>
        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border`} 
             style={{ borderColor: `${plotRisk.color}40`, color: plotRisk.color, backgroundColor: `${plotRisk.color}10` }}>
          {plotRisk.status}
        </div>
      </div>

      <div className="flex items-end gap-2 mb-4">
        <span className="text-2xl font-black text-white tracking-tighter leading-none">{plotRisk.score}</span>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">Safety Score</span>
          <div className="w-16 h-0.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000" 
                 style={{ width: `${plotRisk.score * 10}%`, backgroundColor: plotRisk.color }} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {plotRisk.factors.map((factor, idx) => (
          <div key={idx} className="flex items-center justify-between group">
            <span className="text-[10px] font-medium text-slate-400">{factor.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${
                factor.status === 'good' ? 'text-emerald-400' : 
                factor.status === 'warning' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {factor.value}
              </span>
              {factor.status === 'good' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : 
               factor.status === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : 
               <ShieldAlert className="w-3 h-3 text-red-500" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group">
          <Info className="w-3 h-3 text-slate-400 group-hover:text-white" />
          <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">View Detailed Report</span>
        </button>
      </div>
    </div>
  );
}
