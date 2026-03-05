import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from '../utils/jwtDecode';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, username, role, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await authApi.login({ username, password });
    const { accessToken, refreshToken, deviceInfo } = data.result;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (deviceInfo) localStorage.setItem('deviceInfo', deviceInfo);
    const decoded = jwtDecode(accessToken);
    setUser(decoded);
    return decoded;
  };

  const logout = async () => {
    try {
      await authApi.logout({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      });
    } catch {
      // ignore errors on logout
    }
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
