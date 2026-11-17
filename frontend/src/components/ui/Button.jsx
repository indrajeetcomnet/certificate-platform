import React from 'react';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  // Premium Obsidian (Deep luxury dark with subtle rim highlight)
  primary: 'bg-stone-900 hover:bg-stone-800 text-stone-50 shadow-sm hover:shadow-md border border-stone-800',
  dark: 'bg-stone-900 hover:bg-stone-800 text-stone-50 shadow-sm hover:shadow-md border border-stone-800',
  
  // Energetic Gold / Amber (Prestige, victory, badges)
  gold: 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm hover:shadow-glow-gold',
  
  // Vibrant Emerald / Teal (Earnings, verified status)
  emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow-glow-emerald',
  
  // Energetic Indigo / Violet (Social, engagement)
  indigo: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm',
  
  // Premium Pearl / Glass Secondary (Soft ivory surface with stone border)
  secondary: 'bg-white/80 hover:bg-white text-stone-800 border border-stone-200/90 shadow-sm hover:shadow hover:border-stone-300',
  glass: 'bg-white/70 backdrop-blur-md hover:bg-white/90 text-stone-800 border border-white/60 shadow-sm hover:shadow',
  
  // Danger
  danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm',
  
  // Ghost
  ghost: 'bg-transparent hover:bg-stone-100 text-stone-700 dark:hover:bg-stone-800 dark:text-stone-300',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'px-4 py-2 text-sm font-semibold rounded-xl',
  lg: 'px-6 py-3 text-sm font-bold rounded-xl tracking-wide',
  xl: 'px-7 py-3.5 text-base font-bold rounded-2xl tracking-wide shadow-md',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2 flex-shrink-0" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2 flex-shrink-0" />}
    </button>
  );
}
