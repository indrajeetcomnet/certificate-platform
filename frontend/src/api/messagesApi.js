import axiosClient from './axiosClient';

/**
 * Direct Messaging API
 */

export const sendMessage = (data) => {
  return axiosClient.post('/messages', data);
};

export const getConversations = () => {
  return axiosClient.get('/messages/conversations');
};

export const getConversation = (partnerId) => {
  return axiosClient.get(`/messages/conversation/${partnerId}`);
};

export const markAsRead = (partnerId) => {
  return axiosClient.put(`/messages/read/${partnerId}`);
};

export const getUnreadCount = () => {
  return axiosClient.get('/messages/unread-count');
};

export default {
  sendMessage,
  getConversations,
  getConversation,
  markAsRead,
  getUnreadCount,
};

