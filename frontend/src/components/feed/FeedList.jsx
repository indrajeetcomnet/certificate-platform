import React from 'react';
import { Newspaper } from 'lucide-react';
import PostCard from './PostCard';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';

export default function FeedList({
  posts = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  onLikeChange,
  emptyTitle = 'No Posts Yet',
  emptyDescription = 'Be the first to share an update, certificate, or achievement!',
  className = '',
}) {
  if (loading && posts.length === 0) {
    return <LoadingSpinner text="Loading feed..." className="py-12" />;
  }

  if (!loading && posts.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title={emptyTitle}
        description={emptyDescription}
        className="py-12"
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLikeChange={onLikeChange}
        />
      ))}

      {/* Load More / Infinite Scroll sentinel */}
      {hasMore && (
        <div className="flex justify-center pt-4 pb-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onLoadMore}
            loading={loading}
          >
            Load More Posts
          </Button>
        </div>
      )}

      {loading && posts.length > 0 && (
        <LoadingSpinner size="sm" text="Loading more..." className="py-4" />
      )}
    </div>
  );
}
