import axios from 'axios';

const BASE_URL = 'http://192.168.1.82:82/v1';
const SUCCESS_CODE = 2000;

/**
 * Custom error cho lỗi tầng business (HTTP 200 nhưng code !== 2000).
 */
export class ApiError extends Error {
  constructor(message, apiCode) {
    super(message);
    this.name    = 'ApiError';
    this.apiCode = apiCode;
  }
}

/** Lưu thông báo lỗi rồi redirect về /login. Trả Promise treo để chặn caller xử lý tiếp. */
function forceLogout(friendlyMessage) {
  localStorage.clear();
  sessionStorage.setItem('authError', friendlyMessage);
  window.location.href = '/login';
  return new Promise(() => {});
}

/**
 * Refresh lock — chỉ 1 request refresh được gửi tại một thời điểm.
 * Các request khác chờ chung kết quả.
 */
let refreshingPromise = null;

async function doRefresh() {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const deviceInfo   = localStorage.getItem('deviceInfo');
      const res = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken, deviceInfo });
      const body = res.data;
      if (body?.code === SUCCESS_CODE) {
        const { accessToken, refreshToken: newRefresh, deviceInfo: newDevice } = body.result;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        localStorage.setItem('deviceInfo', newDevice);
        return accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

/**
 * Gọi /auth/introspect để kiểm tra token còn hợp lệ không.
 * Dùng raw axios để không bị vòng lặp interceptor.
 * Trả về true nếu hợp lệ, false nếu không.
 */
async function introspectToken(accessToken) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/introspect`, { accessToken });
    return res.data?.code === SUCCESS_CODE && res.data?.result?.valid === true;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// Các endpoint auth không cần kiểm tra token trước khi gửi
// ────────────────────────────────────────────────────────────
const SKIP_TOKEN_CHECK_URLS = [
  '/auth/login',
  '/auth/logout',
  '/auth/refresh-token',
  '/auth/introspect',
];

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor ── */
axiosClient.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem('accessToken');

  // Bỏ qua kiểm tra cho các endpoint auth
  const isAuthUrl = SKIP_TOKEN_CHECK_URLS.some((u) => config.url?.includes(u));
  if (isAuthUrl || !accessToken) {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  // Kiểm tra token có hợp lệ không (introspect)
  const valid = await introspectToken(accessToken);

  if (valid) {
    // Token ok → đính kèm và gửi request bình thường
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  // Token không hợp lệ → thử refresh
  const newToken = await doRefresh();
  if (newToken) {
    config.headers.Authorization = `Bearer ${newToken}`;
    return config;
  }

  // Refresh thất bại → force logout, trả Promise treo để request không được gửi đi
  return forceLogout('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
});

/* ── Response interceptor ── */
axiosClient.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body?.code !== SUCCESS_CODE) {
      return Promise.reject(new ApiError(body?.message || 'Có lỗi xảy ra từ máy chủ.', body?.code));
    }
    return res;
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || 'Không thể kết nối đến máy chủ.';
    return Promise.reject(new ApiError(msg, error.response?.status ?? 0));
  }
);

export default axiosClient;
