import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  debounceTime = 300,
  defaultValue = '',
  className = '',
}) {
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(query);
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [query, debounceTime, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-9 pr-8 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-xs"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-stone-400 hover:text-stone-700"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
