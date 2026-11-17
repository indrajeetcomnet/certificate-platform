import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const typeConfig = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' },
  error: { icon: AlertCircle, bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-300' },
  info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-300' },
};

export default function Toast({ message, type = 'info', onDismiss, duration = 3000 }) {
  const [visible, setVisible] = useState(true);
  const config = typeConfig[type] || typeConfig.info;
  const TypeIcon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${config.bg} ${config.text} ${config.border} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <TypeIcon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 300); }} className="p-0.5 rounded hover:bg-black/10 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
