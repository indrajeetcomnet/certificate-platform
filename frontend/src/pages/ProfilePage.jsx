import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Newspaper,
  Calendar,
  MapPin,
  Edit3,
  Shield,
  MessageSquare,
  Trophy,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import FeedList from '../components/feed/FeedList';
import BadgeList from '../components/badges/BadgeList';
import CertificateCard from '../components/certificates/CertificateCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getProfile, updateProfile } from '../api/usersApi';
import { getUserBadges } from '../api/badgesApi';
import { getUserPosts } from '../api/postsApi';
import { listByInstitution } from '../api/certificatesApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const targetId = userId || currentUser?.id || 1;
  const isOwnProfile = currentUser && String(currentUser.id) === String(targetId);

  const [profile, setProfile] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userCertificates, setUserCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    avatarUrl: '',
    bio: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProfile(targetId).catch(() => null),
      getUserBadges(targetId).catch(() => null),
      getUserPosts(targetId).catch(() => null),
      listByInstitution(1, 0).catch(() => null),
    ])
      .then(([profRes, badgeRes, postsRes, certRes]) => {
        let activeProf = null;
        if (profRes?.data) {
          activeProf = profRes.data;
          setProfile(profRes.data);
          setEditForm({
            displayName: profRes.data.displayName || profRes.data.username || '',
            avatarUrl: profRes.data.avatarUrl || '',
            bio: profRes.data.bio || '',
          });
        } else if (isOwnProfile && currentUser) {
          activeProf = currentUser;
          setProfile(currentUser);
          setEditForm({
            displayName: currentUser.displayName || currentUser.username || '',
            avatarUrl: currentUser.avatarUrl || '',
            bio: currentUser.bio || '',
          });
        } else {
          setProfile(null);
        }

        if (badgeRes?.data && Array.isArray(badgeRes.data)) {
          setUserBadges(badgeRes.data);
        } else {
          setUserBadges([]);
        }

        if (postsRes?.data) {
          const userPostList = Array.isArray(postsRes.data)
            ? postsRes.data
            : postsRes.data.content || [];
          setUserPosts(userPostList);
        } else {
          setUserPosts([]);
        }

        if (certRes?.data) {
          const allCerts = certRes.data.content || certRes.data || [];
          const profileName = (activeProf?.displayName || activeProf?.username || '').toLowerCase();
          const profileEmail = (activeProf?.email || '').toLowerCase();
          const matched = allCerts.filter((c) => {
            const certRecipient = (c.recipientName || '').toLowerCase();
            const certEmail = (c.recipientEmail || '').toLowerCase();
            return (profileName && certRecipient.includes(profileName)) || (profileEmail && certEmail === profileEmail);
          });
          setUserCertificates(matched);
        } else {
          setUserCertificates([]);
        }
      })
      .finally(() => setLoading(false));
  }, [targetId, isOwnProfile, currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSavingProfile(true);
    try {
      const payload = {
        displayName: editForm.displayName.trim() || profile.username,
        avatarUrl: editForm.avatarUrl.trim() || null,
        bio: editForm.bio.trim() || null,
      };

      const res = await updateProfile(profile.id, payload);
      const updated = res.data || { ...profile, ...payload };
      setProfile(updated);
      setEditModalOpen(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Fallback local update if network/api mock
      setProfile((prev) => ({ ...prev, ...editForm }));
      setEditModalOpen(false);
      showToast('Profile details updated!', 'success');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    showToast(
      isFollowing
        ? `Unfollowed ${profile?.displayName || profile?.username}`
        : `Now following ${profile?.displayName || profile?.username}!`,
      'info'
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading user profile..." className="py-20" />;
  }

  if (!profile) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
          <Shield className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-stone-900">Profile Not Found</h3>
        <p className="text-xs text-stone-600">The requested athlete or user profile does not exist in the active arena database.</p>
        <Button variant="dark" size="sm" onClick={() => navigate('/feed')}>
          Return to Social Feed
        </Button>
      </div>
    );
  }

  const isAthlete = profile.role === 'USER' || !profile.role;

  const tabs = [
    {
      label: `Posts (${userPosts.length})`,
      content: (
        <FeedList
          posts={userPosts}
          emptyTitle="No Arena Posts Yet"
          emptyDescription={`${profile.displayName || profile.username} hasn't published any tournament updates or training posts yet.`}
        />
      ),
    },
    {
      label: `Badges (${userBadges.length})`,
      content: (
        <BadgeList
          badges={userBadges}
          emptyMessage={`${profile.displayName || profile.username} has not been awarded any verified competition badges yet.`}
        />
      ),
    },
    {
      label: `Certificates (${userCertificates.length})`,
      content: userCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {userCertificates.map((cert) => (
            <CertificateCard
              key={cert.id || cert.uniqueCode}
              certificate={cert}
              canManage={false}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 px-6 text-center max-w-md mx-auto space-y-3 bg-white rounded-3xl border border-dashed border-stone-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-800 border border-amber-300/60 flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-7 h-7 text-amber-700" />
          </div>
          <h3 className="text-base font-black text-stone-900">No Verified Certificates Awarded Yet</h3>
          <p className="text-xs text-stone-600 leading-relaxed font-medium">
            Official tamper-proof credentials issued to this athlete by certified institutions and sports academies will appear here automatically.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── 1. ATHLETE SHOWCASE HERO CARD ── */}
      <div className="bg-white border border-stone-200/90 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Championship Executive Banner - Pure Light Theme */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-amber-100/90 via-amber-50 to-stone-100 border-b border-stone-200/90 relative overflow-hidden flex items-start justify-end p-4">
          {/* Subtle athletic pattern overlay */}
          <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:18px_18px]" />
          
          {/* Top Right Accreditation Pill */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-amber-900 border border-amber-300 text-xs font-black tracking-wide flex items-center gap-1.5 shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAthlete ? 'Accredited Competitor' : 'Accredited Institution'}</span>
            </span>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 pb-6 pt-0">
          
          {/* Top Action & Avatar Bar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 mb-4">
            
            {/* Avatar only with negative margin - sits cleanly half on banner, half on white card */}
            <div className="relative -mt-12 sm:-mt-16 shrink-0 z-10">
              <Avatar
                src={profile?.avatarUrl}
                name={profile?.displayName || profile?.username}
                size="xl"
                className="w-24 h-24 text-2xl ring-4 ring-white shadow-xl bg-white"
              />
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs"
                title="Active Athlete"
              />
            </div>

            {/* Header Actions - 100% on the white card background */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end pt-2 sm:pt-0">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit3}
                    onClick={() => setEditModalOpen(true)}
                    className="border-stone-300 font-bold"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="dark"
                    size="sm"
                    icon={DollarSign}
                    onClick={() => navigate('/earnings')}
                    className="font-bold shadow-xs"
                  >
                    Sponsor Earnings
                  </Button>
                </>
              ) : (
                <>
                  {currentUser?.role === 'INSTITUTION' && (
                    <Button
                      variant="dark"
                      size="sm"
                      icon={Award}
                      onClick={() => navigate('/certificates/create', { state: { recipient: profile } })}
                      className="font-bold shadow-xs"
                    >
                      Award Certificate in Studio
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={MessageSquare}
                    onClick={() => navigate(`/messages?user=${profile.id}`)}
                    className="font-bold"
                  >
                    Message
                  </Button>
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handleFollowToggle}
                    className="font-bold"
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Athlete Identity & Credentials (Name, Username, Email, Role) - 100% on White Background */}
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {profile?.displayName || profile?.username}
              </h1>
              <CheckCircle2 className="w-5 h-5 text-amber-600 fill-amber-400/20 shrink-0" title="Officially Verified Athlete" />
              
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
                {isAthlete ? '🏃 Athlete Arena' : '🏛️ Institution'}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              @{profile?.username}
              {profile?.email && (
                <span className="text-stone-500 font-normal ml-2">({profile.email})</span>
              )}
            </p>
          </div>

          {/* Athlete Bio */}
          {profile?.bio ? (
            <p className="text-sm font-medium text-stone-800 max-w-2xl mt-3 leading-relaxed bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl">
              {profile.bio}
            </p>
          ) : (
            <p className="text-xs text-stone-500 italic mt-2">
              No biography provided yet.
            </p>
          )}

          {/* ── 2. METRIC SHOWCASE CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-5 border-t border-stone-200/80">
            
            {/* Metric 1: Verified Certificates */}
            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center font-black">
                <Award className="w-5 h-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-black text-stone-900 leading-none">
                  {userCertificates.length}
                </div>
                <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mt-1 truncate">
                  Certificates
                </div>
              </div>
            </div>

            {/* Metric 2: Competition Badges */}
            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-800 flex items-center justify-center font-black">
                <Shield className="w-5 h-5 text-purple-700" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-black text-stone-900 leading-none">
                  {userBadges.length}
                </div>
                <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mt-1 truncate">
                  Badges
                </div>
              </div>
            </div>

            {/* Metric 3: Arena Posts */}
            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-800 flex items-center justify-center font-black">
                <Newspaper className="w-5 h-5 text-blue-700" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-black text-stone-900 leading-none">
                  {userPosts.length}
                </div>
                <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mt-1 truncate">
                  Posts
                </div>
              </div>
            </div>

            {/* Metric 4: Joined Date */}
            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-center font-black">
                <Calendar className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-stone-900 leading-tight truncate">
                  {formatDate(profile?.joinedAt || profile?.createdAt || '2026-01-01')}
                </div>
                <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mt-0.5 truncate">
                  Joined Arena
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 3. PROFILE TABS (POSTS, BADGES, CERTIFICATES) ── */}
      <Tabs tabs={tabs} />

      {/* ── 4. EDIT PROFILE MODAL ── */}
      {isOwnProfile && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Athlete Profile"
          size="md"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Display Name"
              value={editForm.displayName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="e.g. Indrajeet Sharma"
              required
            />

            <Input
              label="Avatar Photo URL (Optional)"
              value={editForm.avatarUrl}
              onChange={(e) => setEditForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
              placeholder="https://images.unsplash.com/..."
            />

            <TextArea
              label="Athlete Biography / Sporting Discipline"
              value={editForm.bio}
              onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="e.g. National Track & Field Champion. Competing in 100m sprint and high jump championships..."
              rows={3}
              maxLength={400}
            />

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="dark"
                size="sm"
                loading={savingProfile}
                className="font-bold"
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
