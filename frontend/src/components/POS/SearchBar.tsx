import React, { useRef, useEffect } from 'react';
import { Search, Barcode, Keyboard } from 'lucide-react';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onKeyDown, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on F2 handle is usually globally in the page, but we can expose a method if needed
  // For now, we'll just allow focus via ref or autoFocus

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        {isLoading ? (
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder="Search by Product Name or Barcode (SKU)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full bg-white border border-gray-200 text-gray-900 text-lg rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block pl-12 pr-32 p-4 transition-all shadow-sm font-medium outline-none"
        autoFocus
      />

      <div className="absolute inset-y-0 right-4 flex items-center gap-2">
        {/* <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-400 shadow-sm uppercase tracking-wider">
          <Keyboard className="w-3 h-3" />
          <span>F2 to Focus</span>
        </div> */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 border border-primary/10 rounded-lg text-[10px] font-bold text-primary shadow-sm uppercase tracking-wider">
          <Barcode className="w-3 h-3" />
          <span>Scan Ready</span>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
