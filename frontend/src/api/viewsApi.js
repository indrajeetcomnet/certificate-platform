import axiosClient from './axiosClient.js';

export function recordView(data) {
  return axiosClient.post('/views/record', data);
}

export function getEarnings(userId) {
  return axiosClient.get(`/views/earnings/${userId}`);
}

export function getPeriodEarnings(userId, period) {
  return axiosClient.get(`/views/earnings/${userId}/${period}`);
}
