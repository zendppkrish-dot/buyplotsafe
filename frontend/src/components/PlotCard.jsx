import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Box } from 'lucide-react';

const PlotCard = ({ plot }) => {
  const navigate = useNavigate();
  
  // Handle both backend risk_score string and admin riskLevel string
  let score = plot.safety_score || parseFloat(plot.risk_score || 0);
  let riskColor = '#10b981'; // Default green
  let riskLabel = plot.risk_level || 'Safe';

  if (plot.riskLevel) {
    riskLabel = plot.riskLevel;
    if (riskLabel === 'High') {
        riskColor = '#ef4444';
        score = 2.0;
    } else if (riskLabel === 'Moderate') {
        riskColor = '#f59e0b';
        score = 5.0;
    } else {
        riskColor = '#10b981';
        score = 9.0;
    }
  } else {
    // Scoring rules: <= 3.5 (red), 3.6-7.0 (amber), 7.1-10 (green)
    if (score <= 3.5) {
      riskColor = '#ef4444';
      riskLabel = 'High Risk';
    } else if (score <= 7.0) {
      riskColor = '#f59e0b';
      riskLabel = 'Moderate';
    }
  }
  
  const handleView = () => {
    navigate(`/design/${plot.id}`);
  };

  return (
    <div 
      className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer"
      style={{
        boxShadow: `0 0 20px -5px ${riskColor}00`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 10px 30px -10px ${riskColor}66`;
        e.currentTarget.style.borderColor = `${riskColor}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 20px -5px ${riskColor}00`;
        e.currentTarget.style.borderColor = `rgba(255,255,255,0.05)`;
      }}
      onClick={handleView}
    >
      {/* Image Area */}
      <div className="relative h-48 bg-slate-800 overflow-hidden">
        <img
          src={plot.image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'}
          alt={plot.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Risk Indicator Bottom Border */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 z-10"
          style={{ backgroundColor: riskColor, boxShadow: `0 0 10px ${riskColor}` }}
        />

        {/* Safety Badge */}
        <div 
          className="absolute top-3 right-3 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border text-[10px] font-bold"
          style={{ color: riskColor, backgroundColor: `${riskColor}1a`, borderColor: `${riskColor}33` }}
        >
          <ShieldCheck className="w-3 h-3" />
          {riskLabel} ({score.toFixed(1)})
        </div>
      </div>

      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white tracking-tight">{plot.name || "Untitled Plot"}</h3>
          <span className="text-emerald-400 font-bold text-sm">{plot.price}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          {plot.location}
        </div>

        <p className="text-slate-500 text-xs mb-5 line-clamp-2 min-h-[32px]">
          {plot.description || "Geospatial risk assessment complete. Ready for design."}
        </p>

        <div className="mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); handleView(); }}
            className="w-full py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: riskColor }}
          >
            Design House →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlotCard;
