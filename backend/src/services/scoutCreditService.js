import sequelize from '../config/database.js';
import {
  BusinessScoutUnlock,
  BusinessSavedCandidate,
  ScoutSetting,
  CVStorage,
} from '../models/index.js';
import { adjustBusinessCredit, CREDIT_HISTORY_TYPES } from './businessCreditService.js';
import {
  DEFAULT_SCOUT_CREDIT_COST,
  SCOUT_CREDIT_REFERENCE_TYPE,
  SCOUT_LISTING_STATUS,
  SCOUT_UNLOCK_TYPES,
  canCvBeListedOnScout,
} from '../constants/scoutCredit.js';

export async function getScoutCreditCost() {
  const row = await ScoutSetting.findByPk(1);
  const cost = Number(row?.scoutCreditCost);
  return Number.isFinite(cost) && cost > 0 ? cost : DEFAULT_SCOUT_CREDIT_COST;
}

/**
 * Doanh nghiệp mở khóa hồ sơ Scout Credit (idempotent nếu đã mở).
 */
export async function unlockScoutCvForBusiness({ businessId, cvId }) {
  const cost = await getScoutCreditCost();

  return sequelize.transaction(async (transaction) => {
    const existing = await BusinessScoutUnlock.findOne({
      where: {
        businessId,
        cvId,
        unlockType: SCOUT_UNLOCK_TYPES.SCOUT_CREDIT,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existing) {
      return { unlock: existing, alreadyUnlocked: true, creditCost: existing.creditCost };
    }

    const cv = await CVStorage.findByPk(cvId, { transaction });
    if (!cv) {
      const err = new Error('Không tìm thấy hồ sơ');
      err.statusCode = 404;
      throw err;
    }
    if (Number(cv.scoutStatus) !== SCOUT_LISTING_STATUS.LISTED) {
      const err = new Error('Hồ sơ không còn trên sàn Scout');
      err.statusCode = 400;
      throw err;
    }
    if (!canCvBeListedOnScout(cv)) {
      const err = new Error('Hồ sơ không còn hợp lệ trên sàn Scout');
      err.statusCode = 400;
      throw err;
    }

    const unlock = await BusinessScoutUnlock.create(
      {
        businessId,
        cvId,
        unlockType: SCOUT_UNLOCK_TYPES.SCOUT_CREDIT,
        creditCost: cost,
        unlockedAt: new Date(),
      },
      { transaction },
    );

    const { history } = await adjustBusinessCredit({
      businessId,
      changeAmount: -cost,
      type: CREDIT_HISTORY_TYPES.USAGE,
      note: `Mở hồ sơ Scout Credit — CV #${cv.code || cvId}`,
      referenceType: SCOUT_CREDIT_REFERENCE_TYPE,
      referenceId: unlock.id,
      transaction,
    });

    await unlock.update({ creditHistoryId: history.id }, { transaction });

    const [saved, created] = await BusinessSavedCandidate.findOrCreate({
      where: { businessId, cvId },
      defaults: {
        source: SCOUT_UNLOCK_TYPES.SCOUT_CREDIT,
        scoutUnlockId: unlock.id,
        pipelineStatus: 'new',
        savedAt: new Date(),
      },
      transaction,
    });

    if (!created && !saved.scoutUnlockId) {
      await saved.update(
        { scoutUnlockId: unlock.id, source: SCOUT_UNLOCK_TYPES.SCOUT_CREDIT },
        { transaction },
      );
    }

    return { unlock, saved, creditCost: cost, alreadyUnlocked: false, history };
  });
}

export default {
  getScoutCreditCost,
  unlockScoutCvForBusiness,
};
