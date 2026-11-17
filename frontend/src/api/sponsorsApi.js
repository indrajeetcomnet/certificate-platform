import axiosClient from './axiosClient.js';

export function getAll() {
  return axiosClient.get('/sponsors');
}

export function create(data) {
  return axiosClient.post('/sponsors', data);
}

export function linkBadge(sponsorId, data) {
  return axiosClient.post(`/sponsors/${sponsorId}/link-badge`, data);
}

