import React from 'react';

export default function Card({
  children,
  header,
  footer,
  className = '',
  padding = 'p-5',
  shadow = 'shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
  rounded = 'rounded-2xl',
  border = true,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/95 backdrop-blur-sm ${shadow} ${rounded} ${
        border ? 'border border-stone-200/80' : ''
      } ${
        onClick ? 'cursor-pointer hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:border-stone-300 transition-all duration-200' : ''
      } ${className}`}
    >
      {header && (
        <div className="px-5 py-4 border-b border-stone-100 font-semibold text-stone-900">
          {header}
        </div>
      )}
      <div className={padding}>{children}</div>
      {footer && (
        <div className="px-5 py-3.5 border-t border-stone-100 bg-stone-50/60 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
}
