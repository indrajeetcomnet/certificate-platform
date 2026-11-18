import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Award, User, LogOut, Shield, DollarSign, Trophy, MessageSquare, Sparkles } from 'lucide-react';
import SearchBar from '../ui/SearchBar';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';
import Dropdown from '../ui/Dropdown';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { getUnreadCount } from '../../api/messagesApi';

export default function Header({ onSearch, title = 'Athlos', isStudio = false, className = '' }) {
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
        label: 'Organize Tournaments',
        icon: Trophy,
        onClick: () => navigate('/tournaments'),
      },
      {
        label: 'Certificate Hub & Ledger',
        icon: Award,
        onClick: () => navigate('/certificates'),
      },
      {
        label: 'Hall of Fame',
        icon: Trophy,
        onClick: () => navigate('/hall-of-fame'),
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
        label: 'My Profile',
        icon: User,
        onClick: () => navigate(`/profile/${currentUser?.id || 1}`),
      },
      {
        label: 'Hall of Fame',
        icon: Trophy,
        onClick: () => navigate('/hall-of-fame'),
      },
      {
        label: 'Direct Messages',
        icon: MessageSquare,
        onClick: () => navigate('/messages'),
      },
      {
        label: 'Sponsor Hub & Market',
        icon: Sparkles,
        onClick: () => navigate('/sponsors'),
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
      {/* Athlos Brand Logo & Studio Route breadcrumbs */}
      <div className="flex items-center gap-3">
        <Logo size="sm" showText={true} subtitle="" />

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
        {/* Hall of Fame Shortcut */}
        <Link
          to="/hall-of-fame"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-amber-50/50 text-xs font-bold text-stone-800 transition-all hover:scale-105 shadow-2xs"
          title="Hall of Fame & Podium Champions"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Hall of Fame</span>
        </Link>

        {/* Sponsor Hub Shortcut */}
        <Link
          to="/sponsors"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50/70 hover:bg-amber-100 text-xs font-bold text-amber-900 transition-all hover:scale-105 shadow-2xs"
          title="Sponsor Hub & Open Brand Campaigns"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Sponsor Hub</span>
        </Link>
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

        {/* Notifications Popover Dropdown */}
        <NotificationDropdown />

        {/* User profile dropdown */}
        {currentUser ? (
          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-100 transition-colors">
                <Avatar
                  src={currentUser?.avatarUrl}
                  name={currentUser?.displayName || currentUser?.username}
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