import {
  listAdminReferralInvoices,
  confirmAdminReferralInvoicePaid,
} from '../../services/adminBusinessReferralInvoiceService.js';

export const businessPaymentController = {
  listReferralInvoices: async (req, res, next) => {
    try {
      const data = await listAdminReferralInvoices({
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        status: req.query.status,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  confirmReferralInvoicePaid: async (req, res, next) => {
    try {
      const { invoice } = await confirmAdminReferralInvoicePaid({
        invoiceId: req.params.id,
        adminId: req.user?.id || null,
        note: req.body?.note,
      });
      res.json({ success: true, data: { invoice } });
    } catch (error) {
      next(error);
    }
  },
};
