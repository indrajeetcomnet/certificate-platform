import axiosClient from './axiosClient.js';

export const login = (data) => {
  return axiosClient.post('/auth/login', data);
};

export const register = (data) => {
  return axiosClient.post('/auth/register', data);
};

export const institutionLogin = (data) => {
  return axiosClient.post('/auth/institution-login', data);
};

export const getMe = () => {
  return axiosClient.get('/auth/me');
};

export const logout = () => {
  return axiosClient.post('/auth/logout');
};

export default {
  login,
  register,
  institutionLogin,
  getMe,
  logout,
};
