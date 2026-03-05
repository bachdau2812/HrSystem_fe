import axiosClient from './axiosClient';

const attendanceApi = {
  checkIn: () => axiosClient.get('/attendance/check_in'),
  checkOut: () => axiosClient.get('/attendance/check_out'),
  getMyAttendance: (data) => axiosClient.post('/attendance/my_attendance', data),
  getAttendanceOfUser: (userId, data) =>
    axiosClient.post(`/attendance/of_user?userId=${userId}`, data),
  getAttendanceOfDay: (data) => axiosClient.post('/attendance/of_day', data),
};

export default attendanceApi;
