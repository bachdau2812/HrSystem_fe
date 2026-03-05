import axiosClient from './axiosClient';

const employeeApi = {
  getAll: () => axiosClient.get('/empl/all'),
  getPage: (page, limit, sortBy = 'fullName') =>
    axiosClient.get(`/empl/page?page=${page}&limit=${limit}&sortBy=${sortBy}`),
  getById: (id) => axiosClient.get(`/empl/by-id?id=${id}`),
  create: (data) => axiosClient.post('/empl/create', data),
  update: (id, data) => axiosClient.put(`/empl/update?id=${id}`, data),
  deleteEmployee: (employeeId) => axiosClient.delete(`/empl/del?employeeId=${employeeId}`),
};

export default employeeApi;
