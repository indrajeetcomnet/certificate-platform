import React, { useState, useRef, useEffect, useCallback } from 'react';

// Classic MS Paint Palette Swatches
const PAINT_PALETTE_ROWS = [
  [
    '#000000', '#78716C', '#881337', '#DC2626', '#EA580C', '#D97706',
    '#CA8A04', '#16A34A', '#0D9488', '#0284C7', '#2563EB', '#7C3AED'
  ],
  [
    '#FFFFFF', '#D6D3D1', '#F43F5E', '#F87171', '#FB923C', '#FBBF24',
    '#FEF08A', '#4ADE80', '#2DD4BF', '#38BDF8', '#60A5FA', '#C084FC'
  ]
];

// Helper: Hex to HSL
function hexToHsl(hex) {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Helper: HSL to Hex
function hslToHex(h, s, l) {
  h = h % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export default function ColorPickerSquare({
  color = '#E11D48',
  onChange,
  label = 'Brand Color'
}) {
  const [hexInput, setHexInput] = useState(color);
  const [hsl, setHsl] = useState(() => hexToHsl(color));
  const squareRef = useRef(null);
  const isDraggingSquare = useRef(false);

  useEffect(() => {
    setHexInput(color);
    setHsl(hexToHsl(color));
  }, [color]);

  // Handle interaction with the 2D gradient square
  const handleSquarePointer = useCallback((e) => {
    const rect = squareRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    // Horizontal: Hue 0 to 360
    const newHue = Math.round((x / rect.width) * 360);
    // Vertical: Lightness from 95% at top to 10% at bottom
    const newLightness = Math.round(95 - (y / rect.height) * 85);

    const newHsl = { ...hsl, h: newHue, l: newLightness, s: 90 };
    setHsl(newHsl);
    const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setHexInput(newHex);
    onChange?.(newHex);
  }, [hsl, onChange]);

  const onMouseDownSquare = (e) => {
    isDraggingSquare.current = true;
    handleSquarePointer(e);

    const onMouseMove = (moveEvent) => {
      if (isDraggingSquare.current) {
        handleSquarePointer(moveEvent);
      }
    };

    const onMouseUp = () => {
      isDraggingSquare.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
  };

  const handlePaletteSelect = (swatchHex) => {
    setHexInput(swatchHex);
    setHsl(hexToHsl(swatchHex));
    onChange?.(swatchHex);
  };

  const handleHexChange = (e) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setHsl(hexToHsl(val));
      onChange?.(val);
    }
  };

  // Crosshair coordinates on the 2D square
  const crosshairX = (hsl.h / 360) * 100;
  const crosshairY = Math.max(0, Math.min(100, ((95 - hsl.l) / 85) * 100));

  return (
    <div className="space-y-3 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[10px] font-semibold text-stone-400">
          Click or drag across color spectrum
        </span>
      </div>

      {/* ── 1. MS PAINT STYLE 2D COLOR SQUARE (CLICK & DRAG) ── */}
      <div
        ref={squareRef}
        onMouseDown={onMouseDownSquare}
        onTouchStart={onMouseDownSquare}
        className="relative w-full h-32 rounded-xl border border-stone-300 shadow-inner cursor-crosshair select-none overflow-hidden"
        style={{
          background: `
            linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%),
            linear-gradient(to right, 
              #FF0000 0%, #FFFF00 17%, #00FF00 33%, 
              #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%
            )
          `
        }}
        title="Drag pointer to pick brand color (Paint Style)"
      >
        {/* Draggable Crosshair Pin Target */}
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none ring-1 ring-black/40"
          style={{
            left: `${crosshairX}%`,
            top: `${crosshairY}%`,
            backgroundColor: hexInput || color
          }}
        />
      </div>

      {/* ── 2. CLASSIC MS PAINT COLOR PALETTE SQUARES ── */}
      <div className="space-y-1.5 pt-1">
        {PAINT_PALETTE_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-between">
            {row.map((swatchHex) => {
              const isSelected = color.toUpperCase() === swatchHex.toUpperCase();
              return (
                <button
                  key={swatchHex}
                  type="button"
                  onClick={() => handlePaletteSelect(swatchHex)}
                  className={`w-6 h-6 rounded-md border transition-all duration-150 hover:scale-110 flex-shrink-0 ${
                    isSelected
                      ? 'border-stone-900 ring-2 ring-stone-900 shadow-xs scale-110 z-10'
                      : 'border-stone-300 hover:border-stone-500'
                  }`}
                  style={{ backgroundColor: swatchHex }}
                  title={swatchHex}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* ── 3. PREVIEW & HEX INPUT BAR ── */}
      <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
        {/* Color preview box */}
        <div
          className="w-8 h-8 rounded-lg border border-stone-300 shadow-2xs shrink-0"
          style={{ backgroundColor: color }}
        />

        {/* Hex input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="#E11D48"
            maxLength={7}
            className="w-full px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Native eye-dropper / color picker */}
        <label className="relative inline-flex items-center justify-center p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 cursor-pointer text-xs font-bold text-stone-600 transition-colors">
          <span>Palette</span>
          <input
            type="color"
            value={color.startsWith('#') && color.length === 7 ? color : '#E11D48'}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setHexInput(val);
              setHsl(hexToHsl(val));
              onChange?.(val);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
    </div>
  );
}
