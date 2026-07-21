import { listCvOnScout, unlistCvFromScout } from '../../services/scoutListingService.js';

function handleScoutError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

export const scoutListingController = {
  /**
   * POST /api/ctv/cvs/:id/scout/list
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
        collaboratorId: req.collaborator.id,
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
   * POST /api/ctv/cvs/:id/scout/unlist
   */
  unlistCv: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID hồ sơ không hợp lệ' });
      }
      const { note } = req.body || {};
      const { cv, alreadyUnlisted } = await unlistCvFromScout({
        cvId,
        collaboratorId: req.collaborator.id,
        note,
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
};

export default scoutListingController;
