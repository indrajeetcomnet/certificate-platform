import axiosClient from './axiosClient.js';

export function getAll() {
  return axiosClient.get('/badges');
}

export const getAllBadges = getAll;

export function create(data) {
  return axiosClient.post('/badges', data);
}

export function assignToUser(data) {
  return axiosClient.post('/badges/assign', data);
}

export function assignBulk(data) {
  return axiosClient.post('/badges/assign-bulk', data);
}

export function revokeBadge(userBadgeId) {
  return axiosClient.delete(`/badges/awarded/${userBadgeId}`);
}

export function revokeUserBadge(userId, badgeId) {
  return axiosClient.delete(`/badges/user/${userId}/badge/${badgeId}`);
}

export function getUserBadges(userId) {
  return axiosClient.get(`/badges/user/${userId}`);
}

export function getAllAwardedBadges() {
  return axiosClient.get('/badges/awarded');
}

export function getBadgeSponsors(badgeId) {
  return axiosClient.get(`/badges/${badgeId}/sponsors`);
}

export default {
  getAll,
  getAllBadges,
  create,
  assignToUser,
  assignBulk,
  revokeBadge,
  revokeUserBadge,
  getUserBadges,
  getAllAwardedBadges,
  getBadgeSponsors,
};
