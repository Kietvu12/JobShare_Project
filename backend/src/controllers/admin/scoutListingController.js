import { listCvOnScout, unlistCvFromScout } from '../../services/scoutListingService.js';

function handleScoutError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

export const scoutListingController = {
  /**
   * POST /api/admin/cvs/:id/scout/list
   */
  listCv: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID hồ sơ không hợp lệ' });
      }
      const { note, scoutPublicSummary } = req.body || {};
      const { cv, alreadyListed } = await listCvOnScout({
        cvId,
        adminId: req.admin.id,
        note,
        scoutPublicSummary,
      });
      return res.json({
        success: true,
        message: alreadyListed ? 'Hồ sơ đã trên sàn Scout' : 'Đã đưa hồ sơ lên sàn Scout',
        data: { cv: cv.toJSON(), alreadyListed },
      });
    } catch (error) {
      return handleScoutError(res, error, next);
    }
  },

  /**
   * POST /api/admin/cvs/:id/scout/unlist
   */
  unlistCv: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID hồ sơ không hợp lệ' });
      }
      const { note, suspend } = req.body || {};
      const { cv, alreadyUnlisted } = await unlistCvFromScout({
        cvId,
        adminId: req.admin.id,
        note,
        suspend: suspend === true || suspend === 'true' || suspend === 1,
      });
      return res.json({
        success: true,
        message: alreadyUnlisted ? 'Hồ sơ chưa trên sàn Scout' : 'Đã gỡ hồ sơ khỏi sàn Scout',
        data: { cv: cv.toJSON(), alreadyUnlisted },
      });
    } catch (error) {
      return handleScoutError(res, error, next);
    }
  },

  /**
   * POST /api/admin/cvs/scout/bulk-list
   * body: { cvIds: number[] }
   */
  bulkList: async (req, res, next) => {
    try {
      const raw = req.body?.cvIds;
      const cvIds = Array.isArray(raw)
        ? raw.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n) && n > 0)
        : [];
      if (!cvIds.length) {
        return res.status(400).json({ success: false, message: 'Danh sách hồ sơ trống' });
      }
      const results = [];
      let successCount = 0;
      let failedCount = 0;
      for (const cvId of cvIds) {
        try {
          const { cv, alreadyListed } = await listCvOnScout({ cvId, adminId: req.admin.id });
          results.push({ cvId, success: true, alreadyListed, scoutStatus: cv.scoutStatus });
          successCount += 1;
        } catch (error) {
          failedCount += 1;
          results.push({ cvId, success: false, message: error.message });
        }
      }
      return res.json({
        success: failedCount === 0,
        message: `Đã xử lý ${successCount}/${cvIds.length} hồ sơ`,
        data: { successCount, failedCount, results },
      });
    } catch (error) {
      return handleScoutError(res, error, next);
    }
  },

  /**
   * POST /api/admin/cvs/scout/bulk-unlist
   */
  bulkUnlist: async (req, res, next) => {
    try {
      const raw = req.body?.cvIds;
      const cvIds = Array.isArray(raw)
        ? raw.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n) && n > 0)
        : [];
      if (!cvIds.length) {
        return res.status(400).json({ success: false, message: 'Danh sách hồ sơ trống' });
      }
      const results = [];
      let successCount = 0;
      let failedCount = 0;
      for (const cvId of cvIds) {
        try {
          const { cv, alreadyUnlisted } = await unlistCvFromScout({ cvId, adminId: req.admin.id });
          results.push({ cvId, success: true, alreadyUnlisted, scoutStatus: cv.scoutStatus });
          successCount += 1;
        } catch (error) {
          failedCount += 1;
          results.push({ cvId, success: false, message: error.message });
        }
      }
      return res.json({
        success: failedCount === 0,
        message: `Đã xử lý ${successCount}/${cvIds.length} hồ sơ`,
        data: { successCount, failedCount, results },
      });
    } catch (error) {
      return handleScoutError(res, error, next);
    }
  },
};

export default scoutListingController;
