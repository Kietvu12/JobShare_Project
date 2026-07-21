import { BusinessCreditHistory } from '../../models/index.js';

export const businessCreditController = {
  getCredit: async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: {
          credit: Number(req.business.credit) || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getCreditHistory: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const offset = (page - 1) * limit;

      const { count, rows } = await BusinessCreditHistory.findAndCountAll({
        where: { businessId: req.business.id },
        limit,
        offset,
        order: [['created_at', 'DESC']],
        attributes: [
          'id',
          'changeAmount',
          'balanceBefore',
          'balanceAfter',
          'type',
          'note',
          'createdAt',
        ],
      });

      res.json({
        success: true,
        data: {
          credit: Number(req.business.credit) || 0,
          histories: rows,
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit) || 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
