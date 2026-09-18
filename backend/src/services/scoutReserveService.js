import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { CVStorage, Collaborator, JobCategory } from '../models/index.js';
import { CV_STATUS_NEW, CV_STATUS_OVERDUE_6_MONTHS } from '../constants/cvStatus.js';
import { SCOUT_LISTING_STATUS } from '../constants/scoutCredit.js';
import { unlistCvFromScout } from './scoutListingService.js';
import { listCvOnScout } from './scoutListingService.js';
import { assessScoutProfileCompleteness } from '../utils/scoutProfileCompleteness.js';

/**
 * CTV CV quá hạn → gỡ Scout (nếu đang listed) và chuyển scout_status = RESERVE.
 */
export async function moveCtvCvToScoutReserve(cv, { note = null } = {}) {
  if (!cv?.collaboratorId) return { moved: false };

  const wasListed = Number(cv.scoutStatus) === SCOUT_LISTING_STATUS.LISTED;
  if (wasListed) {
    try {
      await unlistCvFromScout({
        cvId: cv.id,
        adminId: null,
        note: note || 'Tự động: quá hạn 6 tháng — chuyển Scout dự bị',
      });
      await cv.reload();
    } catch (e) {
      console.warn('[scoutReserve] unlist failed for cv', cv.id, e.message);
    }
  }

  if (Number(cv.scoutStatus) === SCOUT_LISTING_STATUS.RESERVE) {
    return { moved: false, alreadyReserve: true };
  }

  const now = new Date();
  await cv.update({
    scoutStatus: SCOUT_LISTING_STATUS.RESERVE,
    scoutReserveAt: now,
  });

  return { moved: true, wasListed };
}

export function buildScoutReserveListWhere() {
  return {
    collaboratorId: { [Op.ne]: null },
    [Op.or]: [
      { scoutStatus: SCOUT_LISTING_STATUS.RESERVE },
      {
        status: CV_STATUS_OVERDUE_6_MONTHS,
        scoutStatus: { [Op.in]: [SCOUT_LISTING_STATUS.OFF, SCOUT_LISTING_STATUS.SUSPENDED] },
      },
    ],
  };
}

export async function listScoutReserveCvs({ search, page = 1, limit = 20 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const andParts = [buildScoutReserveListWhere()];
  if (search && String(search).trim()) {
    const q = `%${String(search).trim()}%`;
    andParts.push({
      [Op.or]: [
        { code: { [Op.like]: q } },
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { phone: { [Op.like]: q } },
        { desiredPosition: { [Op.like]: q } },
      ],
    });
  }

  const { rows, count } = await CVStorage.findAndCountAll({
    where: { [Op.and]: andParts },
    include: [
      {
        model: Collaborator,
        as: 'collaborator',
        required: false,
        attributes: ['id', 'name', 'email', 'code'],
      },
      {
        model: JobCategory,
        as: 'jobCategory',
        required: false,
        attributes: ['id', 'name', 'nameEn', 'nameJp'],
      },
    ],
    order: [
      [
        sequelize.literal(
          'COALESCE(`CVStorage`.`scout_reserve_at`, `CVStorage`.`updated_at`)',
        ),
        'DESC',
      ],
      [sequelize.col('CVStorage.id'), 'DESC'],
    ],
    limit: safeLimit,
    offset,
  });

  const items = rows.map((row) => {
    const json = row.toJSON();
    const completeness = assessScoutProfileCompleteness(json);
    return {
      ...json,
      scoutCompleteness: completeness,
    };
  });

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count,
      totalPages: Math.ceil(count / safeLimit) || 1,
    },
  };
}

export async function getScoutReserveCvDetail(cvId) {
  const cv = await CVStorage.findByPk(cvId, {
    include: [
      { model: Collaborator, as: 'collaborator', required: false },
      { model: JobCategory, as: 'jobCategory', required: false },
    ],
  });
  if (!cv || !cv.collaboratorId) {
    const err = new Error('Không tìm thấy hồ sơ Scout dự bị');
    err.statusCode = 404;
    throw err;
  }
  const json = cv.toJSON();
  const completeness = assessScoutProfileCompleteness(json);
  const onReserve =
    Number(cv.scoutStatus) === SCOUT_LISTING_STATUS.RESERVE ||
    (Number(cv.status) === CV_STATUS_OVERDUE_6_MONTHS &&
      Number(cv.scoutStatus) !== SCOUT_LISTING_STATUS.LISTED);
  if (!onReserve) {
    const err = new Error('Hồ sơ không thuộc Scout dự bị');
    err.statusCode = 400;
    throw err;
  }
  return { cv: json, completeness };
}

/**
 * Admin bổ sung đủ thông tin → hợp lệ lại + đưa lên sàn Scout.
 */
export async function relistScoutReserveCv({ cvId, adminId, scoutPublicSummary, note }) {
  const cv = await CVStorage.findByPk(cvId);
  if (!cv || !cv.collaboratorId) {
    const err = new Error('Không tìm thấy hồ sơ');
    err.statusCode = 404;
    throw err;
  }

  const reserve =
    Number(cv.scoutStatus) === SCOUT_LISTING_STATUS.RESERVE ||
    Number(cv.status) === CV_STATUS_OVERDUE_6_MONTHS;
  if (!reserve) {
    const err = new Error('Hồ sơ không thuộc Scout dự bị');
    err.statusCode = 400;
    throw err;
  }

  const completeness = assessScoutProfileCompleteness(cv);
  if (!completeness.complete) {
    const err = new Error('Hồ sơ chưa đủ thông tin để đăng Scout. Vui lòng bổ sung các mục còn thiếu.');
    err.statusCode = 400;
    err.missing = completeness.missing;
    throw err;
  }

  const now = new Date();
  await cv.update({
    status: CV_STATUS_NEW,
    scoutRefreshedAt: now,
  });

  const { cv: listedCv, alreadyListed } = await listCvOnScout({
    cvId,
    adminId,
    note: note || 'Đưa lên Scout từ danh sách dự bị',
    scoutPublicSummary,
  });

  return { cv: listedCv, alreadyListed, completeness };
}

export default {
  moveCtvCvToScoutReserve,
  listScoutReserveCvs,
  getScoutReserveCvDetail,
  relistScoutReserveCv,
};
