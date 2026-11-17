import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { getPost } from '../../api/postsApi';

export default function PostDetail({
  postId,
  post: initialPost = null,
  onBack,
  className = '',
}) {
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialPost && !!postId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialPost && postId) {
      setLoading(true);
      getPost(postId)
        .then((res) => {
          setPost(res.data);
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to load post detail', err);
          setError('Post could not be loaded.');
        })
        .finally(() => setLoading(false));
    } else if (initialPost) {
      setPost(initialPost);
    }
  }, [postId, initialPost]);

  const handleFollowupCreated = (newReply) => {
    // Optionally link or show toast
  };

  if (loading) {
    return <LoadingSpinner text="Loading post discussion..." className="py-16" />;
  }

  if (error || !post) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <EmptyState
          title="Post Not Found"
          description={error || 'This post may have been deleted or does not exist.'}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 max-w-3xl mx-auto ${className}`}>
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>
      </div>

      {/* Main post view with expanded comments */}
      <PostCard
        post={post}
        showFullComments={true}
      />

      {/* Write a reply / follow-up */}
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Post a Follow-up
        </h3>
        <CreatePost
          parentPost={post}
          onPostCreated={handleFollowupCreated}
        />
      </div>
    </div>
  );
}
