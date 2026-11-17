import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Shield,
  Check,
  CheckCheck,
  Clock,
  Plus,
  X,
  Sparkles,
  Trophy,
  ArrowLeft,
  Circle,
  ExternalLink,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../api/messagesApi';
import { getAllUsers } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected partner ID from URL query ?user=123 or state
  const queryUserId = searchParams.get('user');

  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(
    queryUserId ? Number(queryUserId) : null
  );
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  // Search & New Message Modal state
  const [conversationSearch, setConversationSearch] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userDirectory, setUserDirectory] = useState([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Loading states
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Scroll to bottom of message thread
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Load all user conversations
  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setConversationsLoading(true);
    try {
      const res = await getConversations();
      const data = res.data || [];
      setConversations(data);
    } catch (err) {
      console.warn('Conversations fetch notice:', err.message);
    } finally {
      if (!silent) setConversationsLoading(false);
    }
  }, []);

  // Load specific conversation thread
  const fetchThread = useCallback(
    async (partnerId, silent = false) => {
      if (!partnerId) return;
      if (!silent) setMessagesLoading(true);
      try {
        const res = await getConversation(partnerId);
        const data = res.data || [];
        setMessages(data);

        // Mark as read in local unread count
        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (err) {
        console.warn('Thread fetch notice:', err.message);
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    []
  );

  // Load active partner details
  const resolveActivePartner = useCallback(
    async (partnerId) => {
      if (!partnerId) {
        setActivePartner(null);
        return;
      }
      // Check existing conversations
      const found = conversations.find((c) => c.partnerId === partnerId);
      if (found) {
        setActivePartner({
          id: found.partnerId,
          username: found.partnerUsername,
          displayName: found.partnerDisplayName,
          avatarUrl: found.partnerAvatarUrl,
          role: found.partnerRole,
          bio: found.partnerBio,
        });
        return;
      }

      // Or fetch from all users directory
      try {
        const res = await getAllUsers();
        const users = res.data || [];
        const u = users.find((item) => item.id === partnerId);
        if (u) {
          setActivePartner(u);
        }
      } catch (e) {
        console.warn('Could not resolve active partner', e);
      }
    },
    [conversations]
  );

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle URL change or active partner change
  useEffect(() => {
    if (queryUserId) {
      const pId = Number(queryUserId);
      setActivePartnerId(pId);
      fetchThread(pId);
      resolveActivePartner(pId);
    } else if (activePartnerId) {
      fetchThread(activePartnerId);
      resolveActivePartner(activePartnerId);
    }
  }, [queryUserId, activePartnerId, fetchThread, resolveActivePartner]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  // Real-time live polling (every 4 seconds for fresh messages and unread counts)
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchConversations(true);
      if (activePartnerId) {
        fetchThread(activePartnerId, true);
      }
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activePartnerId, fetchConversations, fetchThread]);

  // Open conversation
  const handleSelectConversation = (partnerId) => {
    setActivePartnerId(partnerId);
    setSearchParams({ user: String(partnerId) });
    fetchThread(partnerId);
    resolveActivePartner(partnerId);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !activePartnerId || sending) return;

    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const res = await sendMessage({
        recipientId: activePartnerId,
        content,
      });

      const newMsg = res.data;
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom(true);

      // Refresh conversations list
      fetchConversations(true);
    } catch (err) {
      console.error('Send message failed', err);
      showToast(
        err.response?.data?.message || err.message || 'Failed to send message',
        'error'
      );
      setMessageText(content); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // Open New Chat modal & fetch directory
  const handleOpenNewChat = async () => {
    setShowNewChatModal(true);
    setDirectoryLoading(true);
    try {
      const res = await getAllUsers();
      const all = res.data || [];
      // Filter out self
      setUserDirectory(
        all.filter((u) => u.id !== currentUser?.id)
      );
    } catch (err) {
      console.warn('User directory fetch notice:', err.message);
      setUserDirectory([]);
    } finally {
      setDirectoryLoading(false);
    }
  };

  // Filtered conversations list
  const filteredConversations = conversations.filter((c) => {
    if (!conversationSearch.trim()) return true;
    const q = conversationSearch.toLowerCase();
    return (
      c.partnerDisplayName?.toLowerCase().includes(q) ||
      c.partnerUsername?.toLowerCase().includes(q) ||
      c.lastMessageContent?.toLowerCase().includes(q)
    );
  });

  // Filtered directory for new chat modal
  const filteredDirectory = userDirectory.filter((u) => {
    if (!directorySearch.trim()) return true;
    const q = directorySearch.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q)
    );
  });

  // Format relative timestamp
  const formatMsgTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT PANE: Conversations List ── */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-stone-200 bg-stone-50/50 ${activePartnerId ? 'hidden md:flex' : 'flex'
            }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-black text-stone-900 tracking-tight leading-none">
                  Direct Messages
                </h1>
                <p className="text-[11px] text-stone-500 font-medium">
                  Athlete & Federation Chat
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenNewChat}
              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/20 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Start new conversation"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-stone-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {conversationsLoading ? (
              <div className="p-8 text-center">
                <LoadingSpinner text="Loading conversations..." />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-700">
                    No conversations yet
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Connect with athletes, coaches, or federations to start chatting.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={handleOpenNewChat}
                  className="mx-auto"
                >
                  Start New Message
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.partnerId === activePartnerId;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv.partnerId}
                    type="button"
                    onClick={() => handleSelectConversation(conv.partnerId)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${isActive
                      ? 'bg-amber-500/10 border-l-4 border-amber-600'
                      : 'hover:bg-stone-100/70 bg-white'
                      }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={conv.partnerAvatarUrl}
                        name={conv.partnerDisplayName || conv.partnerUsername}
                        size="md"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs truncate ${hasUnread
                            ? 'font-black text-stone-900'
                            : 'font-bold text-stone-800'
                            }`}
                        >
                          {conv.partnerDisplayName || conv.partnerUsername}
                        </span>
                        <span className="text-[10px] text-stone-400 flex-shrink-0 font-medium">
                          {formatConversationDate(conv.lastMessageTimestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-stone-400 truncate">
                          @{conv.partnerUsername}
                        </span>
                        {conv.partnerRole === 'INSTITUTION' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-800 text-[9px] font-extrabold uppercase">
                            Issuer
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs truncate ${hasUnread
                          ? 'font-bold text-stone-900'
                          : 'text-stone-500'
                          }`}
                      >
                        {conv.lastMessageSenderId === currentUser?.id && (
                          <span className="text-stone-400 font-normal">You: </span>
                        )}
                        {conv.lastMessageContent}
                      </p>
                    </div>

                    {hasUnread && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-600 text-white shadow-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: Active Chat Thread ── */}
        <div
          className={`flex-1 flex flex-col bg-white ${!activePartnerId ? 'hidden md:flex' : 'flex'
            }`}
        >
          {activePartnerId && activePartner ? (
            <>
              {/* Partner Chat Header */}
              <div className="px-4 py-3 border-b border-stone-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePartnerId(null);
                      setSearchParams({});
                    }}
                    className="md:hidden p-1.5 -ml-1 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={activePartner.avatarUrl}
                      name={activePartner.displayName || activePartner.username}
                      size="sm"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold text-stone-900 leading-none">
                        {activePartner.displayName || activePartner.username}
                      </h2>
                      {activePartner.role === 'INSTITUTION' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 text-[10px] font-extrabold uppercase">
                          Official Federation
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-bold">
                          Verified Athlete
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                      @{activePartner.username}
                      {activePartner.bio ? ` • ${activePartner.bio}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile/${activePartner.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors"
                  >
                    <span>Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#FAFAF8]">
                {messagesLoading ? (
                  <div className="py-20 text-center">
                    <LoadingSpinner text="Loading message thread..." />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">
                        Start the conversation with {activePartner.displayName || activePartner.username}
                      </p>
                      <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                        Congratulate on recent tournament badges, discuss sponsor campaigns, or schedule training.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      {[
                        '🏆 Congrats on your verified badge!',
                        '🔥 Great performance this season!',
                        '🤝 Interested in collaborating on a tournament bracket?',
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setMessageText(prompt)}
                          className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-stone-600 hover:border-amber-500 hover:text-amber-900 transition-colors shadow-2xs"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = msg.isMine ?? msg.senderId === currentUser?.id;

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex gap-2.5 ${isMine ? 'justify-end' : 'justify-start'
                          }`}
                      >
                        {!isMine && (
                          <Avatar
                            src={msg.senderAvatarUrl}
                            name={msg.senderDisplayName || msg.senderUsername}
                            size="xs"
                            className="flex-shrink-0 mt-1"
                          />
                        )}

                        <div
                          className={`max-w-[80%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-xs space-y-1 ${isMine
                            ? 'bg-amber-600 text-white rounded-tr-xs'
                            : 'bg-white border border-stone-200 text-stone-900 rounded-tl-xs'
                            }`}
                        >
                          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                          </p>

                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] ${isMine ? 'text-amber-100' : 'text-stone-400'
                              }`}
                          >
                            <span>{formatMsgTime(msg.createdAt)}</span>
                            {isMine && (
                              <span>
                                {msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-amber-400" title="Read" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-stone-400" title="Delivered" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-stone-200 bg-white"
              >
                <div className="flex items-end gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-300 focus-within:ring-2 focus-within:ring-stone-400 focus-within:border-transparent transition-all">
                  <textarea
                    rows={1}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${activePartner.displayName || activePartner.username}... (Press Enter to send)`}
                    className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-stone-900 placeholder-stone-400 resize-none focus:outline-none max-h-32"
                  />

                  <Button
                    type="submit"
                    variant="dark"
                    size="sm"
                    icon={Send}
                    loading={sending}
                    disabled={!messageText.trim()}
                    className="rounded-xl px-4 py-2 flex-shrink-0"
                  >
                    Send
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* Empty State when no conversation is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-stone-50/40">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h2 className="text-base font-extrabold text-stone-900">
                  Select a Conversation
                </h2>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Choose an active athlete or federation from the left panel, or start a new direct message thread.
                </p>
              </div>
              <Button
                variant="dark"
                size="sm"
                icon={Plus}
                onClick={handleOpenNewChat}
              >
                Start New Chat
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── NEW CHAT MODAL ── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-lg p-0 overflow-hidden shadow-2xl bg-white">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-sm text-stone-900">
                  Start Direct Message
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-stone-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search athletes, coaches, institutions..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>
            </div>

            {/* User Directory List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 p-1">
              {directoryLoading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner text="Searching athletes..." />
                </div>
              ) : filteredDirectory.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  No matching athletes found.
                </div>
              ) : (
                filteredDirectory.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setShowNewChatModal(false);
                      handleSelectConversation(user.id);
                    }}
                    className="w-full p-3 text-left flex items-center justify-between hover:bg-amber-500/10 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={user.avatarUrl}
                        name={user.displayName || user.username}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {user.displayName || user.username}
                          </p>
                          {user.role === 'INSTITUTION' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-800 text-[9px] font-extrabold uppercase">
                              Federation
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[9px] font-bold">
                              Athlete
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 truncate">
                          @{user.username}
                          {user.bio ? ` • ${user.bio}` : ''}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      Chat →
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
