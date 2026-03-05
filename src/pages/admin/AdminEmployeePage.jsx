import { useState, useEffect } from 'react';
import employeeApi from '../../api/employeeApi';
import { getErrorMessage } from '../../api/apiUtils';

const ROLES = ['ADMIN', 'EMPLOYEE'];
const STATUS_CLASS = { ACTIVE: 'badge-success', INACTIVE: 'badge-danger' };
const STATUS_LABEL = { ACTIVE: 'Đang làm việc', INACTIVE: 'Nghỉ việc' };

const EMPTY_FORM = {
  username: '', password: '', fullName: '', email: '', phone: '', department: '', role: 'EMPLOYEE',
};

export default function AdminEmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);

  const limit = 10;

  const fetchEmployees = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await employeeApi.getPage(p, limit, 'username');
      setEmployees(data.result || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách nhân viên.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(1); }, []);

  const handlePageChange = (p) => { setPage(p); fetchEmployees(p); };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditId(emp.id);
    setForm({
      username: emp.username,
      password: '',
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      role: emp.role,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (editId) {
        const payload = { ...form };
        delete payload.password;
        await employeeApi.update(editId, payload);
      } else {
        await employeeApi.create(form);
      }
      setShowModal(false);
      fetchEmployees(page);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Thao tác thất bại.'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xoá nhân viên này?')) return;
    try {
      await employeeApi.deleteEmployee(id);
      fetchEmployees(page);
    } catch (err) {
      alert(getErrorMessage(err, 'Xoá thất bại.'));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">👥 Quản lý nhân viên</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm nhân viên</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Đang tải...</span></div>
      ) : (
        <div className="card">
          <div className="table-wrapper"><table className="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Phòng ban</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan="8" className="text-center">Không có nhân viên</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td><b>{emp.fullName}</b></td>
                    <td>{emp.username}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phone}</td>
                    <td>{emp.department}</td>
                    <td>
                      <span className={`badge ${emp.role === 'ADMIN' ? 'badge-info' : 'badge-secondary'}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[emp.employeeStatus]}`}>
                        {STATUS_LABEL[emp.employeeStatus]}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(emp)}>Sửa</button>
                      {' '}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>Xoá</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
          <div className="pagination">
            <button className="btn btn-sm btn-outline" disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
              ← Trước
            </button>
            <span>Trang {page}</span>
            <button
              className="btn btn-sm btn-outline"
              disabled={employees.length < limit}
              onClick={() => handlePageChange(page + 1)}
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên đăng nhập *</label>
                  <input name="username" value={form.username} onChange={handleChange} required disabled={!!editId} />
                </div>
                {!editId && (
                  <div className="form-group">
                    <label>Mật khẩu *</label>
                    <input name="password" type="password" value={form.password} onChange={handleChange} required />
                  </div>
                )}
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Phòng ban</label>
                  <input name="department" value={form.department} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Vai trò</label>
                  <select name="role" value={form.role} onChange={handleChange}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Huỷ
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
