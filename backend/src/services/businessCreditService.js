import sequelize from '../config/database.js';
import { Business, BusinessCreditHistory } from '../models/index.js';

export const CREDIT_HISTORY_TYPES = {
  ADMIN_GRANT: 'admin_grant',
  ADMIN_DEDUCT: 'admin_deduct',
  USAGE: 'usage',
  ADJUSTMENT: 'adjustment',
};

/** reference_type trong business_credit_histories */
export const CREDIT_REFERENCE_TYPES = {
  SCOUT_UNLOCK: 'scout_unlock',
  CREDIT_REQUEST: 'credit_request',
};

/**
 * Điều chỉnh credit doanh nghiệp và ghi lịch sử (transaction).
 * @param {number} changeAmount — dương = cộng, âm = trừ
 */
export async function adjustBusinessCredit({
  businessId,
  changeAmount,
  type,
  note = null,
  adminId = null,
  referenceType = null,
  referenceId = null,
  transaction: externalTx = null,
}) {
  const run = async (transaction) => {
    const business = await Business.findByPk(businessId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!business) {
      const err = new Error('Không tìm thấy doanh nghiệp');
      err.statusCode = 404;
      throw err;
    }

    const delta = Math.trunc(Number(changeAmount));
    if (!Number.isFinite(delta) || delta === 0) {
      const err = new Error('Số credit thay đổi không hợp lệ');
      err.statusCode = 400;
      throw err;
    }

    const balanceBefore = Number(business.credit) || 0;
    const balanceAfter = balanceBefore + delta;
    if (balanceAfter < 0) {
      const err = new Error('Số credit không đủ để khấu trừ');
      err.statusCode = 400;
      throw err;
    }

    await business.update({ credit: balanceAfter }, { transaction });
    const history = await BusinessCreditHistory.create(
      {
        businessId,
        changeAmount: delta,
        balanceBefore,
        balanceAfter,
        type,
        note: note ? String(note).trim() : null,
        adminId: adminId || null,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
      },
      { transaction }
    );

    return { business, history, balanceBefore, balanceAfter };
  };

  if (externalTx) return run(externalTx);
  return sequelize.transaction(run);
}

export default { adjustBusinessCredit, CREDIT_HISTORY_TYPES };
