import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 mb-6 select-none">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={item.label}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            )}
            
            {isLast ? (
              <span className="text-white font-medium text-xs px-3 py-1.5 rounded-full bg-slate-800/30 border border-white/5">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs px-3 py-1.5 rounded-full bg-slate-800/50 border border-transparent hover:border-white/10"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
