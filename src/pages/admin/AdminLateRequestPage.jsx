import { useState, useEffect } from 'react';
import lateRequestApi from '../../api/lateRequestApi';
import employeeApi from '../../api/employeeApi';
import { getErrorMessage } from '../../api/apiUtils';

const STATUS_LABEL = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CANCELLED: 'Đã huỷ',
};
const STATUS_CLASS = {
  PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger', CANCELLED: 'badge-secondary',
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('vi-VN');
}

export default function AdminLateRequestPage() {
  const today = new Date().toISOString().split('T')[0];
  const [filterMode, setFilterMode] = useState('date'); // 'date' | 'user'
  const [filterDate, setFilterDate] = useState(today);
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const limit = 10;

  useEffect(() => {
    employeeApi.getAll()
      .then(({ data }) => setEmployees(data.result || []))
      .catch(() => {});
    fetchByDate(today, 0);
  }, []);

  const fetchByDate = async (date, p) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await lateRequestApi.getByDate(p, limit, date);
      setRequests(data.result || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải dữ liệu.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchByUser = async (userId, p) => {
    if (!userId) { setError('Vui lòng chọn nhân viên.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await lateRequestApi.getByUserId(p, limit, userId);
      setRequests(data.result || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải dữ liệu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (p = 0) => {
    setPage(p);
    setActionMsg('');
    if (filterMode === 'date') fetchByDate(filterDate, p);
    else fetchByUser(selectedUser, p);
  };

  const handleApprove = async (userId) => {
    setActionMsg('');
    try {
      await lateRequestApi.approve(userId);
      setActionMsg('Đã duyệt đơn thành công!');
      handleSearch(page);
    } catch (err) {
      setActionMsg(getErrorMessage(err, 'Duyệt thất bại.'));
    }
  };

  const handleReject = async (userId) => {
    setActionMsg('');
    try {
      await lateRequestApi.reject(userId);
      setActionMsg('Đã từ chối đơn.');
      handleSearch(page);
    } catch (err) {
      setActionMsg(getErrorMessage(err, 'Từ chối thất bại.'));
    }
  };

  const getUserName = (userId) => {
    const emp = employees.find((e) => e.id === userId);
    return emp ? `${emp.fullName} (${emp.username})` : userId;
  };

  return (
    <div className="page">
      <h2 className="page-title">📝 Quản lý đơn xin muộn</h2>

      <div className="card">
        <div className="filter-row filter-wrap">
          <div className="form-group">
            <label>Lọc theo</label>
            <select value={filterMode} onChange={(e) => { setFilterMode(e.target.value); setRequests([]); }}>
              <option value="date">Ngày</option>
              <option value="user">Nhân viên</option>
            </select>
          </div>
          {filterMode === 'date' ? (
            <div className="form-group">
              <label>Ngày</label>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
          ) : (
            <div className="form-group">
              <label>Nhân viên</label>
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.username})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => handleSearch(0)} disabled={loading}>
            Tìm kiếm
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {actionMsg && <div className="alert alert-success">{actionMsg}</div>}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Đang tải...</span></div>
        ) : (
          <>
            <div className="table-wrapper"><table className="table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Ngày yêu cầu</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">Không có đơn nào</td></tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id}>
                      <td>{getUserName(r.userId)}</td>
                      <td>{formatDate(r.requestDate)}</td>
                      <td>{r.reason}</td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[r.lateRequestStatus]}`}>
                          {STATUS_LABEL[r.lateRequestStatus]}
                        </span>
                      </td>
                      <td>
                        {r.lateRequestStatus === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(r.userId)}
                            >
                              Duyệt
                            </button>
                            {' '}
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(r.userId)}
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {r.lateRequestStatus !== 'PENDING' && '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table></div>
            <div className="pagination">
              <button className="btn btn-sm btn-outline" disabled={page === 0} onClick={() => handleSearch(page - 1)}>
                ← Trước
              </button>
              <span>Trang {page + 1}</span>
              <button
                className="btn btn-sm btn-outline"
                disabled={requests.length < limit}
                onClick={() => handleSearch(page + 1)}
              >
                Sau →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
