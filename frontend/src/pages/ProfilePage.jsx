import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Award, Newspaper, Calendar, MapPin, Edit3, Shield, MessageSquare } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import FeedList from '../components/feed/FeedList';
import BadgeList from '../components/badges/BadgeList';
import CertificateCard from '../components/certificates/CertificateCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getProfile } from '../api/usersApi';
import { getUserBadges } from '../api/badgesApi';
import { getUserPosts } from '../api/postsApi';
import { listByInstitution } from '../api/certificatesApi';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const targetId = userId || currentUser?.id || 1;
  const isOwnProfile = currentUser && String(currentUser.id) === String(targetId);

  const [profile, setProfile] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userCertificates, setUserCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

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
        } else if (isOwnProfile && currentUser) {
          activeProf = currentUser;
          setProfile(currentUser);
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

  if (loading) {
    return <LoadingSpinner text="Loading user profile..." className="py-20" />;
  }

  const tabs = [
    {
      label: `Posts (${userPosts.length})`,
      content: (
        <FeedList
          posts={userPosts}
          emptyTitle="No Posts"
          emptyDescription="This user hasn't posted anything yet."
        />
      ),
    },
    {
      label: `Badges (${userBadges.length})`,
      content: (
        <BadgeList
          badges={userBadges}
          emptyMessage="No badges have been earned by this user yet."
        />
      ),
    },
    {
      label: `Certificates (${userCertificates.length})`,
      content: userCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userCertificates.map((cert) => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              canManage={false}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900">No Verified Certificates Awarded Yet</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Official tamper-proof certificates issued to this athlete by verified institutions and sports academies will appear here.
          </p>
        </div>
      ),
    },
  ];

  if (!profile) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-stone-900">Profile Not Found</h3>
        <p className="text-xs text-stone-500">The requested athlete or user profile does not exist in the database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Banner */}
      <Card className="overflow-hidden p-0">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative" />

        <div className="px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-14 mb-4 gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <Avatar
                src={profile?.avatarUrl}
                name={profile?.displayName || profile?.username}
                size="xl"
                className="ring-4 ring-white dark:ring-gray-800 shadow-md"
              />
              <div className="pt-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profile?.displayName || profile?.username}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">@{profile?.username}</p>
              </div>
            </div>

            {isOwnProfile ? (
              <Button variant="secondary" size="sm" icon={Edit3}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {currentUser?.role === 'INSTITUTION' && (
                  <Button
                    variant="dark"
                    size="sm"
                    icon={Award}
                    onClick={() => navigate('/certificates/create', { state: { recipient: profile } })}
                  >
                    Award Certificate in Studio
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={MessageSquare}
                  onClick={() => navigate(`/messages?user=${profile.id}`)}
                >
                  Direct Message
                </Button>
                <Button variant="primary" size="sm">
                  Follow
                </Button>
              </div>
            )}
          </div>

          {/* Bio statement */}
          {profile?.bio && (
            <p className="text-sm text-gray-700 dark:text-gray-300 max-w-2xl mt-2 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Meta counters */}
          <div className="flex flex-wrap items-center gap-6 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-blue-500" />
              <strong className="text-gray-900 dark:text-gray-100">{userPosts.length}</strong> Posts
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-500" />
              <strong className="text-gray-900 dark:text-gray-100">{userBadges.length}</strong> Badges Earned
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <strong className="text-gray-900 dark:text-gray-100">{userCertificates.length}</strong> Certificates
            </div>
            {profile?.joinedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Joined {formatDate(profile.joinedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs: Posts, Badges */}
      <Tabs tabs={tabs} />
    </div>
  );
}
