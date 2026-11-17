import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostDetail from '../components/feed/PostDetail';

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="py-2">
      <PostDetail
        postId={postId}
        onBack={() => navigate('/feed')}
      />
    </div>
  );
}
