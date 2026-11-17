import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, UserCheck, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import BadgeDisplay from '../components/badges/BadgeDisplay';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { create as createBadge, assignToUser, getAll as getAllBadges } from '../api/badgesApi';
import { getAllUsers } from '../api/usersApi';
import { BADGE_RANKS } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function BadgesManagePage({ institutionId: propInstitutionId }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();
  const institutionId = propInstitutionId || currentUser?.institutionId || currentUser?.id;

  const [badges, setBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authKey, setAuthKey] = useState('');

  // New badge form state
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    rank: 1,
    category: '',
    description: '',
    iconUrl: '',
  });
  const [creatingBadge, setCreatingBadge] = useState(false);

  // Assign badge form state
  const [assignForm, setAssignForm] = useState({
    badgeId: '',
    userId: '',
    username: '',
  });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllBadges().catch(() => ({ data: [] })),
      getAllUsers().catch(() => ({ data: [] }))
    ])
      .then(([badgesRes, usersRes]) => {
        setBadges(badgesRes.data || []);
        // Filter users to regular athletes/creators
        const athletes = (usersRes.data || []).filter(u => u.role === 'USER' || !u.role);
        setUsers(athletes);
      })
      .catch((err) => {
        console.warn('Data fetch notice:', err.message);
        setBadges([]);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    if (!badgeForm.name.trim()) {
      showToast('Badge name is required', 'error');
      return;
    }

    setCreatingBadge(true);
    try {
      const payload = {
        ...badgeForm,
        rank: Number(badgeForm.rank),
        institutionId,
      };
      const res = await createBadge(payload);
      const newBadge = res.data || { ...payload, id: Date.now() };
      setBadges((prev) => [newBadge, ...prev]);
      showToast('Badge created successfully!', 'success');
      setBadgeForm({ name: '', rank: 1, category: '', description: '', iconUrl: '' });
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to create badge', 'error');
    } finally {
      setCreatingBadge(false);
    }
  };

  const handleAssignBadge = async (e) => {
    e.preventDefault();
    if (!assignForm.badgeId) {
      showToast('Please select a badge to assign', 'error');
      return;
    }
    if (!assignForm.userId) {
      showToast('Please select a recipient athlete', 'error');
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        badgeId: Number(assignForm.badgeId),
        userId: Number(assignForm.userId),
        institutionId: currentUser?.institutionId || propInstitutionId || null,
      };

      await assignToUser(payload);
      showToast('Badge assigned to athlete successfully!', 'success');
      setAssignForm({ badgeId: '', userId: '', username: '' });
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to assign badge', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const tabs = [
    {
      label: `All Badges (${badges.length})`,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <Card key={badge.id} className="p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <BadgeDisplay badge={badge} />
                  <span className="text-[11px] font-mono font-bold text-gray-400">
                    Rank #{badge.rank}
                  </span>
                </div>
                {badge.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {badge.description}
                  </p>
                )}
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-400">
                Category: <strong className="text-gray-600 dark:text-gray-300">{badge.category || 'General'}</strong>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      label: 'Create New Badge',
      content: (
        <Card className="max-w-xl mx-auto p-6">
          <form onSubmit={handleCreateBadge} className="space-y-4">
            <Input
              label="Badge Name"
              placeholder="e.g. Full Stack Pioneer"
              value={badgeForm.name}
              onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rank (1 - 3)
                </label>
                <select
                  value={badgeForm.rank}
                  onChange={(e) => setBadgeForm({ ...badgeForm, rank: Number(e.target.value) })}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Rank 1 (Gold Honor)</option>
                  <option value={2}>Rank 2 (Silver Honor)</option>
                  <option value={3}>Rank 3 (Bronze Honor)</option>
                </select>
              </div>

              <Input
                label="Category"
                placeholder="e.g. Sports, Coding, Design"
                value={badgeForm.category}
                onChange={(e) => setBadgeForm({ ...badgeForm, category: e.target.value })}
              />
            </div>

            <Input
              label="Icon / Image URL (Optional)"
              placeholder="https://..."
              value={badgeForm.iconUrl}
              onChange={(e) => setBadgeForm({ ...badgeForm, iconUrl: e.target.value })}
            />

            <TextArea
              label="Badge Description"
              placeholder="Criteria for earning this achievement badge..."
              value={badgeForm.description}
              onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
              rows={2}
            />

            <Button
              type="submit"
              variant="primary"
              loading={creatingBadge}
              className="w-full"
            >
              Create Badge
            </Button>
          </form>
        </Card>
      ),
    },
    {
      label: 'Assign Badge to Athlete',
      content: (
        <Card className="max-w-xl mx-auto p-6">
          <form onSubmit={handleAssignBadge} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Badge
              </label>
              <select
                value={assignForm.badgeId}
                onChange={(e) => setAssignForm({ ...assignForm, badgeId: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose a badge to award --</option>
                {badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Rank #{b.rank} - {b.category || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Athlete / Recipient
              </label>
              {users.length > 0 ? (
                <select
                  value={assignForm.userId}
                  onChange={(e) => {
                    const sel = users.find(u => String(u.id) === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      userId: e.target.value,
                      username: sel?.username || ''
                    });
                  }}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choose an athlete --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || u.username} (@{u.username}) — Athlete #{u.id}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  label="Athlete ID"
                  placeholder="e.g. 2"
                  type="number"
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  required
                />
              )}
            </div>

            {assignForm.userId && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  Awarding to athlete <strong>{assignForm.username || `User #${assignForm.userId}`}</strong>. This badge will be publicly verified on their profile and social feed.
                </span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={assigning}
              icon={UserCheck}
              className="w-full"
            >
              Confirm & Award Badge
            </Button>
          </form>
        </Card>
      ),
    },
  ];

  if (!isInstitution) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <Card className="p-8 sm:p-10 border border-stone-200/90 shadow-2xl text-center space-y-6 bg-white">
          <div className="w-16 h-16 rounded-3xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <span>Restricted Access</span>
            </div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Institution Badge Authority
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              Awarding verified competition badges (e.g. Game City #Rank 1-3) is reserved strictly for authorized institutions and tournament organizers.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="dark"
              size="lg"
              className="w-full shadow-lg"
              onClick={() => navigate('/login', { state: { mode: 'institution' } })}
            >
              Sign In via Institution Gateway →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            <span>Badge Issuance & Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create multi-tier ranking badges and award them to community participants
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
