import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/apiUtils';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [authWarning, setAuthWarning] = useState('');
  const [loading, setLoading] = useState(false);

  // Hiển thị thông báo lỗi token được lưu trước khi redirect về login
  useEffect(() => {
    const msg = sessionStorage.getItem('authError');
    if (msg) {
      setAuthWarning(msg);
      sessionStorage.removeItem('authError');
    }
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const decoded = await login(form.username, form.password);
      const role = decoded.scope || decoded.role || '';
      if (role.includes('ADMIN')) navigate('/admin/employees');
      else navigate('/attendance');
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập thất bại. Kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">🏢</span>
          <h1>HR System</h1>
          <p>Hệ thống quản lý nhân sự</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          {authWarning && (
            <div className="alert alert-warning">
              <span className="alert-icon">⚠️</span>
              {authWarning}
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
