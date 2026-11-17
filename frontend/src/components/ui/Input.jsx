import React from 'react';

export default function Input({
  label,
  placeholder,
  error,
  type = 'text',
  icon: Icon,
  value,
  onChange,
  name,
  id,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-stone-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-4 h-4 text-stone-400" />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`block w-full rounded-xl border ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-stone-300 focus:ring-amber-500 focus:border-amber-500'} bg-white text-stone-900 placeholder-stone-400 ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-stone-100 disabled:cursor-not-allowed transition-colors shadow-xs`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
