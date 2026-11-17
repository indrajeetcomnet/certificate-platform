import React from 'react';

const variantStyles = {
  gold: 'bg-amber-100 text-amber-900 border-amber-300',
  silver: 'bg-slate-100 text-slate-800 border-slate-300',
  bronze: 'bg-orange-100 text-orange-900 border-orange-300',
  sponsor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  default: 'bg-stone-100 text-stone-800 border-stone-300',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  text,
  variant = 'default',
  size = 'md',
  icon: Icon,
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {text}
    </span>
  );
}
