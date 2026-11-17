import axiosClient from './axiosClient.js';

/**
 * Upload a photo / image file directly to the server.
 * Returns { url: '/api/v1/media/<filename>', filename: '...', size: ..., contentType: ... }
 */
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axiosClient.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};

export default {
  uploadImage,
};

