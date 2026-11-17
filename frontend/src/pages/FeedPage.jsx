import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { TrendingUp, Award, Sparkles, Flame, Users } from 'lucide-react';
import Card from '../components/ui/Card';
import CreatePost from '../components/feed/CreatePost';
import FeedList from '../components/feed/FeedList';
import BadgeDisplay from '../components/badges/BadgeDisplay';
import { getFeed } from '../api/postsApi';
import { getAll as getAllSponsors } from '../api/sponsorsApi';
import { getAll as getAllBadges } from '../api/badgesApi';

export default function FeedPage({
  trendingTags = null,
  topBadges = null,
}) {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [posts, setPosts] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [activeBadges, setActiveBadges] = useState(topBadges || []);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Load feed posts
  const fetchPosts = useCallback(async (pageNum = 0, isInitial = false) => {
    setLoading(true);
    try {
      const res = await getFeed(pageNum);
      const data = res.data?.content || res.data || [];
      const isLast = res.data?.last !== undefined ? res.data.last : data.length < 5;

      setPosts((prev) => (isInitial ? data : [...prev, ...data]));
      setHasMore(!isLast && data.length > 0);
      setPage(pageNum);
    } catch (err) {
      console.warn('Feed fetch notice:', err.message);
      if (isInitial && posts.length === 0) {
        setPosts([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [posts.length]);

  useEffect(() => {
    fetchPosts(0, true);
    getAllSponsors()
      .then((res) => setSponsors(res.data || []))
      .catch(() => {});
    if (topBadges) {
      setActiveBadges(topBadges);
    } else {
      getAllBadges()
        .then((res) => setActiveBadges(res.data?.slice(0, 5) || []))
        .catch(() => setActiveBadges([]));
    }
  }, [topBadges]);

  const displayTags = useMemo(() => {
    if (trendingTags && trendingTags.length > 0) return trendingTags;
    const tagSet = new Set();
    posts.forEach((p) => {
      const matches = p.content?.match(/#[a-zA-Z0-9_]+/g);
      if (matches) {
        matches.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet).slice(0, 8);
  }, [trendingTags, posts]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, false);
    }
  };

  const handleLikeChange = (postId, isLiked, nextCount) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isLiked, likesCount: nextCount } : p
      )
    );
  };

  // Filter posts if search query exists
  const displayedPosts = searchQuery
    ? posts.filter((p) =>
        (p.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.user?.username || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Center column: Create post + Feed items */}
      <div className="lg:col-span-2 space-y-6">
        <CreatePost onPostCreated={handlePostCreated} />

        {searchQuery && (
          <div className="flex items-center justify-between px-2 text-sm text-gray-500">
            <span>
              Showing search results for: <strong className="text-gray-900 dark:text-gray-100">"{searchQuery}"</strong>
            </span>
          </div>
        )}

        <FeedList
          posts={displayedPosts}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onLikeChange={handleLikeChange}
        />
      </div>

      {/* Right sidebar: Trending topics, Featured Badges, Sponsors */}
      <div className="hidden lg:block space-y-6">
        {/* Trending tags */}
        <Card className="p-4">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Trending Discussions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayTags.length > 0 ? (
              displayTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No trending topics yet</p>
            )}
          </div>
        </Card>

        {/* Featured Badges */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top Badges</span>
            </div>
            <Link
              to="/badges/manage"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Explore
            </Link>
          </div>
          <div className="space-y-2.5">
            {activeBadges.length > 0 ? (
              activeBadges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between">
                  <BadgeDisplay badge={badge} />
                  <span className="text-[11px] text-gray-400 font-mono">Rank #{badge.rank}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No active badges yet</p>
            )}
          </div>
        </Card>

        {/* Monetization / Sponsor callout */}
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 via-white to-white dark:from-purple-950/20 dark:via-gray-800 dark:to-gray-800 border-purple-200 dark:border-purple-900/40">
          <div className="flex items-center gap-2 font-bold text-sm text-purple-900 dark:text-purple-300 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Earn with Sponsor Badges</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
            Attach sponsors to your earned badges. Every feed view earns revenue in Indian Rupees directly into your dashboard.
          </p>
          <Link
            to="/earnings"
            className="inline-block text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Check your balance →
          </Link>
        </Card>
      </div>
    </div>
  );
}
