import React from 'react';

export default function TextArea({
  label,
  placeholder,
  maxLength,
  value,
  onChange,
  name,
  id,
  rows = 4,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const textareaId = id || name;
  const charCount = value ? value.length : 0;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-semibold text-stone-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`block w-full rounded-xl border ${error ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-amber-500 focus:border-amber-500'} bg-white text-stone-900 placeholder-stone-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-stone-100 disabled:cursor-not-allowed resize-none transition-colors shadow-xs`}
        {...props}
      />
      <div className="flex justify-between items-center">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {maxLength && (
          <p className={`text-xs ml-auto ${charCount >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
