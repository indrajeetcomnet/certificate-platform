import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import BadgeRotator from '../badges/BadgeRotator';
import { getComments, createComment } from '../../api/postsApi';
import { timeAgo } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CommentSection({
  postId,
  initialComments = [],
  commentsCount = 0,
  defaultExpanded = false,
  className = '',
}) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load comments when expanded
  useEffect(() => {
    if (expanded && comments.length === 0 && postId) {
      setLoading(true);
      getComments(postId)
        .then((res) => {
          setComments(res.data?.content || res.data || []);
        })
        .catch((err) => {
          console.error('Failed to load comments', err);
        })
        .finally(() => setLoading(false));
    }
  }, [expanded, postId, comments.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!currentUser?.id) {
      showToast('You must be logged in to post a comment', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: content.trim(),
        userId: currentUser.id,
      };
      const res = await createComment(postId, payload);

      const newComment = res.data;
      if (!newComment) {
        throw new Error('Server returned empty response for created comment');
      }
      setComments((prev) => [newComment, ...prev]);
      setContent('');
      showToast('Comment posted', 'success');
      if (!expanded) setExpanded(true);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = (commentId) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, likesCount: (c.likesCount || 0) + 1 } : c
      )
    );
  };

  const totalComments = Math.max(comments.length, commentsCount);

  return (
    <div className={`border-t border-gray-100 dark:border-gray-800 pt-3 ${className}`}>
      {/* Toggle button */}
      <div className="flex items-center justify-between px-1 mb-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>
            {totalComments === 0
              ? 'Leave a comment'
              : `${totalComments} ${totalComments === 1 ? 'Comment' : 'Comments'}`}
          </span>
          {totalComments > 0 && (
            expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 mt-3">
          {/* New comment input */}
          <form onSubmit={handleSubmit} className="flex items-start gap-2.5">
            <Avatar
              src={currentUser?.avatarUrl}
              name={currentUser?.displayName || currentUser?.username}
              size="sm"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                type="submit"
                size="sm"
                loading={submitting}
                disabled={!content.trim()}
                icon={Send}
              >
                Post
              </Button>
            </div>
          </form>

          {/* Comments list */}
          {loading ? (
            <div className="text-center py-3 text-xs text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3 pt-1">
              {comments.map((comment) => {
                const commentUser = comment.user || {};
                const badges = commentUser.badges || comment.badges || [];

                return (
                  <div
                    key={comment.id}
                    className="flex items-start gap-2.5 text-sm bg-gray-50/70 dark:bg-gray-800/40 p-2.5 rounded-lg"
                  >
                    <Avatar
                      src={commentUser.avatarUrl}
                      name={commentUser.displayName || commentUser.username}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                            {commentUser.displayName || commentUser.username || 'Anonymous'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        {badges.length > 0 && (
                          <div className="flex-shrink-0">
                            <BadgeRotator badges={badges} />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                        <button
                          type="button"
                          onClick={() => handleLike(comment.id)}
                          className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-3 h-3" />
                          <span>{comment.likesCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
