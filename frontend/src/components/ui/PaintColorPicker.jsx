import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pipette } from 'lucide-react';

// Math helpers for HSV <-> HEX conversion
function hsvToHex(h, s, v) {
  const sat = s / 100;
  const val = v / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsv(hex) {
  if (!hex || typeof hex !== 'string') return { h: 35, s: 80, v: 80 };
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return { h: 35, s: 80, v: 80 };
  const r = parseInt(c.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(c.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(c.substring(4, 6), 16) / 255 || 0;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const v = Math.round(max * 100);
  return { h, s, v };
}

// Quick Palettes for Certificate & Classic Artwork
const PALETTE_SWATCHES = [
  '#B45309', '#D97706', '#F59E0B', '#92400E',
  '#047857', '#065F46', '#10B981', '#064E3B',
  '#1E3A8A', '#2563EB', '#1D4ED8', '#172554',
  '#64748B', '#475569', '#334155', '#0F172A',
  '#991B1B', '#B91C1C', '#7F1D1D', '#581C87',
  '#1C1917', '#44403C', '#78716C', '#FFFFFF',
  '#FDFBF7', '#FAF9F5', '#F8FAF7', '#FEF3C7',
];

export default function PaintColorPicker({ color = '#B45309', onChange, label = 'Select Color' }) {
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(color);
  const satValBoxRef = useRef(null);

  // Sync from external color changes
  useEffect(() => {
    if (color && color.toUpperCase() !== hsvToHex(hsv.h, hsv.s, hsv.v)) {
      const parsed = hexToHsv(color);
      setHsv(parsed);
      setHexInput(color.toUpperCase());
    }
  }, [color]);

  // Handle click/drag on the 2D Saturation / Brightness box (MS Paint style)
  const handleSatValPointer = useCallback((e) => {
    if (!satValBoxRef.current) return;
    const rect = satValBoxRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    setHsv((prev) => {
      const updated = { ...prev, s, v };
      const newHex = hsvToHex(updated.h, updated.s, updated.v);
      setHexInput(newHex);
      if (onChange) onChange(newHex);
      return updated;
    });
  }, [onChange]);

  const handleStartSatValDrag = (e) => {
    e.preventDefault();
    handleSatValPointer(e);

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      handleSatValPointer(moveEvent);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  // Handle Hue slider
  const handleHueChange = (e) => {
    const h = Number(e.target.value);
    setHsv((prev) => {
      const updated = { ...prev, h };
      const newHex = hsvToHex(updated.h, updated.s, updated.v);
      setHexInput(newHex);
      if (onChange) onChange(newHex);
      return updated;
    });
  };

  // Handle direct hex text input
  const handleHexChange = (e) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const parsed = hexToHsv(val);
      setHsv(parsed);
      if (onChange) onChange(val.toUpperCase());
    }
  };

  // Eyedropper API if available
  const handleEyedropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const newHex = result.sRGBHex.toUpperCase();
          setHexInput(newHex);
          setHsv(hexToHsv(newHex));
          if (onChange) onChange(newHex);
        }
      } catch {}
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-stone-200/90 p-3 shadow-lg select-none space-y-3 text-stone-900">
      
      {/* Header with Title & Current Hex */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-stone-600">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-full border border-stone-300 shadow-xs"
            style={{ backgroundColor: hexInput }}
          />
          <span className="font-mono text-xs font-bold text-stone-800">{hexInput}</span>
        </div>
      </div>

      {/* ── 1. 2D SATURATION & BRIGHTNESS GRADIENT BOX (MS PAINT STYLE) ── */}
      <div
        ref={satValBoxRef}
        onPointerDown={handleStartSatValDrag}
        style={{
          backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          backgroundImage:
            'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
        }}
        className="w-full h-32 rounded-xl relative cursor-crosshair shadow-inner border border-stone-200 overflow-hidden"
      >
        {/* Selector handle cursor */}
        <div
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
          }}
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>

      {/* ── 2. HUE RAINBOW SPECTRUM SLIDER ── */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max="360"
          value={hsv.h}
          onChange={handleHueChange}
          style={{
            background:
              'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          }}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer outline-none shadow-inner"
        />
      </div>

      {/* ── 3. HEX INPUT & NATIVE EYEDROPPER ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="#B45309"
            maxLength={7}
            className="w-full text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-amber-500 uppercase"
          />
        </div>

        {/* Native browser EyeDropper or color picker */}
        {typeof window !== 'undefined' && window.EyeDropper ? (
          <button
            type="button"
            onClick={handleEyedropper}
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Pick color from screen"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        ) : (
          <input
            type="color"
            value={hexInput}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setHexInput(val);
              setHsv(hexToHsv(val));
              if (onChange) onChange(val);
            }}
            className="w-7 h-7 p-0 rounded border border-stone-300 cursor-pointer"
            title="System color palette"
          />
        )}
      </div>

      {/* ── 4. MS PAINT STYLE QUICK PALETTE SWATCHES ── */}
      <div className="pt-2 border-t border-stone-100">
        <div className="grid grid-cols-7 gap-1.5">
          {PALETTE_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => {
                setHexInput(swatch);
                setHsv(hexToHsv(swatch));
                if (onChange) onChange(swatch);
              }}
              style={{ backgroundColor: swatch }}
              className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 shadow-xs ${
                hexInput.toUpperCase() === swatch.toUpperCase()
                  ? 'ring-2 ring-amber-500 ring-offset-1 border-white'
                  : 'border-stone-300'
              }`}
              title={swatch}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
