import axiosClient from './axiosClient.js';
import * as postsApi from './postsApi.js';

export const postApi = {
  getFeed: postsApi.getFeed,
  getPost: postsApi.getPost,
  getUserPosts: (userId) => axiosClient.get(`/posts/user/${userId}`).then((res) => res.data),
  createPost: postsApi.createPost,
  likePost: postsApi.likePost,
  unlikePost: postsApi.unlikePost,
  getComments: postsApi.getComments,
  createComment: postsApi.createComment,
};

export const getUserPosts = (userId) => axiosClient.get(`/posts/user/${userId}`);
export const getFeed = postsApi.getFeed;
export const getPost = postsApi.getPost;
export const createPost = postsApi.createPost;
export const likePost = postsApi.likePost;
export const unlikePost = postsApi.unlikePost;
export const getComments = postsApi.getComments;
export const createComment = postsApi.createComment;

export default postApi;
