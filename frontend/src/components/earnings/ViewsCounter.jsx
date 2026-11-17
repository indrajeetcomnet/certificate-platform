import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

export default function ViewsCounter({
  count = 0,
  className = '',
}) {
  const [pulsing, setPulsing] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  useEffect(() => {
    if (count !== prevCount) {
      setPulsing(true);
      setPrevCount(count);
      const timer = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [count, prevCount]);

  const numericCount = Number(count) || 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 ${className}`}
    >
      <Eye className={`w-4 h-4 text-blue-500 transition-transform ${pulsing ? 'scale-125' : 'scale-100'}`} />
      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono font-bold text-sm tracking-tight transition-all duration-300 ${
            pulsing ? 'text-blue-600 scale-105' : ''
          }`}
        >
          {numericCount.toLocaleString('en-IN')}
        </span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">
          views
        </span>
      </div>
    </div>
  );
}
