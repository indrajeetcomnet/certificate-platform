import axiosClient from './axiosClient.js';

export function create(data) {
  return axiosClient.post('/certificates', data);
}

export function bulkCreate(data) {
  const payload = Array.isArray(data) ? { certificates: data } : data;
  return axiosClient.post('/certificates/bulk', payload);
}


export function getById(id) {
  return axiosClient.get(`/certificates/${id}`);
}

export function generateCode(params = {}) {
  return axiosClient.get('/certificates/generate-code', { params });
}

export function checkCode(code) {
  return axiosClient.get('/certificates/check-code', { params: { code } });
}

export function verify(uniqueCode) {
  return axiosClient.get(`/certificates/verify/${uniqueCode}`);
}

export function listByInstitution(instId, page = 0) {
  return axiosClient.get(`/certificates/institution/${instId}`, { params: { page } });
}

export function update(id, data) {
  return axiosClient.put(`/certificates/${id}`, data);
}

export function deleteCertificate(id) {
  return axiosClient.delete(`/certificates/${id}`);
}

export { deleteCertificate as delete };

