import { listBusinessKnowledgeCategories } from '../../services/postPublicService.js';

export const businessKnowledgeController = {
  listCategories: async (req, res, next) => {
    try {
      const categories = await listBusinessKnowledgeCategories();
      res.json({
        success: true,
        data: { categories },
      });
    } catch (err) {
      next(err);
    }
  },
};
