/**
 * Sau multer: multipart gửi JSON trong field `data`.
 * Gộp vào req.body để controller đọc jobCode, title, … trực tiếp.
 */
export function parseMultipartJobData(req, res, next) {
  const raw = req.body?.data;
  if (raw == null || raw === '') return next();

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return res.status(400).json({
        success: false,
        message: 'Trường data phải là object JSON hợp lệ',
      });
    }
    req.body = parsed;
  } catch {
    return res.status(400).json({
      success: false,
      message: 'Trường data không phải JSON hợp lệ',
    });
  }

  next();
}
