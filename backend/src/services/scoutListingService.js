import sequelize from '../config/database.js';
import { CVStorage, ScoutListingLog } from '../models/index.js';
import {
  SCOUT_LISTING_ACTIONS,
  SCOUT_LISTING_STATUS,
  canCvBeListedOnScout,
} from '../constants/scoutCredit.js';

function buildDefaultScoutPublicSummary(cv) {
  const parts = [cv.careerSummary, cv.strengths, cv.motivation].filter(
    (s) => s && String(s).trim(),
  );
  return parts.length ? String(parts[0]).trim().slice(0, 5000) : null;
}

/**
 * Admin hoặc CTV đưa CV lên sàn Scout.
 */
export async function listCvOnScout({ cvId, adminId = null, collaboratorId = null, note = null, scoutPublicSummary = null }) {
  return sequelize.transaction(async (transaction) => {
    const cv = await CVStorage.findByPk(cvId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!cv) {
      const err = new Error('Không tìm thấy hồ sơ');
      err.statusCode = 404;
      throw err;
    }

    if (collaboratorId != null && Number(cv.collaboratorId) !== Number(collaboratorId)) {
      const err = new Error('Bạn không có quyền thao tác hồ sơ này');
      err.statusCode = 403;
      throw err;
    }

    if (!canCvBeListedOnScout(cv)) {
      const err = new Error('Hồ sơ không đủ điều kiện đăng Scout (cần trạng thái Hợp lệ, không trùng lặp)');
      err.statusCode = 400;
      throw err;
    }

    if (Number(cv.scoutStatus) === SCOUT_LISTING_STATUS.LISTED) {
      return { cv, alreadyListed: true };
    }

    const summary =
      scoutPublicSummary != null && String(scoutPublicSummary).trim()
        ? String(scoutPublicSummary).trim().slice(0, 5000)
        : cv.scoutPublicSummary || buildDefaultScoutPublicSummary(cv);

    const now = new Date();
    await cv.update(
      {
        scoutStatus: SCOUT_LISTING_STATUS.LISTED,
        scoutPublicSummary: summary,
        scoutListedAt: now,
        scoutUnlistedAt: null,
        scoutListedByAdminId: adminId ?? null,
        scoutListedByCollaboratorId: collaboratorId ?? null,
      },
      { transaction },
    );

    await ScoutListingLog.create(
      {
        cvId: cv.id,
        action: SCOUT_LISTING_ACTIONS.LIST,
        actorType: adminId != null ? 'admin' : 'collaborator',
        actorAdminId: adminId ?? null,
        actorCollaboratorId: collaboratorId ?? null,
        note,
      },
      { transaction },
    );

    return { cv, alreadyListed: false };
  });
}

/**
 * Gỡ CV khỏi sàn Scout.
 */
export async function unlistCvFromScout({
  cvId,
  adminId = null,
  collaboratorId = null,
  note = null,
  suspend = false,
}) {
  return sequelize.transaction(async (transaction) => {
    const cv = await CVStorage.findByPk(cvId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!cv) {
      const err = new Error('Không tìm thấy hồ sơ');
      err.statusCode = 404;
      throw err;
    }

    if (collaboratorId != null && Number(cv.collaboratorId) !== Number(collaboratorId)) {
      const err = new Error('Bạn không có quyền thao tác hồ sơ này');
      err.statusCode = 403;
      throw err;
    }

    const current = Number(cv.scoutStatus);
    if (current === SCOUT_LISTING_STATUS.OFF) {
      return { cv, alreadyUnlisted: true };
    }

    const nextStatus = suspend ? SCOUT_LISTING_STATUS.SUSPENDED : SCOUT_LISTING_STATUS.OFF;
    const action = suspend ? SCOUT_LISTING_ACTIONS.SUSPEND : SCOUT_LISTING_ACTIONS.UNLIST;
    const now = new Date();

    await cv.update(
      {
        scoutStatus: nextStatus,
        scoutUnlistedAt: now,
      },
      { transaction },
    );

    await ScoutListingLog.create(
      {
        cvId: cv.id,
        action,
        actorType: adminId != null ? 'admin' : 'collaborator',
        actorAdminId: adminId ?? null,
        actorCollaboratorId: collaboratorId ?? null,
        note,
      },
      { transaction },
    );

    return { cv, alreadyUnlisted: false };
  });
}

export default {
  listCvOnScout,
  unlistCvFromScout,
};
