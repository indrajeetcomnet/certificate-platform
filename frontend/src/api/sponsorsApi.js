import axiosClient from './axiosClient.js';

export function getAll() {
  return axiosClient.get('/sponsors');
}

export function getMySponsors() {
  return axiosClient.get('/sponsors/my');
}

export function getById(id) {
  return axiosClient.get(`/sponsors/${id}`);
}

export function create(data) {
  return axiosClient.post('/sponsors', data);
}

export function update(id, data) {
  return axiosClient.put(`/sponsors/${id}`, data);
}

export function toggleStatus(id) {
  return axiosClient.post(`/sponsors/${id}/toggle`);
}

export function addDeposit(id, amount) {
  return axiosClient.post(`/sponsors/${id}/deposit`, { amount });
}

export function recordClick(id) {
  return axiosClient.post(`/sponsors/${id}/click`);
}

export function linkBadge(sponsorId, data) {
  return axiosClient.post(`/sponsors/${sponsorId}/link-badge`, data);
}

export function getActiveSponsorBadges(sponsorId) {
  return axiosClient.get(`/sponsors/${sponsorId}/badges`);
}
