import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Plus, 
  UserCheck, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  Users, 
  Trash2, 
  History, 
  Layers, 
  RefreshCw,
  X,
  User,
  AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import BadgeDisplay from '../components/badges/BadgeDisplay';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  create as createBadge, 
  assignToUser, 
  assignBulk,
  revokeBadge,
  getAll as getAllBadges, 
  getAllAwardedBadges 
} from '../api/badgesApi';
import { getAllUsers } from '../api/usersApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/formatters';

export default function BadgesManagePage({ institutionId: propInstitutionId }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();
  const institutionId = propInstitutionId || currentUser?.institutionId || currentUser?.id;

  // Active top tab: 'badges' | 'assign' | 'bulk' | 'registry' | 'create'
  const [activeTab, setActiveTab] = useState('assign');

  // Master Lists
  const [badges, setBadges] = useState([]);
  const [awardedList, setAwardedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRegistry, setLoadingRegistry] = useState(false);

  // New badge form state
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    rank: 1,
    category: '',
    description: '',
    iconUrl: '',
  });
  const [creatingBadge, setCreatingBadge] = useState(false);

  // Dynamic Single Athlete Search & Assignment State
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [assigning, setAssigning] = useState(false);

  // Bulk Assignment State
  const [bulkBadgeId, setBulkBadgeId] = useState('');
  const [bulkRawInput, setBulkRawInput] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Registry Search & Filter State
  const [registrySearch, setRegistrySearch] = useState('');
  const [revokingId, setRevokingId] = useState(null);

  // Load Badges & Registry
  const loadBadges = useCallback(async () => {
    try {
      const res = await getAllBadges();
      setBadges(res.data || []);
      if (!selectedBadgeId && res.data?.length > 0) {
        setSelectedBadgeId(String(res.data[0].id));
      }
      if (!bulkBadgeId && res.data?.length > 0) {
        setBulkBadgeId(String(res.data[0].id));
      }
    } catch (err) {
      console.warn('Failed to fetch badges:', err.message);
      setBadges([]);
    }
  }, [selectedBadgeId, bulkBadgeId]);

  const loadRegistry = useCallback(async () => {
    setLoadingRegistry(true);
    try {
      const res = await getAllAwardedBadges();
      setAwardedList(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch awarded badges:', err.message);
      setAwardedList([]);
    } finally {
      setLoadingRegistry(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadBadges(), loadRegistry()]).finally(() => setLoading(false));
  }, []);

  // Debounced live user search for millions of users
  useEffect(() => {
    if (!recipientQuery.trim() || selectedAthlete) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await getAllUsers(recipientQuery.trim());
        const athletes = (res.data || []).filter(u => u.role === 'USER' || !u.role);
        setSearchResults(athletes);
      } catch (err) {
        console.warn('User search error:', err.message);
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [recipientQuery, selectedAthlete]);

  // Handle Create Badge
  const handleCreateBadge = async (e) => {
    e.preventDefault();
    if (!badgeForm.name.trim()) {
      showToast('Badge name is required', 'error');
      return;
    }

    setCreatingBadge(true);
    try {
      const payload = {
        name: badgeForm.name.trim(),
        rank: Number(badgeForm.rank),
        category: badgeForm.category.trim() || 'General',
        description: badgeForm.description.trim() || null,
        iconUrl: badgeForm.iconUrl.trim() || null,
        institutionId,
      };

      const res = await createBadge(payload);
      const newBadge = res.data || { ...payload, id: Date.now() };
      setBadges((prev) => [newBadge, ...prev]);
      setSelectedBadgeId(String(newBadge.id));
      showToast(`Badge "${badgeForm.name}" created and ready for award!`, 'success');
      setBadgeForm({ name: '', rank: 1, category: '', description: '', iconUrl: '' });
      setActiveTab('assign');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to create badge', 'error');
    } finally {
      setCreatingBadge(false);
    }
  };

  // Handle Single Athlete Assignment
  const handleAssignBadge = async (e) => {
    e.preventDefault();
    if (!selectedBadgeId) {
      showToast('Please select a badge to award', 'error');
      return;
    }

    const recipientIdentifier = selectedAthlete?.id 
      ? { userId: selectedAthlete.id }
      : recipientQuery.trim().includes('@') && recipientQuery.trim().includes('.')
      ? { userEmail: recipientQuery.trim() }
      : { username: recipientQuery.trim().replace(/^@/, '') };

    if (!recipientIdentifier.userId && !recipientIdentifier.username && !recipientIdentifier.userEmail) {
      showToast('Please specify a recipient athlete username, email, or ID', 'error');
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        badgeId: Number(selectedBadgeId),
        ...recipientIdentifier,
        institutionId: currentUser?.institutionId || propInstitutionId || null,
      };

      const res = await assignToUser(payload);
      const recipientName = selectedAthlete?.displayName || selectedAthlete?.username || recipientQuery;
      showToast(`Badge awarded to ${recipientName}! Verified on their public profile & feed.`, 'success');

      // Reset selection and refresh registry
      setSelectedAthlete(null);
      setRecipientQuery('');
      setSearchResults([]);
      await loadRegistry();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to assign badge', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // Handle Bulk Badge Assignment
  const handleBulkAssign = async (e) => {
    e.preventDefault();
    if (!bulkBadgeId) {
      showToast('Please select a badge to bulk award', 'error');
      return;
    }

    if (!bulkRawInput.trim()) {
      showToast('Please enter at least one athlete username or email', 'error');
      return;
    }

    // Parse tokens by commas, spaces, or newlines
    const tokens = bulkRawInput
      .split(/[\n,;]+/)
      .map(t => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      showToast('No valid athlete identifiers found', 'error');
      return;
    }

    const emails = [];
    const usernames = [];
    const userIds = [];

    tokens.forEach(tok => {
      if (tok.includes('@') && tok.includes('.')) {
        emails.push(tok);
      } else if (/^\d+$/.test(tok)) {
        userIds.push(Number(tok));
      } else {
        usernames.push(tok.replace(/^@/, ''));
      }
    });

    setBulkSubmitting(true);
    setBulkResult(null);

    try {
      const payload = {
        badgeId: Number(bulkBadgeId),
        institutionId: currentUser?.institutionId || propInstitutionId || null,
        userIds: userIds.length > 0 ? userIds : null,
        usernames: usernames.length > 0 ? usernames : null,
        emails: emails.length > 0 ? emails : null,
      };

      const res = await assignBulk(payload);
      setBulkResult(res.data);
      showToast(`Bulk award complete: ${res.data.assignedCount} badges granted!`, 'success');
      setBulkRawInput('');
      await loadRegistry();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Bulk assignment failed', 'error');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Handle Revoke Badge
  const handleRevokeBadge = async (userBadgeId, athleteName) => {
    if (!window.confirm(`Are you sure you want to revoke this badge from ${athleteName}?`)) {
      return;
    }

    setRevokingId(userBadgeId);
    try {
      await revokeBadge(userBadgeId);
      showToast(`Badge revoked from ${athleteName}.`, 'info');
      setAwardedList(prev => prev.filter(item => item.id !== userBadgeId));
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to revoke badge', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  // Filtered Registry
  const filteredRegistry = useMemo(() => {
    if (!registrySearch.trim()) return awardedList;
    const q = registrySearch.toLowerCase();
    return awardedList.filter(item => {
      const uName = (item.userDisplayName || item.username || '').toLowerCase();
      const bName = (item.badge?.name || '').toLowerCase();
      const cat = (item.badge?.category || '').toLowerCase();
      return uName.includes(q) || bName.includes(q) || cat.includes(q);
    });
  }, [awardedList, registrySearch]);

  const selectedBadgeObj = useMemo(() => {
    return badges.find(b => String(b.id) === String(selectedBadgeId)) || badges[0] || null;
  }, [badges, selectedBadgeId]);

  if (!isInstitution) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-black text-stone-900">Institution Verification Required</h2>
        <p className="text-xs text-stone-500">
          Only verified organizations and academies can create and award competition rank badges.
        </p>
        <Button variant="primary" onClick={() => navigate('/feed')}>Return to Feed</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* ── 1. HEADER & SUMMARY METRICS ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Award & Manage Badges
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Issue verified achievement badges to individual athletes or entire rosters at scale.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200/90 text-xs font-mono font-bold text-stone-700 shadow-2xs">
            <span className="text-stone-400 font-normal">Badges:</span> {badges.length}
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-mono font-bold text-amber-900 shadow-2xs">
            <span className="text-amber-700 font-normal">Awarded:</span> {awardedList.length}
          </div>
        </div>
      </div>

      {/* ── 2. SEGMENTED NAVIGATION TABS ── */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200 overflow-x-auto">
        {[
          { key: 'assign', label: 'Award to Athlete', icon: UserCheck },
          { key: 'bulk', label: 'Bulk Award Roster', icon: Layers },
          { key: 'registry', label: `Awarded Registry (${awardedList.length})`, icon: History },
          { key: 'badges', label: `All Badges (${badges.length})`, icon: Award },
          { key: 'create', label: 'Create New Badge', icon: Plus },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-stone-900 shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. TAB 1: DYNAMIC SINGLE ATHLETE ASSIGNMENT (SCALES TO MILLIONS) ── */}
      {activeTab === 'assign' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Assignment Form */}
          <Card className="md:col-span-2 p-6 bg-white border border-stone-200/90 rounded-3xl space-y-5 shadow-2xs">
            <div>
              <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>Award Badge to Athlete</span>
              </h2>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Search dynamically by username, full name, or email. The badge will instantly appear on their profile and rotate 1:1 on their social posts.
              </p>
            </div>

            <form onSubmit={handleAssignBadge} className="space-y-4">
              
              {/* 1. Select Badge */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  1. Select Badge
                </label>
                {badges.length > 0 ? (
                  <select
                    value={selectedBadgeId}
                    onChange={(e) => setSelectedBadgeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    required
                  >
                    {badges.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — Rank #{b.rank} ({b.category || 'General'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span>No badges created yet. Create a badge first.</span>
                    <Button size="xs" variant="primary" onClick={() => setActiveTab('create')}>
                      Create Badge
                    </Button>
                  </div>
                )}
              </div>

              {/* 2. Recipient Athlete Search & Autocomplete */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  2. Recipient Athlete
                </label>

                {selectedAthlete ? (
                  /* Selected Athlete Pill */
                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={selectedAthlete.avatarUrl}
                        name={selectedAthlete.displayName || selectedAthlete.username}
                        size="md"
                      />
                      <div>
                        <div className="text-xs font-black text-stone-900">
                          {selectedAthlete.displayName || selectedAthlete.username}
                        </div>
                        <div className="text-[11px] font-mono text-amber-800">
                          @{selectedAthlete.username} • Athlete #{selectedAthlete.id}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAthlete(null);
                        setRecipientQuery('');
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-amber-100/60"
                      title="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Live Search Input */
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={recipientQuery}
                        onChange={(e) => setRecipientQuery(e.target.value)}
                        placeholder="Search athlete by @username, name, or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                        required
                      />
                      {searchingUsers && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          <RefreshCw className="w-3.5 h-3.5 text-stone-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {searchResults.length > 0 && !selectedAthlete && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-stone-200 shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-stone-100">
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedAthlete(u);
                              setRecipientQuery(u.username);
                              setSearchResults([]);
                            }}
                            className="p-2.5 hover:bg-amber-50/60 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar src={u.avatarUrl} name={u.displayName || u.username} size="sm" />
                              <div className="truncate">
                                <div className="text-xs font-bold text-stone-900 truncate">
                                  {u.displayName || u.username}
                                </div>
                                <div className="text-[10px] font-mono text-stone-400 truncate">
                                  @{u.username}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  icon={UserCheck}
                  loading={assigning}
                  disabled={!selectedBadgeId || (!selectedAthlete && !recipientQuery.trim())}
                  className="w-full justify-center font-black shadow-xs"
                >
                  Confirm & Award Badge
                </Button>
              </div>

            </form>
          </Card>

          {/* Right Col: Live Preview */}
          <div className="space-y-4">
            <div className="p-5 bg-stone-50/70 border border-stone-200/90 rounded-3xl space-y-4">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Live Badge Preview
              </h3>
              {selectedBadgeObj ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center p-6 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
                    <BadgeDisplay badge={selectedBadgeObj} />
                  </div>
                  <div className="text-xs text-stone-600 font-medium space-y-1">
                    <div><strong>Title:</strong> {selectedBadgeObj.name}</div>
                    <div><strong>Rank:</strong> #{selectedBadgeObj.rank} ({selectedBadgeObj.rankDisplay || 'Podium Honor'})</div>
                    <div><strong>Category:</strong> {selectedBadgeObj.category || 'General Sports'}</div>
                    {selectedBadgeObj.description && (
                      <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60 leading-relaxed">
                        {selectedBadgeObj.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-400 text-center py-6">
                  Select or create a badge to preview
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Duplicates:</strong> If the athlete already holds this verified badge, the system safely recognizes their existing honor without duplicate clutter.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ── 4. TAB 2: BULK ROSTER AWARD (PASTE FROM SPREADSHEET / ROSTERS) ── */}
      {activeTab === 'bulk' && (
        <Card className="max-w-2xl mx-auto p-6 bg-white border border-stone-200/90 rounded-3xl space-y-5 shadow-2xs">
          <div>
            <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Bulk Award to Entire Roster</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Award a competition badge to 10, 50, or hundreds of athletes at once. Paste athlete usernames or emails separated by commas or newlines.
            </p>
          </div>

          <form onSubmit={handleBulkAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Badge to Grant
              </label>
              <select
                value={bulkBadgeId}
                onChange={(e) => setBulkBadgeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                required
              >
                {badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — Rank #{b.rank} ({b.category || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Athlete Usernames or Emails (One per line or comma-separated)
              </label>
              <textarea
                value={bulkRawInput}
                onChange={(e) => setBulkRawInput(e.target.value)}
                placeholder="e.g.&#10;@indrajeet&#10;marcus_vance&#10;sarah_chen&#10;rohit@athlete.org"
                rows={6}
                className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="md"
              icon={Layers}
              loading={bulkSubmitting}
              className="w-full justify-center font-black shadow-xs"
            >
              Batch Grant Badges
            </Button>
          </form>

          {/* Bulk Results Summary */}
          {bulkResult && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-black text-stone-900">
                <span>Bulk Award Results:</span>
                <span className="text-emerald-700">Badge: {bulkResult.badgeName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                  ✓ {bulkResult.assignedCount} Badges Awarded
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                  ℹ {bulkResult.skippedCount} Existing Skipped
                </div>
              </div>
              {bulkResult.notFoundIdentifiers?.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                  <strong>Unmatched ({bulkResult.notFoundIdentifiers.length}):</strong>{' '}
                  {bulkResult.notFoundIdentifiers.join(', ')}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── 5. TAB 3: AWARDED BADGES REGISTRY & REVOCATION ── */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          
          {/* Registry Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={registrySearch}
                onChange={(e) => setRegistrySearch(e.target.value)}
                placeholder="Filter by athlete name, username, or badge..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <Button
              size="xs"
              variant="secondary"
              icon={RefreshCw}
              onClick={loadRegistry}
              loading={loadingRegistry}
              className="font-bold text-xs"
            >
              Refresh Registry
            </Button>
          </div>

          {/* Registry Items Grid */}
          {loadingRegistry ? (
            <LoadingSpinner text="Loading awarded badge registry..." className="py-16" />
          ) : filteredRegistry.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200/90 space-y-2">
              <Award className="w-10 h-10 text-stone-300 mx-auto" />
              <div className="text-sm font-bold text-stone-700">No Awarded Badges Found</div>
              <p className="text-xs text-stone-400">
                {registrySearch ? 'No awarded honors matched your filter query.' : 'No badges have been awarded to athletes yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredRegistry.map((item) => {
                const athleteName = item.userDisplayName || item.username || `Athlete #${item.userId}`;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={item.userAvatarUrl} name={athleteName} size="sm" />
                        <div className="truncate">
                          <div className="text-xs font-black text-stone-900 truncate">{athleteName}</div>
                          <div className="text-[10px] font-mono text-stone-400 truncate">@{item.username || 'user'}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeBadge(item.id, athleteName)}
                        disabled={revokingId === item.id}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Revoke badge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <BadgeDisplay badge={item.badge} size="sm" />
                      <span className="text-[10px] font-mono text-stone-400">
                        {item.awardedAt ? timeAgo(item.awardedAt) : 'Recently'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ── 6. TAB 4: ALL CREATED BADGES ── */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-stone-900 tracking-tight">
              Platform & Institution Badges
            </h2>
            <Button
              size="xs"
              variant="gold"
              icon={Plus}
              onClick={() => setActiveTab('create')}
              className="font-bold text-xs"
            >
              New Badge
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((b) => (
              <Card key={b.id} className="p-4 space-y-3 flex flex-col justify-between bg-white border border-stone-200/90 rounded-2xl shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <BadgeDisplay badge={b} />
                    <span className="text-[10px] font-mono font-bold text-stone-400">
                      #{b.id}
                    </span>
                  </div>
                  {b.description && (
                    <p className="text-xs text-stone-600 font-medium leading-relaxed">
                      {b.description}
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Category: <strong className="text-stone-700">{b.category || 'General'}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBadgeId(String(b.id));
                      setActiveTab('assign');
                    }}
                    className="text-amber-700 font-bold hover:underline"
                  >
                    Award &rarr;
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. TAB 5: CREATE NEW BADGE FORM ── */}
      {activeTab === 'create' && (
        <Card className="max-w-xl mx-auto p-6 bg-white border border-stone-200/90 rounded-3xl space-y-5 shadow-2xs">
          <div>
            <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Create Competition Badge</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Define a new verified achievement badge for your tournaments and competitive honors.
            </p>
          </div>

          <form onSubmit={handleCreateBadge} className="space-y-4">
            <Input
              label="Badge Title"
              placeholder="e.g. State Sprint Champion, National MVP, Top Scorer"
              value={badgeForm.name}
              onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Podium Rank
                </label>
                <select
                  value={badgeForm.rank}
                  onChange={(e) => setBadgeForm({ ...badgeForm, rank: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  <option value={1}>Rank 1 (Gold Medalist / 1st Place)</option>
                  <option value={2}>Rank 2 (Silver Medalist / 2nd Place)</option>
                  <option value={3}>Rank 3 (Bronze Medalist / 3rd Place)</option>
                  <option value={4}>Rank 4 (Finalist Honor)</option>
                  <option value={5}>Rank 5 (Participant Honor)</option>
                </select>
              </div>

              <Input
                label="Sport / Category"
                placeholder="e.g. Athletics, Football, Badminton"
                value={badgeForm.category}
                onChange={(e) => setBadgeForm({ ...badgeForm, category: e.target.value })}
              />
            </div>

            <TextArea
              label="Criteria & Description"
              placeholder="Achievement requirements to earn this verified badge..."
              value={badgeForm.description}
              onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
              rows={2}
            />

            {/* Live Preview Before Create */}
            {badgeForm.name.trim() && (
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Preview:</span>
                <div className="flex items-center justify-center p-2">
                  <BadgeDisplay
                    badge={{
                      name: badgeForm.name,
                      rank: badgeForm.rank,
                      category: badgeForm.category || 'Sports',
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="gold"
              size="md"
              icon={Plus}
              loading={creatingBadge}
              className="w-full justify-center font-black shadow-xs"
            >
              Publish & Save Badge
            </Button>
          </form>
        </Card>
      )}

    </div>
  );
}
