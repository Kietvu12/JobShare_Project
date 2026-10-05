import { sendBusinessContactInquiryEmail } from '../../services/businessContactInquiryService.js';

export const businessContactInquiryController = {
  submit: async (req, res, next) => {
    try {
      const company = String(req.body?.company || '').trim();
      const email = String(req.body?.email || '').trim();
      const business = String(req.body?.business || '').trim();
      const message = String(req.body?.message || '').trim();
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
      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      await sendBusinessContactInquiryEmail({ company, email, business, message, lang });
      return res.json({ success: true, message: 'Inquiry received' });
    } catch (err) {
      console.error('[businessContactInquiry]', err);
      return next(err);
    }
  },
};
