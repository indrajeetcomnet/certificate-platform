import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Award,
  Coins,
  MessageSquare,
  Shield,
  CheckCircle2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function NotificationDropdown({ className = '' }) {
  const { currentUser, isInstitution } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  const isInstitutionUser = currentUser?.role === 'INSTITUTION' || (isInstitution && currentUser?.role !== 'USER');
  const storageKey = `certplatform_notifs_${currentUser?.id || (isInstitutionUser ? 'inst' : 'user')}`;

  // Default seed notifications by role
  const initialNotifications = useMemo(() => {
    if (isInstitutionUser) {
      return [
        {
          id: 'inst-1',
          type: 'award',
          title: 'Certificate Registered on Ledger',
          message: 'Certificate GC-2026-ATH-GOLD-01 has been cryptographically recorded for Indrajeet Patil.',
          time: '15m ago',
          link: '/certificates',
          read: false,
        },
        {
          id: 'inst-2',
          type: 'message',
          title: 'Direct Athlete Inquiry',
          message: 'Indrajeet Patil reached out regarding official tournament credential transcripts.',
          time: '1h ago',
          link: '/messages',
          read: false,
        },
        {
          id: 'inst-3',
          type: 'shield',
          title: 'Badge Allocation Active',
          message: 'Game City #Rank 1 competition badge was awarded to 1 registered athlete.',
          time: '3h ago',
          link: '/badges/manage',
          read: false,
        },
        {
          id: 'inst-4',
          type: 'check',
          title: 'Federation Portal Active',
          message: 'Athlos Sports Academy is verified for unlimited tamper-proof certificate issuance.',
          time: '2d ago',
          link: '/certificates',
          read: true,
        },
      ];
    }

    return [
      {
        id: 'user-1',
        type: 'award',
        title: 'Tamper-Proof Certificate Awarded',
        message: 'Athlos Sports Academy officially awarded you the Game City Invitational Gold Medal certificate.',
        time: '12m ago',
        link: `/profile/${currentUser?.id || 2}`,
        read: false,
      },
      {
        id: 'user-2',
        type: 'coins',
        title: 'Sponsor Royalty Credited',
        message: 'You earned ₹124.50 from 85 verified feed views on your recent athletic match post.',
        time: '45m ago',
        link: '/earnings',
        read: false,
      },
      {
        id: 'user-3',
        type: 'message',
        title: 'Direct Message from Academy',
        message: 'Athlos Sports Academy: "Congratulations on qualifying for the upcoming championships!"',
        time: '2h ago',
        link: '/messages',
        read: false,
      },
      {
        id: 'user-4',
        type: 'shield',
        title: 'Rank #1 Badge Active',
        message: 'Your official verified competitor badge is now rotating live across all your arena posts.',
        time: '1d ago',
        link: `/profile/${currentUser?.id || 2}`,
        read: true,
      },
    ];
  }, [isInstitutionUser, currentUser?.id]);

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return initialNotifications;
  });

  // Keep synced with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch {
      // storage unavailable
    }
  }, [notifications, storageKey]);

  // Handle outside click & Esc key
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const handleClearAll = () => {
    setNotifications([]);
    showToast('Notifications cleared', 'info');
  };

  const handleItemClick = (item) => {
    // Mark this item as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleDeleteItem = (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'award':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-amber-700" />
          </div>
        );
      case 'coins':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4 text-emerald-700" />
          </div>
        );
      case 'message':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-800 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-blue-700" />
          </div>
        );
      case 'shield':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-800 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-purple-700" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        );
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={`p-2 rounded-xl transition-colors relative flex items-center justify-center ${isOpen
            ? 'bg-stone-200/80 text-stone-900 shadow-xs'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        title="Notifications & Activity"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[9px] font-black rounded-full bg-amber-500 text-stone-950 shadow-xs text-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

          {/* Header */}
          <div className="p-3.5 bg-stone-50 border-b border-stone-200/90">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-stone-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 shadow-2xs">
                    {unreadCount} New
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-stone-600 hover:text-amber-800 hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`flex-1 py-1 rounded-lg font-bold transition-all text-center ${filter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                  }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`flex-1 py-1 rounded-lg font-bold transition-all text-center ${filter === 'unread'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                  }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification Items List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-xs font-black text-stone-900">All caught up!</div>
                <p className="text-[11px] text-stone-500 max-w-[200px] mx-auto">
                  {filter === 'unread'
                    ? 'You have read all your notifications.'
                    : 'No activity or alerts at the moment.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-stone-50 cursor-pointer transition-colors group relative ${!item.read ? 'bg-amber-50/40' : 'bg-white'
                    }`}
                >
                  {renderIcon(item.type)}

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${!item.read ? 'font-black text-stone-950' : 'font-bold text-stone-800'
                          }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-stone-500 font-medium shrink-0">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  {/* Actions / Unread dot */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    {!item.read && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                        title="Unread notification"
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      title="Dismiss notification"
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded-md transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-stone-50 border-t border-stone-200/90 flex items-center justify-between text-xs">
              <Link
                to={isInstitutionUser ? '/certificates' : `/profile/${currentUser?.id || 2}`}
                onClick={() => setIsOpen(false)}
                className="font-bold text-stone-700 hover:text-amber-800 hover:underline"
              >
                {isInstitutionUser ? 'View Certificate Ledger →' : 'View Verified Certificates →'}
              </Link>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-stone-500 hover:text-rose-600 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
