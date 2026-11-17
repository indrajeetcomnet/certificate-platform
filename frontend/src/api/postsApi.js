import axiosClient from './axiosClient.js';

export function getFeed(page = 0) {
  return axiosClient.get('/posts', { params: { page } });
}

export function getPost(id) {
  return axiosClient.get(`/posts/${id}`);
}

export function getUserPosts(userId) {
  return axiosClient.get(`/posts/user/${userId}`);
}

export function createPost(data) {
  return axiosClient.post('/posts', data);
}

export function likePost(id) {
  return axiosClient.post(`/posts/${id}/like`);
}

export function unlikePost(id) {
  return axiosClient.delete(`/posts/${id}/like`);
}

export function getComments(postId) {
  return axiosClient.get(`/posts/${postId}/comments`);
}

export function createComment(postId, data) {
  return axiosClient.post(`/posts/${postId}/comments`, data);
}
