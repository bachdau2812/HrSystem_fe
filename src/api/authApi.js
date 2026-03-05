import axiosClient from './axiosClient';

const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  logout: (data) => axiosClient.post('/auth/logout', data),
  refreshToken: (data) => axiosClient.post('/auth/refresh-token', data),
  introspect: (data) => axiosClient.post('/auth/introspect', data),
};

export default authApi;
