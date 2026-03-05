import { useState, useEffect } from 'react';
import lateRequestApi from '../api/lateRequestApi';
import { getErrorMessage } from '../api/apiUtils';

const STATUS_LABEL = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã huỷ',
};
const STATUS_CLASS = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  CANCELLED: 'badge-secondary',
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('vi-VN');
}

export default function LateRequestPage() {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [cancelMsg, setCancelMsg] = useState('');

  const limit = 10;

  const fetchRequests = async (p = page) => {
    setLoading(true);
    setListError('');
    try {
      const { data } = await lateRequestApi.getMyList(p, limit);
      setRequests(data.result || []);
    } catch (err) {
      setListError(getErrorMessage(err, 'Không thể tải danh sách.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(0); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg({ type: '', text: '' });
    try {
      await lateRequestApi.create({ reason });
      setReason('');
      setSubmitMsg({ type: 'success', text: 'Đơn xin muộn đã được gửi thành công!' });
      fetchRequests(0);
      setPage(0);
    } catch (err) {
      setSubmitMsg({ type: 'error', text: getErrorMessage(err, 'Gửi đơn thất bại.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelMsg('');
    try {
      await lateRequestApi.cancel();
      setCancelMsg('Đã huỷ đơn xin muộn mới nhất.');
      fetchRequests(page);
    } catch (err) {
      setCancelMsg(getErrorMessage(err, 'Huỷ thất bại.'));
    }
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchRequests(p);
  };

  return (
    <div className="page">
      <h2 className="page-title">⏰ Đơn xin muộn</h2>

      {/* Create form */}
      <div className="card">
        <h3>Tạo đơn xin muộn hôm nay</h3>
        <form onSubmit={handleSubmit} className="inline-form">
          <div className="form-group">
            <label>Lý do</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do xin đi muộn..."
              rows={3}
              required
            />
          </div>
          {submitMsg.text && (
            <div className={`alert alert-${submitMsg.type === 'success' ? 'success' : 'error'}`}>
              {submitMsg.text}
            </div>
          )}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đơn'}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleCancel}>
              Huỷ đơn mới nhất
            </button>
          </div>
          {cancelMsg && <div className="alert alert-info">{cancelMsg}</div>}
        </form>
      </div>

      {/* List */}
      <div className="card">
        <div className="card-header">
          <h3>Danh sách đơn của tôi</h3>
        </div>
        {listError && <div className="alert alert-error">{listError}</div>}
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Đang tải...</span></div>
        ) : (
          <>
            <div className="table-wrapper"><table className="table">
              <thead>
                <tr>
                  <th>Ngày yêu cầu</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Duyệt bởi</th>
                  <th>Thời gian duyệt</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">Không có đơn nào</td></tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.requestDate)}</td>
                      <td>{r.reason}</td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[r.lateRequestStatus]}`}>
                          {STATUS_LABEL[r.lateRequestStatus]}
                        </span>
                      </td>
                      <td>{r.approvedBy || '—'}</td>
                      <td>{r.approvedAt ? new Date(r.approvedAt).toLocaleString('vi-VN') : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table></div>
            <div className="pagination">
              <button className="btn btn-sm btn-outline" disabled={page === 0} onClick={() => handlePageChange(page - 1)}>
                ← Trước
              </button>
              <span>Trang {page + 1}</span>
              <button
                className="btn btn-sm btn-outline"
                disabled={requests.length < limit}
                onClick={() => handlePageChange(page + 1)}
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
