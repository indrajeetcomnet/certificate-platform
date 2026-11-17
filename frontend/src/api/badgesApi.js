import axiosClient from './axiosClient.js';

export function getAll() {
  return axiosClient.get('/badges');
}

export function create(data) {
  return axiosClient.post('/badges', data);
}

export function assignToUser(data) {
  return axiosClient.post('/badges/assign', data);
}

export function getUserBadges(userId) {
  return axiosClient.get(`/badges/user/${userId}`);
}

export function getBadgeSponsors(badgeId) {
  return axiosClient.get(`/badges/${badgeId}/sponsors`);
}
