import { sendBusinessDocumentDownloadEmail } from '../../services/businessDocumentDownloadService.js';

export const businessDocumentDownloadController = {
  requestDownload: async (req, res, next) => {
    try {
      const company = String(req.body?.company || '').trim();
      const email = String(req.body?.email || '').trim();
      const business = String(req.body?.business || '').trim();
      const lang = req.body?.lang;

      if (!company) {
        return res.status(400).json({ success: false, message: 'Company name is required' });
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Valid email is required' });
      }
      if (!business) {
        return res.status(400).json({ success: false, message: 'Industry / business area is required' });
      }

      const result = await sendBusinessDocumentDownloadEmail({ company, email, business, lang });
      return res.json({
        success: true,
        message: 'Document sent',
        data: result,
      });
    } catch (err) {
      console.error('[businessDocumentDownload]', err);
      if (err?.code === 'BUSINESS_DOCUMENT_PDF_MISSING') {
        return res.status(503).json({
          success: false,
          message: 'Tài liệu PDF chưa được cấu hình trên server. Vui lòng đặt file vào backend/assets/business hoặc BUSINESS_DOCUMENT_PDF_PATH.',
        });
      }
      return next(err);
    }
  },
};
