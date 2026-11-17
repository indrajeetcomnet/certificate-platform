import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Check } from 'lucide-react';

export const FONT_OPTIONS = [
  // Highlighted Featured Picks
  { id: 'cinzel', name: 'Cinzel', category: 'Diplomatic Serif', className: 'font-cinzel', featured: true },
  { id: 'playfair', name: 'Playfair Display', category: 'Diplomatic Serif', className: 'font-playfair', featured: true },
  { id: 'signature', name: 'Great Vibes', category: 'Calligraphy & Script', className: 'font-signature', featured: true },
  { id: 'montserrat', name: 'Montserrat', category: 'Modern & Athletic Sans', className: 'font-montserrat', featured: true },
  { id: 'mono', name: 'Space Mono', category: 'Monospace / Serial', className: 'font-mono-code', featured: true },

  // Expanded Classical Serif
  { id: 'cinzel-decorative', name: 'Cinzel Decorative', category: 'Diplomatic Serif', className: 'font-cinzel-decorative' },
  { id: 'cormorant', name: 'Cormorant Garamond', category: 'Diplomatic Serif', className: 'font-cormorant' },
  { id: 'merriweather', name: 'Merriweather', category: 'Diplomatic Serif', className: 'font-merriweather' },

  // Expanded Calligraphy & Script
  { id: 'alex-brush', name: 'Alex Brush', category: 'Calligraphy & Script', className: 'font-alex-brush' },
  { id: 'dancing', name: 'Dancing Script', category: 'Calligraphy & Script', className: 'font-dancing' },
  { id: 'pinyon', name: 'Pinyon Script', category: 'Calligraphy & Script', className: 'font-pinyon' },

  // Expanded Modern & Athletic Sans
  { id: 'inter', name: 'Inter Clean', category: 'Modern & Athletic Sans', className: 'font-inter' },
  { id: 'oswald', name: 'Oswald Bold', category: 'Modern & Athletic Sans', className: 'font-oswald' },
];

export default function FontFamilySelector({ value = 'cinzel', onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const dropdownRef = useRef(null);

  const selectedFont = FONT_OPTIONS.find((f) => f.id === value) || FONT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['all', 'Diplomatic Serif', 'Calligraphy & Script', 'Modern & Athletic Sans', 'Monospace / Serial'];

  const filteredFonts = filterCategory === 'all'
    ? FONT_OPTIONS
    : FONT_OPTIONS.filter((f) => f.category === filterCategory);

  return (
    <div ref={dropdownRef} className={`relative select-none ${className}`}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200/90 rounded-lg text-xs font-bold text-stone-900 transition-all shadow-xs min-w-[120px]"
        title="Change Typography"
      >
        <span className={`truncate ${selectedFont.className}`}>
          {selectedFont.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-stone-900">
          
          {/* Header */}
          <div className="px-2 py-1 border-b border-stone-100 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Select Typography</span>
            </span>
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              {FONT_OPTIONS.length} Fonts
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 px-1 mb-1 border-b border-stone-100 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 rounded text-[9.5px] font-bold whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Highlighted Featured Section (when 'all' is selected) */}
          {filterCategory === 'all' && (
            <div className="mb-2">
              <div className="text-[9px] font-black uppercase text-amber-800 px-2 py-0.5 bg-amber-50 rounded mb-1">
                ★ Highlighted Picks
              </div>
              <div className="space-y-0.5">
                {FONT_OPTIONS.filter((f) => f.featured).map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => {
                      onChange(font.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      value === font.id
                        ? 'bg-amber-100/70 text-amber-950 font-bold'
                        : 'hover:bg-stone-100 text-stone-800'
                    }`}
                  >
                    <span className={`text-sm ${font.className}`}>
                      {font.name}
                    </span>
                    {value === font.id && <Check className="w-3.5 h-3.5 text-amber-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categorized / Filtered List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
            {filterCategory === 'all' && (
              <div className="text-[9px] font-black uppercase text-stone-400 px-2 py-0.5">
                All Available Styles
              </div>
            )}
            {filteredFonts.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => {
                  onChange(font.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  value === font.id
                    ? 'bg-amber-100/70 text-amber-950 font-bold'
                    : 'hover:bg-stone-100 text-stone-800'
                }`}
              >
                <div>
                  <div className={`text-sm ${font.className}`}>
                    {font.name}
                  </div>
                  <div className="text-[9px] text-stone-400">{font.category}</div>
                </div>
                {value === font.id && <Check className="w-3.5 h-3.5 text-amber-700" />}
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
