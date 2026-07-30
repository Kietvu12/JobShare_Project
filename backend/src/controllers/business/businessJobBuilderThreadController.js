import {
  createBusinessJobBuilderThread,
  deleteBusinessJobBuilderThread,
  getBusinessJobBuilderThread,
  getBusinessJobBuilderThreadByJobId,
  importLegacyBusinessJobBuilderThreads,
  listBusinessJobBuilderThreads,
  updateBusinessJobBuilderThread,
  upsertBusinessJobBuilderThread,
} from '../../services/businessJobBuilderThreadService.js';

export const businessJobBuilderThreadController = {
  async list(req, res, next) {
    try {
      // ?jobId= → full 1 thread (mở job). Không jobId → list nhẹ (sidebar).
      if (req.query.jobId != null && req.query.jobId !== '') {
        const thread = await getBusinessJobBuilderThreadByJobId(req.business.id, req.query.jobId);
        return res.json({ success: true, data: { threads: thread ? [thread] : [] } });
      }
      const threads = await listBusinessJobBuilderThreads(req.business.id);
      res.json({ success: true, data: { threads } });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const thread = await getBusinessJobBuilderThread(req.business.id, Number(req.params.id));
      if (!thread) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phiên chat' });
      }
      res.json({ success: true, data: { thread } });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const thread = await createBusinessJobBuilderThread(req.business.id, req.body || {});
      res.status(201).json({ success: true, data: { thread } });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const thread = await updateBusinessJobBuilderThread(
        req.business.id,
        Number(req.params.id),
        req.body || {},
      );
      res.json({ success: true, data: { thread } });
    } catch (err) {
      next(err);
    }
  },

  async upsert(req, res, next) {
    try {
      const thread = await upsertBusinessJobBuilderThread(req.business.id, req.body || {});
      res.json({ success: true, data: { thread } });
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await deleteBusinessJobBuilderThread(req.business.id, Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async importLegacy(req, res, next) {
    try {
      const result = await importLegacyBusinessJobBuilderThreads(
        req.business.id,
        req.body?.threads,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};

export default businessJobBuilderThreadController;
