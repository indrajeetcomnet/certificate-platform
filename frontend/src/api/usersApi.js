import axiosClient from './axiosClient.js';

export function getProfile(id) {
  return axiosClient.get(`/users/${id}/profile`);
}

export function getAllUsers(q = '') {
  const params = q ? `?q=${encodeURIComponent(q)}` : '';
  return axiosClient.get(`/users${params}`);
}

export function updateProfile(id, data) {
  return axiosClient.put(`/users/${id}/profile`, data);
}

export function addMentorCredit(userId, data) {
  return axiosClient.post(`/users/${userId}/mentor-credits`, data);
}

export function removeMentorCredit(userId, mentorId) {
  const query = mentorId ? `?mentorId=${mentorId}` : '';
  return axiosClient.delete(`/users/${userId}/mentor-credits${query}`);
}


