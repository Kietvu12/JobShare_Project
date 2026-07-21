import {
  approveAndPublishListing,
  closeBusinessListing,
  createBusinessListing,
  getBusinessDashboard,
  listAdminListings,
  listBusinessListings,
  listBusinessNominations,
  listBusinessSettlements,
  pauseBusinessListing,
  rejectListing,
  submitListingForApproval,
  updateBusinessListing,
  adminPauseListing,
  adminPublishListing,
} from '../../services/candidateSharingService.js';

export const businessCandidateSharingController = {
  getDashboard: async (req, res, next) => {
    try {
      const data = await getBusinessDashboard({ businessId: req.business.id });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  listListings: async (req, res, next) => {
    try {
      const data = await listBusinessListings({
        businessId: req.business.id,
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        search: req.query.search,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  createListing: async (req, res, next) => {
    try {
      const listing = await createBusinessListing({ businessId: req.business.id, payload: req.body });
      res.status(201).json({ success: true, data: { listing } });
    } catch (e) {
      next(e);
    }
  },

  updateListing: async (req, res, next) => {
    try {
      const listing = await updateBusinessListing({
        businessId: req.business.id,
        listingId: req.params.id,
        payload: req.body,
      });
      res.json({ success: true, data: { listing } });
    } catch (e) {
      next(e);
    }
  },

  submitListing: async (req, res, next) => {
    try {
      const listing = await submitListingForApproval({
        businessId: req.business.id,
        listingId: req.params.id,
      });
      res.json({ success: true, data: { listing }, message: 'Đã gửi yêu cầu duyệt cho WS' });
    } catch (e) {
      next(e);
    }
  },

  pauseListing: async (req, res, next) => {
    try {
      const listing = await pauseBusinessListing({ businessId: req.business.id, listingId: req.params.id });
      res.json({ success: true, data: { listing } });
    } catch (e) {
      next(e);
    }
  },

  closeListing: async (req, res, next) => {
    try {
      const listing = await closeBusinessListing({ businessId: req.business.id, listingId: req.params.id });
      res.json({ success: true, data: { listing } });
    } catch (e) {
      next(e);
    }
  },

  listNominations: async (req, res, next) => {
    try {
      const data = await listBusinessNominations({
        businessId: req.business.id,
        page: req.query.page,
        limit: req.query.limit,
        listingId: req.query.listingId,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  listSettlements: async (req, res, next) => {
    try {
      const data = await listBusinessSettlements({
        businessId: req.business.id,
        page: req.query.page,
        limit: req.query.limit,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};

export const adminCandidateSharingController = {
  listListings: async (req, res, next) => {
    try {
      const data = await listAdminListings({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        search: req.query.search,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  approve: async (req, res, next) => {
    try {
      const listing = await approveAndPublishListing({
        listingId: req.params.id,
        adminId: req.admin.id,
        adminNote: req.body.adminNote,
        autoPublish: req.body.autoPublish !== false,
      });
      res.json({ success: true, data: { listing }, message: 'Đã duyệt và publish lên sàn CTV' });
    } catch (e) {
      next(e);
    }
  },

  reject: async (req, res, next) => {
    try {
      const listing = await rejectListing({
        listingId: req.params.id,
        adminId: req.admin.id,
        rejectionReason: req.body.rejectionReason,
        adminNote: req.body.adminNote,
      });
      res.json({ success: true, data: { listing }, message: 'Đã từ chối listing' });
    } catch (e) {
      next(e);
    }
  },

  pause: async (req, res, next) => {
    try {
      const listing = await adminPauseListing({ listingId: req.params.id });
      res.json({ success: true, data: { listing } });
    } catch (e) {
      next(e);
    }
  },

  publish: async (req, res, next) => {
    try {
      const listing = await adminPublishListing({ listingId: req.params.id, adminId: req.admin.id });
      res.json({ success: true, data: { listing } });
    } catch (e) {
      next(e);
    }
  },
};

export default businessCandidateSharingController;
