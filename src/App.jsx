import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AttendancePage from './pages/AttendancePage';
import LateRequestPage from './pages/LateRequestPage';
import AdminEmployeePage from './pages/admin/AdminEmployeePage';
import AdminAttendancePage from './pages/admin/AdminAttendancePage';
import AdminLateRequestPage from './pages/admin/AdminLateRequestPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* Employee routes */}
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="late-requests" element={<LateRequestPage />} />
            {/* Admin routes */}
            <Route
              path="admin/employees"
              element={<PrivateRoute adminOnly><AdminEmployeePage /></PrivateRoute>}
            />
            <Route
              path="admin/attendance"
              element={<PrivateRoute adminOnly><AdminAttendancePage /></PrivateRoute>}
            />
            <Route
              path="admin/late-requests"
              element={<PrivateRoute adminOnly><AdminLateRequestPage /></PrivateRoute>}
            />
            {/* Default redirect */}
            <Route index element={<Navigate to="/attendance" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
