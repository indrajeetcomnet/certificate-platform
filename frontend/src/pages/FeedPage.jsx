import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { TrendingUp, Award, Flame, Users, Coins } from 'lucide-react';
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
          <div className="flex items-center justify-between px-2 text-sm text-stone-700 font-semibold">
            <span>
              Showing search results for: <strong className="text-stone-900 font-black">"{searchQuery}"</strong>
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
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 font-black text-sm text-stone-900 mb-3.5">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Trending Discussions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayTags.length > 0 ? (
              displayTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-100 border border-stone-200/80 text-stone-800 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-xs text-stone-500 font-medium italic">No trending topics yet</p>
            )}
          </div>
        </div>

        {/* Featured Badges */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2 font-black text-sm text-stone-900">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Top Badges</span>
            </div>
            <Link
              to="/badges/manage"
              className="text-xs font-bold text-stone-900 hover:text-amber-700 hover:underline"
            >
              Explore
            </Link>
          </div>
          <div className="space-y-3">
            {activeBadges.length > 0 ? (
              activeBadges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between">
                  <BadgeDisplay badge={badge} />
                  <span className="text-xs font-bold text-stone-700 font-mono bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    Rank #{badge.rank}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 font-medium italic">No active badges yet</p>
            )}
          </div>
        </div>

        {/* Monetization / Sponsor callout */}
        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-50/60 to-white border border-amber-300/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 font-black text-sm text-stone-900 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
              <Coins className="w-4 h-4 text-amber-700" />
            </div>
            <span>Earn with Sponsor Badges</span>
          </div>
          <p className="text-xs text-stone-700 font-semibold mb-3.5 leading-relaxed">
            Attach sponsors to your earned badges. Every feed view earns revenue in Indian Rupees directly into your dashboard.
          </p>
          <Link
            to="/earnings"
            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 hover:text-amber-700 hover:underline"
          >
            <span>Check your balance →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
