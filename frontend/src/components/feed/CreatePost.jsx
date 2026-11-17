import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Send, Link as LinkIcon, X, Loader2, UploadCloud } from 'lucide-react';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { createPost } from '../../api/postsApi';
import { uploadImage } from '../../api/mediaApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { POST_TYPES } from '../../utils/constants';

export default function CreatePost({
  onPostCreated,
  parentPost = null,
  className = '',
}) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [content, setContent] = useState('');
  const [postType, setPostType] = useState(parentPost ? POST_TYPES.FOLLOWUP : POST_TYPES.ORIGINAL);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Handle Photo File Selection & Server Upload
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('Please select valid image files (PNG, JPG, WebP, GIF)', 'error');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = validFiles.map((file) => uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.url);
      setMediaUrls((prev) => [...prev, ...newUrls]);
      showToast(`${validFiles.length === 1 ? 'Photo' : `${validFiles.length} photos`} uploaded successfully`, 'success');
    } catch (err) {
      console.error('Photo upload error:', err);
      showToast('Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setMediaUrls((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (index) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Please write some content', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: content.trim(),
        postType: parentPost ? POST_TYPES.FOLLOWUP : postType,
        parentPostId: parentPost?.id || null,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : [],
      };

      const res = await createPost(payload);
      showToast('Post published successfully!', 'success');
      setContent('');
      setMediaUrls([]);
      onPostCreated?.(res.data);
    } catch (err) {
      console.error('Create post failed', err);
      showToast(err.response?.data?.message || err.message || 'Failed to publish post. Please check your session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      className={`p-4 shadow-sm relative transition-all duration-200 ${
        isDragging ? 'ring-2 ring-amber-500 bg-amber-500/5' : ''
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input for native device photo picker */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar
            src={currentUser?.avatarUrl}
            name={currentUser?.displayName || currentUser?.username}
            size="md"
          />

          <div className="flex-1 space-y-3 min-w-0">
            {/* Post Type selector if not forced by parentPost */}
            {!parentPost && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">Post Type:</span>
                <div className="inline-flex rounded-xl border border-stone-200 p-0.5 bg-stone-100">
                  <button
                    type="button"
                    onClick={() => setPostType(POST_TYPES.ORIGINAL)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      postType === POST_TYPES.ORIGINAL
                        ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType(POST_TYPES.FOLLOWUP)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      postType === POST_TYPES.FOLLOWUP
                        ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Follow-up
                  </button>
                </div>
              </div>
            )}

            {/* Replying banner */}
            {parentPost && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Replying to @{parentPost.user?.username || 'post'}
              </p>
            )}

            {/* Textarea */}
            <TextArea
              placeholder={parentPost ? 'Write your follow-up reply...' : "What's on your mind? Share achievements, match results, or certified honours..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full"
            />

            {/* Image Previews with Remove Action */}
            {(mediaUrls.length > 0 || uploading) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-stone-200 h-24 bg-stone-100 group shadow-xs">
                    <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1.5 right-1.5 p-1 bg-stone-900/80 hover:bg-rose-600 text-white rounded-full transition-colors shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {uploading && (
                  <div className="rounded-xl border border-dashed border-amber-400 bg-amber-500/10 h-24 flex flex-col items-center justify-center gap-1.5 text-amber-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[11px] font-bold">Uploading...</span>
                  </div>
                )}
              </div>
            )}

            {/* Optional URL Input popup toggle */}
            {showUrlInput && (
              <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200 animate-in fade-in">
                <input
                  type="url"
                  placeholder="Paste external image link (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <Button size="sm" onClick={handleAddImageUrl} variant="dark">
                  Attach Link
                </Button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2">
                {/* Primary: Real Photo Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>Upload Photo</span>
                </button>

                {/* Secondary: Link URL toggle */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                  title="Or link via URL"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>

                <span className="hidden sm:inline text-[11px] text-stone-400">
                  (Drag & drop photos supported)
                </span>
              </div>

              <Button
                type="submit"
                variant="dark"
                size="sm"
                loading={submitting || uploading}
                disabled={!content.trim()}
                icon={Send}
                className="shadow-sm font-bold"
              >
                Publish Post
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}
