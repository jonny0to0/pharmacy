import React, { useRef, useEffect } from 'react';
import { Search, Barcode, Minimize2, Maximize2 } from 'lucide-react';

interface ModernSearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  isLoading?: boolean;
}

const ModernSearchBar: React.FC<ModernSearchBarProps> = ({ query, setQuery, onKeyDown, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search bar on Mount - extra safety
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative group animate-in fade-in duration-700">
      {/* Subtle focus glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-700"></div>
      
      <div className="relative flex items-center bg-white border border-slate-200 group-focus-within:border-indigo-600 group-focus-within:ring-4 group-focus-within:ring-indigo-50 rounded-xl transition-all duration-300 shadow-sm overflow-hidden">
        
        {/* Search Icon / Loader */}
        <div className="flex items-center justify-center pl-4 pr-3">
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={20} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Identify items by name, category, or scan barcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 py-4 bg-transparent border-none focus:ring-0 text-slate-900 text-lg font-medium placeholder:text-slate-400 outline-none"
          autoComplete="off"
        />

        {/* Action Indicators */}
        <div className="flex items-center gap-3 pr-4">
          {/* F2 Focus Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest group-focus-within:hidden">
            <span className="bg-white px-1 rounded border border-slate-200">F2</span>
            <span>Focus</span>
          </div>

          {/* Barcode Scanner Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[10px] font-bold text-indigo-600 group-focus-within:animate-none">
            <Barcode size={14} />
            <span className="hidden md:inline uppercase tracking-widest">Scanner Active</span>
          </div>
        </div>
      </div>

      {/* Quick Tips Tooltip */}
      <div className="absolute -bottom-6 left-5 text-[10px] text-slate-400 font-medium opacity-0 group-focus-within:opacity-100 transition-opacity">
        Press <span className="text-slate-600 font-bold uppercase tracking-tighter">Enter</span> to commit first result
      </div>
    </div>
  );
};

export default ModernSearchBar;
