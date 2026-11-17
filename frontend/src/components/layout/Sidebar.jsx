import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { ROLE_NAV_ITEMS } from '../../utils/constants';
import { getUnreadCount } from '../../api/messagesApi';

export default function Sidebar({ className = '' }) {
  const { currentUser, isInstitution, logout } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    getUnreadCount()
      .then((res) => setUnreadMessages(res.data?.unreadCount || 0))
      .catch(() => { });

    const interval = setInterval(() => {
      getUnreadCount()
        .then((res) => setUnreadMessages(res.data?.unreadCount || 0))
        .catch(() => { });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Strict role-based navigation check
  const isInstitutionUser = currentUser?.role === 'INSTITUTION';
  const roleKey = isInstitutionUser ? 'INSTITUTION' : currentUser ? 'USER' : 'GUEST';
  const navItems = ROLE_NAV_ITEMS[roleKey] || ROLE_NAV_ITEMS.USER;

  return (
    <aside
      className={`hidden md:flex flex-col w-64 bg-white/95 backdrop-blur-md border-r border-stone-200/80 min-h-screen p-5 sticky top-0 justify-between ${className}`}
    >
      <div className="space-y-6">
        {/* Athlos Brand Logo */}
        <div className="px-1 py-1">
          <Logo
            size="md"
            subtitle={isInstitutionUser ? 'Institution Workspace' : 'Athlete Arena'}
          />
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = LucideIcons[item.icon] || LucideIcons.Circle;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                    ? 'bg-amber-500/10 text-amber-950 border border-amber-400/40 shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.path === '/messages' && unreadMessages > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-stone-900 shadow-xs">
                    {unreadMessages}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      {currentUser && (
        <div className="pt-4 border-t border-stone-200/70 space-y-2">
          <NavLink
            to={isInstitutionUser ? '/certificates' : `/profile/${currentUser.id}`}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-100/80 transition-colors border border-stone-200/60 bg-stone-50/50"
          >
            <Avatar
              src={currentUser.avatarUrl}
              name={currentUser.displayName || currentUser.username}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-900 truncate">
                {currentUser.displayName || currentUser.username}
              </p>
              <p className="text-[11px] text-stone-500 truncate">
                {isInstitutionUser ? 'Official Issuer' : `@${currentUser.username}`}
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors font-medium"
          >
            <LucideIcons.LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}