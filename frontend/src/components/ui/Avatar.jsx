import React, { useState, useMemo } from 'react';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
  '3xl': 'w-32 h-32 text-3xl',
  '4xl': 'w-36 h-36 text-4xl',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  useInitials = false,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);
  const initials = useMemo(() => getInitials(name || alt), [name, alt]);
  const sizeClass = sizeMap[size] || sizeMap.md;

  // Render actual image if provided and not failed
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        onError={() => setImageError(true)}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-xs shrink-0 select-none ${className}`}
      />
    );
  }

  // Fallback 1: Custom athletic initials badge if explicitly requested
  if (useInitials && initials) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 flex items-center justify-center font-black ring-2 ring-white shadow-xs shrink-0 select-none ${className}`}
        title={alt || name}
      >
        {initials}
      </div>
    );
  }

  // Fallback 2: Standard, sleek modern social media default silhouette avatar (Twitter / Instagram / LinkedIn style)
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-b from-stone-200 via-stone-200 to-stone-300 text-stone-500 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-xs shrink-0 select-none relative ${className}`}
      title={alt || name || 'Default Profile Photo'}
    >
      <svg
        className="w-3/5 h-3/5 text-stone-500 translate-y-1"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}
