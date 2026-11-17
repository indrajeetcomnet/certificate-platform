import React, { useState } from 'react';

export default function Tabs({ tabs = [], defaultTab = 0, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className={className}>
      <div className="flex border-b border-stone-200/90 overflow-x-auto gap-2">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === index
                ? 'border-stone-900 text-stone-900 font-black'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-5">{tabs[activeTab]?.content}</div>
    </div>
  );
}
