import React from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_NAV_ITEMS } from '../../utils/constants';

export default function MobileNav({ className = '' }) {
  const { currentUser } = useAuth();
  const roleKey = currentUser?.role === 'INSTITUTION' ? 'INSTITUTION' : currentUser ? 'USER' : 'GUEST';
  const items = ROLE_NAV_ITEMS[roleKey] || ROLE_NAV_ITEMS.USER;

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      {items.map((item) => {
        const Icon = LucideIcons[item.icon] || LucideIcons.Circle;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[11px] font-semibold transition-all ${isActive
                ? 'text-stone-900 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-700'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[70px]">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
