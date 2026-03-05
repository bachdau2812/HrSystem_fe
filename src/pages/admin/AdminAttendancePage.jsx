import { useState, useEffect } from 'react';
import attendanceApi from '../../api/attendanceApi';
import employeeApi from '../../api/employeeApi';
import { getErrorMessage } from '../../api/apiUtils';

const STATUS_LABEL = { PRESENT: 'Đúng giờ', LATE: 'Đi muộn', ABSENT: 'Vắng' };
const STATUS_CLASS = { PRESENT: 'badge-success', LATE: 'badge-warning', ABSENT: 'badge-danger' };

function formatTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('vi-VN');
}

export default function AdminAttendancePage() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.substring(0, 8) + '01';

  const [tab, setTab] = useState('user'); // 'user' | 'day'

  // ── Tab: theo nhân viên ──
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Tab: theo ngày ──
  const [dayFrom, setDayFrom] = useState(today);
  const [dayTo, setDayTo] = useState(today);
  const [dayRecords, setDayRecords] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState('');

  useEffect(() => {
    employeeApi.getAll()
      .then(({ data }) => setEmployees(data.result || []))
      .catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!selectedUser) { setError('Vui lòng chọn nhân viên.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await attendanceApi.getAttendanceOfUser(selectedUser, { from, to });
      setRecords(data.result || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải dữ liệu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByDay = async () => {
    setDayLoading(true);
    setDayError('');
    try {
      const { data } = await attendanceApi.getAttendanceOfDay({ from: dayFrom, to: dayTo });
      setDayRecords(data.result || []);
    } catch (err) {
      setDayError(getErrorMessage(err, 'Không thể tải dữ liệu điểm danh.'));
    } finally {
      setDayLoading(false);
    }
  };

  const stats = records.reduce((acc, r) => {
    acc[r.attendanceStatus] = (acc[r.attendanceStatus] || 0) + 1;
    return acc;
  }, {});

  const dayStats = dayRecords.reduce((acc, r) => {
    acc[r.attendanceStatus] = (acc[r.attendanceStatus] || 0) + 1;
    return acc;
  }, {});

  // Tra cứu tên nhân viên theo userId
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  return (
    <div className="page">
      <h2 className="page-title">📊 Bảng điểm danh nhân viên</h2>

      {/* Tab switcher */}
      <div className="tab-bar">
        <button
          className={`tab-btn${tab === 'user' ? ' tab-btn-active' : ''}`}
          onClick={() => setTab('user')}
        >
          👤 Theo nhân viên
        </button>
        <button
          className={`tab-btn${tab === 'day' ? ' tab-btn-active' : ''}`}
          onClick={() => setTab('day')}
        >
          📅 Điểm danh theo ngày
        </button>
      </div>

      {/* ── TAB: THEO NHÂN VIÊN ── */}
      {tab === 'user' && (
        <>
          <div className="card">
            <div className="filter-row filter-wrap">
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
              <div className="form-group">
                <label>Từ ngày</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Đến ngày</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                Xem điểm danh
              </button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
          </div>

          {records.length > 0 && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-number">{records.length}</span>
                  <span className="stat-label">Tổng ngày</span>
                </div>
                <div className="stat-card stat-success">
                  <span className="stat-number">{stats.PRESENT || 0}</span>
                  <span className="stat-label">Đúng giờ</span>
                </div>
                <div className="stat-card stat-warning">
                  <span className="stat-number">{stats.LATE || 0}</span>
                  <span className="stat-label">Đi muộn</span>
                </div>
                <div className="stat-card stat-danger">
                  <span className="stat-number">{stats.ABSENT || 0}</span>
                  <span className="stat-label">Vắng mặt</span>
                </div>
              </div>
              <div className="card">
                {loading ? (
                  <div className="loading"><div className="spinner" /><span>Đang tải...</span></div>
                ) : (
                  <div className="table-wrapper"><table className="table">
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Giờ vào</th>
                        <th>Giờ ra</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id}>
                          <td>{formatDate(r.attendanceDate)}</td>
                          <td>{formatTime(r.checkInTime)}</td>
                          <td>{formatTime(r.checkOutTime)}</td>
                          <td>
                            <span className={`badge ${STATUS_CLASS[r.attendanceStatus]}`}>
                              {STATUS_LABEL[r.attendanceStatus]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── TAB: THEO NGÀY ── */}
      {tab === 'day' && (
        <>
          <div className="card">
            <div className="filter-row filter-wrap">
              <div className="form-group">
                <label>Từ ngày</label>
                <input type="date" value={dayFrom} onChange={(e) => setDayFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Đến ngày</label>
                <input type="date" value={dayTo} onChange={(e) => setDayTo(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleSearchByDay} disabled={dayLoading}
                style={{ alignSelf: 'flex-end', marginBottom: '1px' }}>
                {dayLoading ? 'Đang tải...' : 'Xem điểm danh'}
              </button>
            </div>
            {dayError && <div className="alert alert-error">{dayError}</div>}
          </div>

          {dayRecords.length > 0 && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-number">{dayRecords.length}</span>
                  <span className="stat-label">Tổng bản ghi</span>
                </div>
                <div className="stat-card stat-success">
                  <span className="stat-number">{dayStats.PRESENT || 0}</span>
                  <span className="stat-label">Đúng giờ</span>
                </div>
                <div className="stat-card stat-warning">
                  <span className="stat-number">{dayStats.LATE || 0}</span>
                  <span className="stat-label">Đi muộn</span>
                </div>
                <div className="stat-card stat-danger">
                  <span className="stat-number">{dayStats.ABSENT || 0}</span>
                  <span className="stat-label">Vắng mặt</span>
                </div>
              </div>
              <div className="card">
                <div className="table-wrapper"><table className="table">
                  <thead>
                    <tr>
                      <th>Nhân viên</th>
                      <th>Ngày</th>
                      <th>Giờ vào</th>
                      <th>Giờ ra</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayRecords.map((r) => {
                      const emp = empMap[r.userId];
                      return (
                        <tr key={r.id}>
                          <td>
                            <b>{emp?.fullName || r.userId}</b>
                            {emp && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.username}</div>}
                          </td>
                          <td>{formatDate(r.attendanceDate)}</td>
                          <td>{formatTime(r.checkInTime)}</td>
                          <td>{formatTime(r.checkOutTime)}</td>
                          <td>
                            <span className={`badge ${STATUS_CLASS[r.attendanceStatus]}`}>
                              {STATUS_LABEL[r.attendanceStatus]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
              </div>
            </>
          )}

          {!dayLoading && dayRecords.length === 0 && dayError === '' && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Chọn khoảng ngày và nhấn <b>Xem điểm danh</b> để tải dữ liệu.
            </div>
          )}
        </>
      )}
    </div>
  );
}
