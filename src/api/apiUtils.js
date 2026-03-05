import { ApiError } from './axiosClient';

/**
 * Lấy message lỗi từ bất kỳ loại error nào.
 *  - ApiError (từ interceptor): dùng err.message (đã là message từ server)
 *  - Axios error thuần: dùng err.response?.data?.message
 *  - Lỗi khác: dùng err.message
 *  - Nếu không có gì: dùng fallback
 */
export function getErrorMessage(err, fallback = 'Có lỗi xảy ra.') {
  if (!err) return fallback;
  if (err instanceof ApiError || err?.name === 'ApiError') {
    return err.message || fallback;
  }
  return err?.response?.data?.message || err?.message || fallback;
}

/**
 * Lấy result từ response an toàn.
 * Dùng khi cần lấy data.result sau khi await axiosClient call.
 */
export function getResult(response) {
  return response?.data?.result ?? null;
}
