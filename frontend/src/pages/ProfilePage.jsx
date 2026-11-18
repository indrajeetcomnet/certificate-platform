import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  Upload,
  Loader2,
  Trash2,
  User as UserIcon,
  GraduationCap,
  Sparkles,
  UserPlus,
  ExternalLink,
  ChevronRight,
  Search,
  Check
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
import { getProfile, updateProfile, addMentorCredit, removeMentorCredit, getAllUsers } from '../api/usersApi';
import { uploadImage } from '../api/mediaApi';
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
  const { currentUser, updateCurrentUser } = useAuth();
  const targetId = userId || currentUser?.id || 1;
  const isOwnProfile = currentUser && String(currentUser.id) === String(targetId);

  const fileInputRef = useRef(null);
  const modalFileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userCertificates, setUserCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    avatarUrl: '',
    bio: '',
  });

  // Coach / Mentor Credit State
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [coachRoleTitle, setCoachRoleTitle] = useState('Strength & Performance Coach');
  const [savingCredit, setSavingCredit] = useState(false);
  const [removingCredit, setRemovingCredit] = useState(false);

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

  // Handle native file upload for avatar
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, GIF)', 'error');
      return;
    }

    const activeUserId = currentUser?.id || profile?.id;
    if (!activeUserId) {
      showToast('You must be logged in to update your profile picture', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      // 1. Upload file to server media repository
      const uploadRes = await uploadImage(file);
      const newAvatarUrl = uploadRes?.url || uploadRes?.imageUrl;
      if (!newAvatarUrl) {
        throw new Error('Image upload failed: no URL returned from server');
      }

      // 2. Persist new avatarUrl to user profile in backend
      const payload = {
        displayName: profile?.displayName || profile?.username,
        bio: profile?.bio || '',
        avatarUrl: newAvatarUrl,
      };
      const res = await updateProfile(activeUserId, payload);
      const updated = res.data || { ...profile, ...payload };

      // 3. Update local state and auth session
      setProfile(updated);
      setEditForm((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      updateCurrentUser?.({
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
      });

      showToast('Profile picture uploaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to upload photo:', err);
      showToast(
        err.userFriendlyMessage ||
          err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          'Failed to upload photo',
        'error'
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (modalFileInputRef.current) modalFileInputRef.current.value = '';
    }
  };

  const handleOpenEditModal = () => {
    setEditForm({
      displayName: profile?.displayName || profile?.username || '',
      avatarUrl: profile?.avatarUrl || '',
      bio: profile?.bio || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const activeUserId = currentUser?.id || profile?.id;
    if (!activeUserId) {
      showToast('You must be logged in to edit your profile', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        displayName: editForm.displayName.trim() || profile.username,
        avatarUrl: editForm.avatarUrl.trim() || '',
        bio: editForm.bio.trim() || '',
      };

      const res = await updateProfile(activeUserId, payload);
      const updated = res.data || { ...profile, ...payload };

      setProfile(updated);
      updateCurrentUser?.({
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
      });

      setEditModalOpen(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMsg =
        err.userFriendlyMessage ||
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to update profile. Please try again.';
      showToast(errorMsg, 'error');
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

  const handleOpenCreditModal = async () => {
    setCreditModalOpen(true);
    setSelectedMentor(profile?.creditedMentor ? {
      id: profile.creditedMentor.id,
      username: profile.creditedMentor.username,
      displayName: profile.creditedMentor.displayName,
      avatarUrl: profile.creditedMentor.avatarUrl
    } : null);
    setCoachRoleTitle(profile?.creditedMentor?.roleTitle || 'Strength & Performance Coach');
    setCandidateSearch('');

    setLoadingCandidates(true);
    try {
      const res = await getAllUsers();
      const list = Array.isArray(res.data) ? res.data : [];
      const activeUserId = currentUser?.id || profile?.id;
      const filtered = list.filter((u) => String(u.id) !== String(activeUserId));
      setCandidateUsers(filtered);
    } catch (err) {
      console.error('Failed to load users for coach selection:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSaveCredit = async (e) => {
    e.preventDefault();
    if (!selectedMentor) {
      showToast('Please select a teacher or coach to credit', 'error');
      return;
    }
    const activeUserId = currentUser?.id || profile?.id;
    if (!activeUserId) return;

    setSavingCredit(true);
    try {
      const payload = {
        mentorId: selectedMentor.id,
        mentorUsername: selectedMentor.username,
        roleTitle: coachRoleTitle.trim() || 'Coach / Mentor'
      };
      const res = await addMentorCredit(activeUserId, payload);
      if (res?.data) {
        setProfile(res.data);
      } else {
        setProfile((prev) => ({
          ...prev,
          creditedMentor: {
            id: selectedMentor.id,
            username: selectedMentor.username,
            displayName: selectedMentor.displayName || selectedMentor.username,
            avatarUrl: selectedMentor.avatarUrl,
            roleTitle: coachRoleTitle.trim() || 'Coach / Mentor'
          }
        }));
      }
      showToast(`Credited @${selectedMentor.username} as your coach!`, 'success');
      setCreditModalOpen(false);
    } catch (err) {
      console.error('Failed to save coach credit:', err);
      showToast(
        err.userFriendlyMessage ||
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to save coach credit',
        'error'
      );
    } finally {
      setSavingCredit(false);
    }
  };

  const handleRemoveCredit = async () => {
    const activeUserId = currentUser?.id || profile?.id;
    if (!activeUserId) return;

    setRemovingCredit(true);
    try {
      const res = await removeMentorCredit(activeUserId);
      if (res?.data) {
        setProfile(res.data);
      } else {
        setProfile((prev) => ({
          ...prev,
          creditedMentor: null,
          creditedMentors: []
        }));
      }
      showToast('Coach / mentor credit removed', 'info');
    } catch (err) {
      console.error('Failed to remove coach credit:', err);
      showToast('Failed to remove coach credit', 'error');
    } finally {
      setRemovingCredit(false);
    }
  };

  const filteredCandidates = candidateUsers.filter((u) => {
    if (!candidateSearch.trim()) return true;
    const q = candidateSearch.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    );
  });

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
      
      {/* Hidden file input for one-click avatar upload directly from the profile image */}
      {isOwnProfile && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handlePhotoUpload(e.target.files[0]);
            }
          }}
        />
      )}

      {/* ── 1. ATHLETE SHOWCASE HERO CARD ── */}
      <div className="bg-white border border-stone-200/90 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Championship Executive Banner - Pure Light Theme */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-amber-100/90 via-amber-50 to-stone-100 border-b border-stone-200/90 relative overflow-hidden flex items-start justify-end p-4">
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
            
            {/* Prominent, Larger Avatar with Native Photo Upload Overlay */}
            <div className="relative -mt-14 sm:-mt-20 shrink-0 z-10 group">
              <Avatar
                src={profile?.avatarUrl}
                name={profile?.displayName || profile?.username}
                size="3xl"
                className="w-28 h-28 sm:w-32 sm:h-32 ring-4 ring-white shadow-xl bg-white"
              />

              {/* Status Online Indicator Dot */}
              <span
                className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs z-10"
                title="Active in Arena"
              />

              {/* One-Click Camera Upload Overlay (Only visible to account owner) */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 p-2.5 rounded-full bg-stone-900 hover:bg-amber-600 text-white shadow-lg ring-4 ring-white transition-all transform hover:scale-110 active:scale-95 z-20"
                  title="Upload New Profile Picture from Device"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
              )}
            </div>

            {/* Header Actions - 100% on White Background */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end pt-2 sm:pt-0">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit3}
                    onClick={handleOpenEditModal}
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

          {/* Athlete Identity & Credentials (Name, Username, Email, Role) */}
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
            <p className="text-sm font-medium text-stone-800 max-w-2xl mt-3.5 leading-relaxed bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl">
              {profile.bio}
            </p>
          ) : (
            <p className="text-xs text-stone-500 italic mt-2.5">
              No biography provided yet. Click "Edit Profile" or the camera icon to personalize your athletic profile.
            </p>
          )}

          {/* ── ATHLETE COACH / MENTOR CREDIT (COMPACT EXECUTIVE SECTION) ── */}
          {profile?.creditedMentor ? (
            <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar
                      src={profile.creditedMentor.avatarUrl}
                      name={profile.creditedMentor.displayName || profile.creditedMentor.username}
                      size="md"
                      className="ring-2 ring-amber-400 bg-white shadow-xs"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                      🎓
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        {profile.creditedMentor.roleTitle || 'Coach / Mentor'}
                      </span>
                      <span className="text-[10px] font-bold text-stone-600">
                        Credited Coach
                      </span>
                    </div>
                    <Link
                      to={`/profile/${profile.creditedMentor.id}`}
                      className="group inline-flex items-center gap-1.5 mt-0.5 hover:underline"
                    >
                      <span className="text-sm font-black text-stone-900 group-hover:text-amber-800 transition-colors">
                        {profile.creditedMentor.displayName || profile.creditedMentor.username}
                      </span>
                      <span className="text-xs font-semibold text-stone-600">
                        @{profile.creditedMentor.username}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-800" />
                    </Link>
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenCreditModal}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 shadow-2xs transition-all"
                    >
                      Change Coach
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCredit}
                      disabled={removingCredit}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 shadow-2xs transition-all"
                      title="Remove Coach Credit"
                    >
                      {removingCredit ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : isOwnProfile ? (
            <div className="mt-4 p-3.5 rounded-2xl bg-stone-50 border border-dashed border-stone-300 hover:border-amber-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-300/60 flex items-center justify-center font-bold shrink-0">
                  <GraduationCap className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="text-xs font-black text-stone-900">
                    Credit Your Coach or Teacher
                  </div>
                  <div className="text-[11px] text-stone-600 font-medium">
                    Acknowledge the mentor whose guidance and coaching powers your athletic performance.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenCreditModal}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Credit Coach / Mentor</span>
              </button>
            </div>
          ) : null}

          {/* ── 2. METRIC SHOWCASE CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-5 border-t border-stone-200/80">
            
            {/* Metric 1: Verified Certificates */}
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center font-black">
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
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-800 flex items-center justify-center font-black">
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
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-800 flex items-center justify-center font-black">
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
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-center font-black">
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

      {/* ── 2. APPLAUDED BY SECTION (RENDERED ONLY WHEN APPLAUDED BY AT LEAST 1 ATHLETE) ── */}
      {(profile?.applaudedByCount > 0 || (profile?.applaudedBy && profile.applaudedBy.length > 0)) && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-800 border border-amber-300 flex items-center justify-center text-xl shadow-2xs">
                👏
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
                  Applauded by ({profile.applaudedByCount || profile.applaudedBy.length})
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active Mentorship
                  </span>
                </h2>
                <p className="text-xs text-stone-600 font-medium">
                  Athletes and competitors who officially credited this mentor for their guidance & performance.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(profile.applaudedBy || []).map((student) => (
              <Link
                key={student.id}
                to={`/profile/${student.id}`}
                className="p-3.5 rounded-2xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/80 hover:border-amber-300 transition-all flex items-center gap-3 group shadow-2xs"
              >
                <Avatar
                  src={student.avatarUrl}
                  name={student.displayName || student.username}
                  size="md"
                  className="ring-2 ring-white shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-stone-900 truncate group-hover:text-amber-900">
                    {student.displayName || student.username}
                  </div>
                  <div className="text-[11px] font-semibold text-stone-600 truncate">
                    @{student.username}
                  </div>
                  {student.roleTitle && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md truncate max-w-full">
                      {student.roleTitle}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. PROFILE TABS (POSTS, BADGES, CERTIFICATES) ── */}
      <Tabs tabs={tabs} />

      {/* ── 4. EDIT PROFILE MODAL WITH FILE UPLOAD & DEFAULT SILHOUETTE CONTROLS ── */}
      {isOwnProfile && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Athlete Profile"
          size="md"
        >
          {/* Modal Hidden file input */}
          <input
            ref={modalFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handlePhotoUpload(e.target.files[0]);
              }
            }}
          />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* Photo Customization Section */}
            <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 flex items-center gap-4">
              <Avatar
                src={editForm.avatarUrl}
                name={editForm.displayName || profile.username}
                size="2xl"
                className="w-20 h-20 shadow-md ring-2 ring-white"
              />

              <div className="flex-1 space-y-2">
                <div className="text-xs font-extrabold text-stone-900">
                  Profile Photo
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  {editForm.avatarUrl
                    ? 'Custom photo currently active.'
                    : 'Default profile silhouette active.'}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload New Photo</span>
                  </button>

                  {editForm.avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, avatarUrl: '' }))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                      title="Remove custom photo and use default silhouette"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <Input
              label="Display Name"
              value={editForm.displayName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="e.g. Indrajeet Patil"
              required
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

      {/* ── 5. CREDIT COACH / MENTOR MODAL ── */}
      {isOwnProfile && (
        <Modal
          isOpen={creditModalOpen}
          onClose={() => setCreditModalOpen(false)}
          title="Credit Coach, Teacher or Mentor"
          size="md"
        >
          <form onSubmit={handleSaveCredit} className="space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Acknowledge the coach or teacher who trains and mentors you. Their name and username will be featured on your profile, and you will be listed in their official <span className="font-bold text-stone-900">"Applauded by"</span> roster.
            </p>

            {/* Coach Role / Specialty Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 block">
                Mentorship Discipline / Coaching Role
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Strength & Performance Coach',
                  'Head Coach',
                  'Sprint & Track Coach',
                  'Personal Trainer',
                  'Teacher / Academic Mentor',
                  'Tactical Coach'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCoachRoleTitle(preset)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      coachRoleTitle === preset
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                value={coachRoleTitle}
                onChange={(e) => setCoachRoleTitle(e.target.value)}
                placeholder="Custom coach title (e.g. Sprint Coach, CSCS Mentor)"
                required
              />
            </div>

            {/* Select User to Credit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">
                  Select User (Coach / Teacher)
                </label>
                {selectedMentor && (
                  <span className="text-[11px] font-bold text-amber-700">
                    Selected: @{selectedMentor.username}
                  </span>
                )}
              </div>

              {/* Search input for candidates */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search coach by name or username..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* Candidate Users List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-stone-200/90 rounded-2xl p-2 bg-stone-50/50">
                {loadingCandidates ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-stone-500">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Loading active users...</span>
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-500 italic">
                    No matching users found
                  </div>
                ) : (
                  filteredCandidates.map((user) => {
                    const isSelected = selectedMentor && String(selectedMentor.id) === String(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => setSelectedMentor(user)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-100/70 border-amber-400 shadow-2xs'
                            : 'bg-white hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={user.avatarUrl}
                            name={user.displayName || user.username}
                            size="sm"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-stone-900 truncate">
                              {user.displayName || user.username}
                            </div>
                            <div className="text-[10px] font-semibold text-stone-500 truncate">
                              @{user.username}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-stone-400 hover:text-stone-700">
                            Select
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCreditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="dark"
                size="sm"
                loading={savingCredit}
                disabled={!selectedMentor}
                className="font-bold"
              >
                Confirm Coach Credit
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
