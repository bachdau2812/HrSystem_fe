import { useState, useEffect } from 'react';
import attendanceApi from '../api/attendanceApi';
import { getErrorMessage } from '../api/apiUtils';

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

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function AttendancePage() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.substring(0, 8) + '01';
  const now = useClock();

  const [checkInResult, setCheckInResult] = useState(null);
  const [checkOutResult, setCheckOutResult] = useState(null);
  const [loadingCI, setLoadingCI] = useState(false);
  const [loadingCO, setLoadingCO] = useState(false);
  const [ciError, setCiError] = useState('');
  const [coError, setCoError] = useState('');

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recError, setRecError] = useState('');

  const fetchRecords = async () => {
    setLoadingRecords(true);
    setRecError('');
    try {
      const { data } = await attendanceApi.getMyAttendance({ from, to });
      setRecords(data.result || []);
    } catch (err) {
      setRecError(getErrorMessage(err, 'Không thể tải dữ liệu điểm danh.'));
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleCheckIn = async () => {
    setLoadingCI(true);
    setCiError('');
    setCheckInResult(null);
    try {
      const { data } = await attendanceApi.checkIn();
      setCheckInResult(data.result);
      fetchRecords();
    } catch (err) {
      setCiError(getErrorMessage(err, 'Check-in thất bại.'));
    } finally {
      setLoadingCI(false);
    }
  };

  const handleCheckOut = async () => {
    setLoadingCO(true);
    setCoError('');
    setCheckOutResult(null);
    try {
      const { data } = await attendanceApi.checkOut();
      setCheckOutResult(data.result);
      fetchRecords();
    } catch (err) {
      setCoError(getErrorMessage(err, 'Check-out thất bại.'));
    } finally {
      setLoadingCO(false);
    }
  };

  const todayRecord = records.find((r) => r.attendanceDate === today);
  const checkedIn  = !!todayRecord?.checkInTime;
  const checkedOut = !!todayRecord?.checkOutTime;

  return (
    <div className="page">
      <h2 className="page-title">📋 Điểm danh</h2>

      {/* Check in / out card */}
      <div className="card checkin-card">
        <div className="clock-display">
          {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="clock-date">
          {now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {todayRecord && (
          <div className="today-status">
            <span className={`badge ${STATUS_CLASS[todayRecord.attendanceStatus]}`}>
              {STATUS_LABEL[todayRecord.attendanceStatus]}
            </span>
            <span className="time-display">
              Vào: <b>{formatTime(todayRecord.checkInTime)}</b>
              {todayRecord.checkOutTime && <> &nbsp;|&nbsp; Ra: <b>{formatTime(todayRecord.checkOutTime)}</b></>}
            </span>
          </div>
        )}

        <div className="checkin-actions">
          <button
            className={`btn btn-success btn-lg${!checkedIn ? ' btn-checkin-pulse' : ''}`}
            onClick={handleCheckIn}
            disabled={loadingCI || checkedIn}
          >
            {loadingCI ? <><span className="spinner" style={{width:18,height:18,borderWidth:2}} /> Đang xử lý...</> : '✅ Check-in'}
          </button>
          <button
            className="btn btn-danger btn-lg"
            onClick={handleCheckOut}
            disabled={loadingCO || !checkedIn || checkedOut}
          >
            {loadingCO ? <><span className="spinner" style={{width:18,height:18,borderWidth:2}} /> Đang xử lý...</> : '🚪 Check-out'}
          </button>
        </div>

        {checkInResult && (
          <div className="alert alert-success">
            ✅ Check-in lúc <b>{formatTime(checkInResult.checkInTime)}</b> — {STATUS_LABEL[checkInResult.attendanceStatus]}
          </div>
        )}
        {checkOutResult && <div className="alert alert-success">✅ Check-out thành công!</div>}
        {ciError && <div className="alert alert-error">⚠️ {ciError}</div>}
        {coError && <div className="alert alert-error">⚠️ {coError}</div>}
      </div>

      {/* History */}
      <div className="card">
        <div className="card-header">
          <h3>📅 Lịch sử điểm danh</h3>
          <div className="filter-row">
            <div className="form-group">
              <label>Từ ngày</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={fetchRecords} disabled={loadingRecords}
              style={{alignSelf:'flex-end', marginBottom:'1px'}}>
              Lọc
            </button>
          </div>
        </div>
        {recError && <div className="alert alert-error">⚠️ {recError}</div>}
        {loadingRecords ? (
          <div className="loading"><div className="spinner" /><span>Đang tải...</span></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Giờ vào</th>
                  <th>Giờ ra</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan="4" className="text-center">Không có dữ liệu</td></tr>
                ) : (
                  records.map((r) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}