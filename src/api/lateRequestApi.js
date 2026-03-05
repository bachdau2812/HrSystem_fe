import axiosClient from './axiosClient';

const lateRequestApi = {
  create: (data) => axiosClient.post('/late', data),
  getMyList: (page, limit) =>
    axiosClient.get(`/late/get-list-of-user?page=${page}&limit=${limit}`),
  getByUserId: (page, limit, userId) =>
    axiosClient.get(`/late/get-list-by-user?page=${page}&limit=${limit}&userId=${userId}`),
  getByDate: (page, limit, date) =>
    axiosClient.get(`/late/get-by-date?page=${page}&limit=${limit}&date=${date}`),
  approve: (userId) => axiosClient.get(`/late/approve?userId=${userId}`),
  reject: (userId) => axiosClient.get(`/late/reject?userId=${userId}`),
  cancel: () => axiosClient.get('/late/cancel'),
};

export default lateRequestApi;
