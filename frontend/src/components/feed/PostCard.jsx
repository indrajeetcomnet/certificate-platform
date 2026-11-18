import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Share2, CornerDownRight, CheckCircle2, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import BadgeRotator from '../badges/BadgeRotator';
import CommentSection from './CommentSection';
import { likePost, unlikePost } from '../../api/postsApi';
import { recordView } from '../../api/viewsApi';
import { timeAgo, formatCount } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { extractAuthorBadges } from '../../utils/badgeThemes.js';
import { isViewDebounced, isQualifiedViewDuration, buildViewPayload } from '../../utils/viewUtils.js';

export default function PostCard({
  post,
  onLikeChange,
  showFullComments = false,
  className = '',
}) {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  if (!post) return null;

  const user = post.user || {};
  const isFollowup = post.postType === 'FOLLOWUP' && post.parentPost;
  const mediaList = post.media || post.postMedia || [];
  const userBadges = extractAuthorBadges(post);
  const sponsors = post.sponsors || user.sponsors || [];

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [viewsCount, setViewsCount] = useState(post.viewsCount || 0);

  const cardRef = useRef(null);
  const hasRecordedView = useRef(false);

  // Synchronize initial views count from post
  useEffect(() => {
    if (post.viewsCount != null) {
      setViewsCount(post.viewsCount);
    }
  }, [post.viewsCount]);

  // View tracking with duration qualification and 30-second debouncing
  useEffect(() => {
    if (!post?.id || hasRecordedView.current) return;

    // Maintain persistent client-side session identifier
    let sessionId = sessionStorage.getItem('client_view_session');
    if (!sessionId) {
      sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'sess_' + Math.random().toString(36).substring(2) + Date.now();
      sessionStorage.setItem('client_view_session', sessionId);
    }

    const startTime = Date.now();
    let timeoutId = null;

    const checkAndRecord = async () => {
      try {
        const key = `post_view_${post.id}`;
        const lastViewTime = Number(sessionStorage.getItem(key) || 0);
        const now = Date.now();

        // Client-side debounce: skip duplicate calls within 30 seconds
        if (isViewDebounced(lastViewTime, now)) {
          return;
        }

        const duration = Date.now() - startTime;
        if (!isQualifiedViewDuration(duration)) return; // 2000ms minimum duration

        hasRecordedView.current = true;
        sessionStorage.setItem(key, String(now));

        const payload = buildViewPayload({
          postId: post.id,
          viewType: 'POST',
          durationMs: Math.max(duration, 2000),
          sessionId: sessionId,
          userId: currentUser?.id || null,
        });

        const res = await recordView(payload);

        if (res?.data?.incremented) {
          if (res.data.viewsCount != null) {
            setViewsCount(res.data.viewsCount);
          } else {
            setViewsCount((prev) => prev + 1);
          }
        }
      } catch (err) {
        // Silently handle background recording errors
      }
    };

    // Trigger after 2000ms view duration threshold
    timeoutId = setTimeout(() => {
      checkAndRecord();
    }, 2000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [post?.id, currentUser?.id]);

  const handleLikeToggle = async (e) => {
    e.stopPropagation();
    if (likeLoading) return;
    setLikeLoading(true);

    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    // Optimistic update
    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      if (nextLiked) {
        await likePost(post.id);
      } else {
        await unlikePost(post.id);
      }
      onLikeChange?.(post.id, nextLiked, nextCount);
    } catch (err) {
      // Revert on error
      setIsLiked(!nextLiked);
      setLikesCount(likesCount);
      showToast('Action failed', 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/feed/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${user?.displayName || user?.username || 'User'}`,
          text: post.content,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Post link copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  return (
    <Card ref={cardRef} className={`overflow-hidden transition-all duration-200 hover:shadow-sm ${className}`}>
      {/* Follow-up / Reply banner */}
      {isFollowup && (
        <div className="flex items-center gap-2 text-xs text-stone-700 bg-stone-100/70 px-3.5 py-1.5 -mx-5 -mt-5 mb-3 border-b border-stone-200/80">
          <CornerDownRight className="w-3.5 h-3.5 text-amber-600" />
          <span>Replying to </span>
          <Link
            to={`/feed/${post.parentPost.id}`}
            className="font-bold underline hover:text-stone-900"
          >
            @{post.parentPost.user?.username || 'post'}
          </Link>
        </div>
      )}

      {/* Header: Left (User Info) vs Right (BadgeRotator) */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Left side: Avatar + Display Name + Username + Timestamp */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile/${user.id || 1}`} className="flex-shrink-0 relative group">
            <Avatar
              src={user?.avatarUrl}
              name={user?.displayName || user?.username}
              size="md"
              className="ring-2 ring-stone-200 group-hover:ring-amber-400 transition-all"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to={`/profile/${user?.id || 1}`}
                className="font-black text-sm text-stone-900 hover:text-amber-800 hover:underline truncate"
              >
                {user?.displayName || user?.username || 'User'}
              </Link>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 fill-amber-400/20 flex-shrink-0" title="Ranked Competitor" />
              <span className="text-xs font-semibold text-stone-600 truncate">
                @{user.username || 'user'}
              </span>
            </div>
            <p className="text-xs text-stone-600 font-semibold mt-0.5">
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Right side: BadgeRotator (User Badges + Sponsors) */}
        <div className="flex-shrink-0">
          <BadgeRotator
            badges={userBadges}
            sponsors={sponsors}
            postId={post.id}
          />
        </div>
      </div>

      {/* Center: Post Content - High contrast crisp typography */}
      <div className="text-[14.5px] font-normal text-stone-900 leading-relaxed mb-3.5 whitespace-pre-wrap break-words">
        {post.content}
      </div>

      {/* Attached Media / Images (Grid Layout) */}
      {mediaList.length > 0 && (
        <div
          className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${mediaList.length === 1
              ? 'grid-cols-1'
              : mediaList.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2 sm:grid-cols-3'
            }`}
        >
          {mediaList.map((media, idx) => {
            const url = typeof media === 'string' ? media : media.mediaUrl;
            return (
              <img
                key={idx}
                src={url}
                alt="Post attachment"
                className="w-full h-48 sm:h-56 object-cover hover:opacity-95 transition-opacity cursor-pointer bg-stone-100 border border-stone-200/80 rounded-xl"
                loading="lazy"
              />
            );
          })}
        </div>
      )}

      {/* Interaction Bar - High contrast text & icons */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-200/80 text-stone-700 text-xs font-bold">
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-rose-600 font-black' : 'hover:text-rose-600'
              }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform group-hover:scale-115 ${isLiked ? 'fill-rose-500 text-rose-500 animate-bounce' : ''
                }`}
            />
            <span>{formatCount(likesCount)}</span>
          </button>

          {/* Comment Count / Link */}
          <Link
            to={`/feed/${post.id}`}
            className="flex items-center gap-1.5 hover:text-stone-900 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{formatCount(post.commentsCount || 0)}</span>
          </Link>

          {/* Views Count */}
          <div className="flex items-center gap-1.5 text-stone-700 font-bold" title="Verified Post Views">
            <Eye className="w-4 h-4 text-stone-600" />
            <span className="font-mono font-bold text-stone-800">{formatCount(viewsCount)}</span>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        {post.postType && (
          <span className="text-[10px] uppercase font-black tracking-wider text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
            {post.postType}
          </span>
        )}
      </div>

      {/* Comments section */}
      <CommentSection
        postId={post.id}
        commentsCount={post.commentsCount || 0}
        defaultExpanded={showFullComments}
        className="mt-3"
      />
    </Card>
  );
}
