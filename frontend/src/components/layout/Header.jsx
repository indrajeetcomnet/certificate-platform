import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Award, User, LogOut, Shield, DollarSign, Trophy, MessageSquare } from 'lucide-react';
import SearchBar from '../ui/SearchBar';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { getUnreadCount } from '../../api/messagesApi';

export default function Header({ onSearch, title = 'CertPlatform', isStudio = false, className = '' }) {
  const { currentUser, isInstitution, logout } = useAuth();
  const navigate = useNavigate();
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

  const handleSearch = (query) => {
    if (onSearch) {
      onSearch(query);
    } else if (query) {
      navigate(`/feed?q=${encodeURIComponent(query)}`);
    }
  };

  const isInstitutionUser = currentUser?.role === 'INSTITUTION' || (isInstitution && currentUser?.role !== 'USER');

  const userMenuItems = isInstitutionUser
    ? [
      {
        label: 'Certificate Hub & Ledger',
        icon: Award,
        onClick: () => navigate('/certificates'),
      },
      {
        label: 'Create Certificate (Studio)',
        icon: Award,
        onClick: () => navigate('/certificates/create'),
      },
      {
        label: 'Award Competition Badges',
        icon: Shield,
        onClick: () => navigate('/badges/manage'),
      },
      {
        label: 'Direct Messages',
        icon: MessageSquare,
        onClick: () => navigate('/messages'),
      },
      { divider: true },
      {
        label: 'Sign Out',
        icon: LogOut,
        onClick: () => logout(),
      },
    ]
    : [
      {
        label: 'My Athlete Profile',
        icon: User,
        onClick: () => navigate(`/profile/${currentUser?.id || 1}`),
      },
      {
        label: 'Direct Messages',
        icon: MessageSquare,
        onClick: () => navigate('/messages'),
      },
      {
        label: 'Sponsor Earnings',
        icon: DollarSign,
        onClick: () => navigate('/earnings'),
      },
      { divider: true },
      {
        label: 'Sign Out',
        icon: LogOut,
        onClick: () => logout(),
      },
    ];

  return (
    <header
      className={`h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0 ${className}`}
    >
      {/* Brand / Logo & Studio Route breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-xs group-hover:scale-105 transition-transform">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-stone-900 tracking-tight hidden sm:inline">{title}</span>
        </Link>

        {isStudio && (
          <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/20">
              Studio Canvas
            </span>
          </div>
        )}

        {!isStudio && (
          <div className="hidden sm:block w-64 md:w-80 ml-2">
            <SearchBar
              placeholder={isInstitution ? 'Search certificates, recipients...' : 'Search posts, badges...'}
              onSearch={handleSearch}
            />
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Direct Messages Shortcut */}
        {currentUser && (
          <Link
            to="/messages"
            aria-label="Direct Messages"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors relative flex items-center justify-center"
            title="Direct Messages"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[9px] font-black rounded-full bg-amber-500 text-stone-900 shadow-xs text-center">
                {unreadMessages}
              </span>
            )}
          </Link>
        )}

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>

        {/* User profile dropdown */}
        {currentUser ? (
          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-100 transition-colors">
                <Avatar
                  src={currentUser.avatarUrl}
                  name={currentUser.displayName || currentUser.username}
                  size="sm"
                />
              </button>
            }
            items={userMenuItems}
          />
        ) : (
          <Link
            to="/login"
            className="text-xs font-bold text-stone-900 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-300"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}