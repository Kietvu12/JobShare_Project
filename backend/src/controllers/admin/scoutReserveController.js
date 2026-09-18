import {
  listScoutReserveCvs,
  getScoutReserveCvDetail,
  relistScoutReserveCv,
} from '../../services/scoutReserveService.js';

function handleError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      missing: error.missing,
    });
  }
  return next(error);
}

export const scoutReserveController = {
  /** GET /api/admin/scout-reserve */
  list: async (req, res, next) => {
    try {
      const { search, page, limit } = req.query;
      const data = await listScoutReserveCvs({ search, page, limit });
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  /** GET /api/admin/scout-reserve/:id */
  detail: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
      }
      const data = await getScoutReserveCvDetail(cvId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  /** POST /api/admin/scout-reserve/:id/relist */
  relist: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
      }
      const { scoutPublicSummary, note } = req.body || {};
      const result = await relistScoutReserveCv({
        cvId,
        adminId: req.admin.id,
        scoutPublicSummary,
        note,
      });
      return res.json({
        success: true,
        message: result.alreadyListed ? 'Hồ sơ đã trên sàn Scout' : 'Đã đưa hồ sơ lên sàn Scout',
        data: result,
      });
    } catch (error) {
      return handleError(res, error, next);
    }
  },
};

export default scoutReserveController;
