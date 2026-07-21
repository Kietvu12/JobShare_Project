import { Op } from 'sequelize';
import {
  Admin,
  Business,
  BusinessCtvMarketplaceInterest,
  BusinessCtvMarketplaceListing,
  BusinessCtvMarketplaceSettlement,
  Collaborator,
  CVStorage,
  Job,
  JobApplication,
  JobPickup,
  JobPickupId,
  JobValue,
  Type,
  Value,
} from '../models/index.js';
import {
  DEFAULT_PLATFORM_FEE_PERCENT,
  MARKETPLACE_HIRED_STATUSES,
  MARKETPLACE_LISTING_STATUS,
  MARKETPLACE_LISTING_STATUS_LABELS,
  MARKETPLACE_PICKUP_NAME,
  MARKETPLACE_PIPELINE_STATUSES,
  MARKETPLACE_SETTLEMENT_STATUS,
} from '../constants/candidateSharing.js';
import { getJobApplicationStatus } from '../constants/jobApplicationStatus.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';
import formatJobCommissionLabel from '../utils/jobCommissionLabel.js';
import { bumpJobListCacheVersion } from './jobListCache.js';
import sequelize from '../config/database.js';

const JOB_COMMISSION_INCLUDE = {
  model: Job,
  as: 'job',
  required: false,
  attributes: ['id', 'title', 'jobCode', 'slug', 'deadline', 'jobCommissionType'],
  include: [{
    model: JobValue,
    as: 'jobValues',
    required: false,
    include: [
      { model: Type, as: 'type', required: false, attributes: ['id', 'typename', 'cvField'] },
      { model: Value, as: 'valueRef', required: false, attributes: ['id', 'valuename'] },
    ],
  }],
};

function formatFeeLabel(listing, job) {
  if (job) return formatJobCommissionLabel(job);
  const type = listing.referralFeeType || 'percent';
  const value = Number(listing.referralFeeValue || 0);
  if (type === 'percent') return `${value}% Thu nhập năm đầu`;
  return `${value.toLocaleString('vi-VN')}đ (cố định)`;
}

function formatListing(row, { includeJob = true } = {}) {
  const json = row.toJSON ? row.toJSON() : row;
  const status = Number(json.status);
  return {
    id: json.id,
    businessId: json.businessId,
    jobId: json.jobId,
    referralFeeType: json.referralFeeType,
    referralFeeValue: Number(json.referralFeeValue || 0),
    maxBonusAmount: json.maxBonusAmount != null ? Number(json.maxBonusAmount) : null,
    headcount: json.headcount || 1,
    requirements: json.requirements || null,
    recruitmentDeadline: json.recruitmentDeadline || null,
    platformFeePercent: Number(json.platformFeePercent || DEFAULT_PLATFORM_FEE_PERCENT),
    status,
    statusLabel: MARKETPLACE_LISTING_STATUS_LABELS[status] || '—',
    feeLabel: formatFeeLabel(json, json.job),
    submittedAt: json.submittedAt || null,
    approvedAt: json.approvedAt || null,
    publishedAt: json.publishedAt || null,
    rejectedAt: json.rejectedAt || null,
    rejectionReason: json.rejectionReason || null,
    adminNote: json.adminNote || null,
    jobPickupId: json.jobPickupId || null,
    interestCount: json.interestCount || 0,
    nominationsCount: json.nominationsCount || 0,
    hiredCount: json.hiredCount || 0,
    job: includeJob && json.job
      ? {
          id: json.job.id,
          title: json.job.title,
          jobCode: json.job.jobCode,
          slug: json.job.slug,
          deadline: json.job.deadline || null,
          jobCommissionType: json.job.jobCommissionType,
          jobValues: json.job.jobValues || [],
        }
      : json.job || null,
    business: json.business
      ? { id: json.business.id, companyName: json.business.companyName }
      : null,
    handledByAdmin: json.handledByAdmin
      ? { id: json.handledByAdmin.id, name: json.handledByAdmin.name || json.handledByAdmin.email }
      : null,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
}

async function assertOwnedJob(businessId, jobId) {
  const job = await Job.findOne({ where: { id: jobId, businessId } });
  if (!job) {
    const err = new Error('Không tìm thấy JD hoặc không thuộc doanh nghiệp');
    err.statusCode = 404;
    throw err;
  }
  return job;
}

async function assertOwnedListing(businessId, listingId) {
  const listing = await BusinessCtvMarketplaceListing.findOne({
    where: { id: listingId, businessId },
    include: [
      JOB_COMMISSION_INCLUDE,
      { model: Business, as: 'business', required: false, attributes: ['id', 'companyName'] },
    ],
  });
  if (!listing) {
    const err = new Error('Không tìm thấy listing');
    err.statusCode = 404;
    throw err;
  }
  return listing;
}

async function syncListingCounters(listingId) {
  const listing = await BusinessCtvMarketplaceListing.findByPk(listingId);
  if (!listing) return;
  const interestCount = await BusinessCtvMarketplaceInterest.count({ where: { listingId } });
  const nominationsCount = await JobApplication.count({ where: { jobId: listing.jobId } });
  const hiredCount = await JobApplication.count({
    where: { jobId: listing.jobId, status: { [Op.in]: MARKETPLACE_HIRED_STATUSES } },
  });
  await listing.update({ interestCount, nominationsCount, hiredCount });
}

function normalizeCommissionType(raw) {
  const s = String(raw || 'fixed').toLowerCase();
  return s === 'percent' || s === 'percentage' ? 'percent' : 'fixed';
}

function pickPrimaryReferralFee(jobCommissionType, jobValues) {
  const type = normalizeCommissionType(jobCommissionType);
  const rows = Array.isArray(jobValues) ? jobValues : [];
  const withAmount = rows.find((jv) => jv?.value != null && String(jv.value).trim() !== '');
  const value = withAmount != null ? Number(withAmount.value) : 0;
  return {
    referralFeeType: type,
    referralFeeValue: Number.isFinite(value) ? value : 0,
  };
}

/** Cập nhật jobCommissionType + job_values khi DN set phí giới thiệu lúc đưa lên sàn */
async function syncJobCommissionSettings(job, { jobCommissionType, jobValues }, transaction) {
  if (jobCommissionType == null && jobValues === undefined) return null;

  const nextType = jobCommissionType != null
    ? normalizeCommissionType(jobCommissionType)
    : normalizeCommissionType(job.jobCommissionType);

  if (jobCommissionType != null) {
    await job.update({ jobCommissionType: nextType }, { transaction });
  }

  if (jobValues !== undefined) {
    const rows = (Array.isArray(jobValues) ? jobValues : [])
      .filter((jv) => jv && (jv.typeId || jv.valueId || (jv.value != null && String(jv.value).trim() !== '')))
      .map((jv) => ({
        jobId: job.id,
        typeId: jv.typeId ? parseInt(jv.typeId, 10) : null,
        valueId: jv.valueId ? parseInt(jv.valueId, 10) : null,
        value: jv.value != null && String(jv.value).trim() !== '' ? String(jv.value).trim() : null,
        isRequired: !!jv.isRequired,
        viewOnCollaborator: jv.viewOnCollaborator != null ? String(jv.viewOnCollaborator) : null,
      }));

    await JobValue.destroy({ where: { jobId: job.id }, transaction, force: true });
    if (rows.length) {
      await JobValue.bulkCreate(rows, { transaction });
    }
  }

  return pickPrimaryReferralFee(nextType, jobValues !== undefined ? jobValues : null);
}

async function ensureMarketplaceJobPickup(jobId, listing, transaction) {
  let pickupId = listing.jobPickupId ? Number(listing.jobPickupId) : null;
  if (!pickupId) {
    let pickup = await JobPickup.findOne({
      where: { name: MARKETPLACE_PICKUP_NAME },
      transaction,
    });
    if (!pickup) {
      pickup = await JobPickup.create({
        name: MARKETPLACE_PICKUP_NAME,
        nameEn: 'Business CTV Marketplace',
        nameJp: '企業CTVマーケット',
      }, { transaction });
    }
    pickupId = pickup.id;
  }

  const existing = await JobPickupId.findOne({
    where: { jobId, jobPickupId: pickupId },
    transaction,
  });
  if (!existing) {
    await JobPickupId.create({ jobId, jobPickupId: pickupId }, { transaction });
  }
  return pickupId;
}

async function notifyAdminsNewListing(listing, business, job) {
  const companyName = business?.companyName || 'Doanh nghiệp';
  const jobTitle = job?.title || job?.jobCode || `#${listing.jobId}`;
  const content = `${companyName} gửi yêu cầu đăng job "${jobTitle}" lên Sàn CTV.`;
  const admins = await Admin.findAll({
    where: { isActive: true, status: 1, role: { [Op.in]: [1, 2] } },
    attributes: ['id'],
  });
  for (const admin of admins) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId: null,
      adminId: admin.id,
      title: 'Job Sàn CTV chờ duyệt',
      content,
      jobId: listing.jobId,
      url: `/admin/candidate-sharing?listingId=${listing.id}`,
    });
  }
}

export async function getBusinessDashboard({ businessId }) {
  const listings = await BusinessCtvMarketplaceListing.findAll({
    where: { businessId },
    attributes: ['id', 'jobId', 'status', 'interestCount', 'nominationsCount', 'hiredCount'],
  });
  const jobIds = listings.map((l) => l.jobId);
  const activeOnMarket = listings.filter((l) => Number(l.status) === MARKETPLACE_LISTING_STATUS.PUBLISHED).length;
  const pendingApproval = listings.filter((l) => Number(l.status) === MARKETPLACE_LISTING_STATUS.PENDING_APPROVAL).length;

  let pipelineCount = 0;
  if (jobIds.length) {
    pipelineCount = await JobApplication.count({
      where: { jobId: { [Op.in]: jobIds }, status: { [Op.in]: MARKETPLACE_PIPELINE_STATUSES } },
    });
  }

  const totals = listings.reduce(
    (acc, l) => ({
      interests: acc.interests + (l.interestCount || 0),
      nominations: acc.nominations + (l.nominationsCount || 0),
      hired: acc.hired + (l.hiredCount || 0),
    }),
    { interests: 0, nominations: 0, hired: 0 },
  );

  const recentListings = await listBusinessListings({ businessId, page: 1, limit: 5 });
  const recentNominations = await listBusinessNominations({ businessId, page: 1, limit: 5 });
  const recentSettlements = await listBusinessSettlements({ businessId, page: 1, limit: 3 });

  return {
    stats: {
      activeOnMarket,
      pendingApproval,
      totalListings: listings.length,
      totalInterests: totals.interests,
      totalNominations: totals.nominations,
      pipelineCandidates: pipelineCount,
      hired: totals.hired,
    },
    recentListings: recentListings.listings,
    recentNominations: recentNominations.nominations,
    recentSettlements: recentSettlements.settlements,
  };
}

export async function listBusinessListings({ businessId, page = 1, limit = 20, status, search }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const where = { businessId };

  if (status != null && status !== '') where.status = parseInt(status, 10);
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    where[Op.or] = [{ requirements: { [Op.like]: q } }];
  }

  const { count, rows } = await BusinessCtvMarketplaceListing.findAndCountAll({
    where,
    include: [JOB_COMMISSION_INCLUDE],
    order: [['updated_at', 'DESC'], ['id', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    listings: rows.map((r) => formatListing(r)),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function createBusinessListing({ businessId, payload }) {
  const job = await assertOwnedJob(businessId, payload.jobId);
  const existing = await BusinessCtvMarketplaceListing.findOne({
    where: {
      businessId,
      jobId: job.id,
      status: { [Op.in]: [
        MARKETPLACE_LISTING_STATUS.DRAFT,
        MARKETPLACE_LISTING_STATUS.PENDING_APPROVAL,
        MARKETPLACE_LISTING_STATUS.APPROVED,
        MARKETPLACE_LISTING_STATUS.PUBLISHED,
        MARKETPLACE_LISTING_STATUS.PAUSED,
      ] },
    },
  });
  if (existing) {
    const err = new Error('Job này đã có listing trên sàn (chưa đóng)');
    err.statusCode = 400;
    throw err;
  }

  const hasCommissionPayload =
    payload.jobCommissionType != null || payload.jobValues !== undefined;
  if (!hasCommissionPayload) {
    const err = new Error('Vui lòng cài đặt phí giới thiệu trước khi đưa job lên sàn CTV');
    err.statusCode = 400;
    throw err;
  }

  const incomingValues = Array.isArray(payload.jobValues) ? payload.jobValues : [];
  const hasFeeRow = incomingValues.some(
    (jv) => jv && jv.typeId && jv.valueId && (
      (jv.value != null && String(jv.value).trim() !== '') ||
      (jv.viewOnCollaborator != null && String(jv.viewOnCollaborator).trim() !== '') ||
      (Number(jv.typeId) === 2 && (Number(jv.valueId) === 6 || Number(jv.valueId) === 7))
    ),
  );
  if (!hasFeeRow) {
    const err = new Error('Vui lòng nhập ít nhất một dòng phí giới thiệu hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const transaction = await sequelize.transaction();
  try {
    const feeFromJob = await syncJobCommissionSettings(
      job,
      {
        jobCommissionType: payload.jobCommissionType,
        jobValues: payload.jobValues,
      },
      transaction,
    );

    const fee = feeFromJob || pickPrimaryReferralFee(
      payload.jobCommissionType || job.jobCommissionType,
      payload.jobValues,
    );

    const listing = await BusinessCtvMarketplaceListing.create({
      businessId,
      jobId: job.id,
      referralFeeType: fee.referralFeeType,
      referralFeeValue: fee.referralFeeValue,
      maxBonusAmount: payload.maxBonusAmount ?? null,
      headcount: payload.headcount ?? 1,
      requirements: payload.requirements?.trim() || null,
      recruitmentDeadline: payload.recruitmentDeadline || job.deadline || null,
      platformFeePercent: payload.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT,
      status: MARKETPLACE_LISTING_STATUS.DRAFT,
    }, { transaction });

    await transaction.commit();
    return formatListing(await assertOwnedListing(businessId, listing.id));
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function updateBusinessListing({ businessId, listingId, payload }) {
  const listing = await assertOwnedListing(businessId, listingId);
  if (![MARKETPLACE_LISTING_STATUS.DRAFT, MARKETPLACE_LISTING_STATUS.REJECTED].includes(Number(listing.status))) {
    const err = new Error('Chỉ sửa được listing ở trạng thái Nháp hoặc Từ chối');
    err.statusCode = 400;
    throw err;
  }

  const transaction = await sequelize.transaction();
  try {
    const updates = {};
    if (payload.headcount != null) updates.headcount = payload.headcount;
    if (payload.requirements !== undefined) updates.requirements = payload.requirements;
    if (payload.recruitmentDeadline !== undefined) updates.recruitmentDeadline = payload.recruitmentDeadline;
    if (Number(listing.status) === MARKETPLACE_LISTING_STATUS.REJECTED) {
      updates.status = MARKETPLACE_LISTING_STATUS.DRAFT;
      updates.rejectionReason = null;
      updates.rejectedAt = null;
    }

    if (payload.jobCommissionType != null || payload.jobValues !== undefined) {
      const job = listing.job
        ? await Job.findByPk(listing.jobId, { transaction })
        : await assertOwnedJob(businessId, listing.jobId);
      const fee = await syncJobCommissionSettings(
        job,
        {
          jobCommissionType: payload.jobCommissionType,
          jobValues: payload.jobValues,
        },
        transaction,
      );
      if (fee) {
        updates.referralFeeType = fee.referralFeeType;
        updates.referralFeeValue = fee.referralFeeValue;
      }
    } else if (payload.referralFeeType != null || payload.referralFeeValue != null) {
      if (payload.referralFeeType != null) updates.referralFeeType = normalizeCommissionType(payload.referralFeeType);
      if (payload.referralFeeValue != null) updates.referralFeeValue = Number(payload.referralFeeValue) || 0;
    }

    await listing.update(updates, { transaction });
    await transaction.commit();
    return formatListing(await assertOwnedListing(businessId, listingId));
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function submitListingForApproval({ businessId, listingId }) {
  const listing = await assertOwnedListing(businessId, listingId);
  if (![MARKETPLACE_LISTING_STATUS.DRAFT, MARKETPLACE_LISTING_STATUS.REJECTED].includes(Number(listing.status))) {
    const err = new Error('Listing không thể gửi duyệt');
    err.statusCode = 400;
    throw err;
  }
  await listing.update({
    status: MARKETPLACE_LISTING_STATUS.PENDING_APPROVAL,
    submittedAt: new Date(),
    rejectionReason: null,
    rejectedAt: null,
  });
  const business = listing.business || await Business.findByPk(businessId, { attributes: ['id', 'companyName'] });
  const job = listing.job || await Job.findByPk(listing.jobId, { attributes: ['id', 'title', 'jobCode'] });
  try {
    await notifyAdminsNewListing(listing, business, job);
  } catch (err) {
    console.error('[candidateSharing] notifyAdminsNewListing:', err?.message || err);
  }
  return formatListing(await assertOwnedListing(businessId, listingId));
}

export async function pauseBusinessListing({ businessId, listingId }) {
  const listing = await assertOwnedListing(businessId, listingId);
  if (![MARKETPLACE_LISTING_STATUS.PUBLISHED, MARKETPLACE_LISTING_STATUS.APPROVED].includes(Number(listing.status))) {
    const err = new Error('Chỉ tạm dừng listing đang chạy hoặc đã duyệt');
    err.statusCode = 400;
    throw err;
  }
  await listing.update({ status: MARKETPLACE_LISTING_STATUS.PAUSED });
  await bumpJobListCacheVersion();
  return formatListing(await assertOwnedListing(businessId, listingId));
}

export async function closeBusinessListing({ businessId, listingId }) {
  const listing = await assertOwnedListing(businessId, listingId);
  await listing.update({ status: MARKETPLACE_LISTING_STATUS.CLOSED });
  await bumpJobListCacheVersion();
  return formatListing(await assertOwnedListing(businessId, listingId));
}

export async function listBusinessNominations({ businessId, page = 1, limit = 20, listingId, jobId }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let jobIds = [];
  let listingByJobId = {};
  if (jobId) {
    const ownedJob = await Job.findOne({
      where: { id: parseInt(jobId, 10), businessId },
      attributes: ['id'],
    });
    if (!ownedJob) {
      return { nominations: [], pagination: { total: 0, page: safePage, limit: safeLimit, totalPages: 0 } };
    }
    jobIds = [ownedJob.id];
    const relatedListings = await BusinessCtvMarketplaceListing.findAll({
      where: { businessId, jobId: ownedJob.id },
      attributes: ['id', 'jobId'],
    });
    relatedListings.forEach((l) => { listingByJobId[l.jobId] = l.id; });
  } else {
    const listings = await BusinessCtvMarketplaceListing.findAll({
      where: listingId ? { businessId, id: listingId } : { businessId },
      attributes: ['id', 'jobId'],
    });
    jobIds = listings.map((l) => l.jobId);
    listings.forEach((l) => { listingByJobId[l.jobId] = l.id; });
    if (!jobIds.length) {
      return { nominations: [], pagination: { total: 0, page: safePage, limit: safeLimit, totalPages: 0 } };
    }
  }

  const { count, rows } = await JobApplication.findAndCountAll({
    where: { jobId: jobIds.length === 1 ? jobIds[0] : { [Op.in]: jobIds } },
    include: [
      { model: Job, as: 'job', required: false, attributes: ['id', 'title', 'jobCode'] },
      { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email'] },
      { model: CVStorage, as: 'cv', required: false, attributes: ['id', 'name', 'code', 'desiredPosition'] },
    ],
    order: [['created_at', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    nominations: rows.map((r) => {
      const j = r.toJSON();
      const st = getJobApplicationStatus(j.status);
      return {
        id: j.id,
        jobId: j.jobId,
        listingId: listingByJobId[j.jobId] || null,
        candidateName: j.cv?.name || j.title || '—',
        candidateSub: j.cv?.desiredPosition || null,
        cvStorageId: j.cv?.id || null,
        jobTitle: j.job?.title || '—',
        jobCode: j.job?.jobCode || null,
        ctvName: j.collaborator?.name || '—',
        ctvId: j.collaboratorId,
        matchScore: null,
        appliedAt: j.appliedAt || j.createdAt,
        status: j.status,
        statusLabel: st.label,
        statusCategory: st.category,
      };
    }),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function listBusinessSettlements({ businessId, page = 1, limit = 20 }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const { count, rows } = await BusinessCtvMarketplaceSettlement.findAndCountAll({
    where: { businessId },
    include: [
      { model: BusinessCtvMarketplaceListing, as: 'listing', required: false, include: [{ model: Job, as: 'job', attributes: ['id', 'title', 'jobCode'] }] },
    ],
    order: [['created_at', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    settlements: rows.map((r) => {
      const j = r.toJSON();
      return {
        id: j.id,
        candidateName: j.candidateName || '—',
        jobTitle: j.listing?.job?.title || '—',
        jobCode: j.listing?.job?.jobCode || null,
        totalAmountBusiness: Number(j.totalAmountBusiness || 0),
        status: j.status,
        statusLabel: j.status === MARKETPLACE_SETTLEMENT_STATUS.PAID ? 'Đã thanh toán' : j.status === MARKETPLACE_SETTLEMENT_STATUS.PENDING ? 'Chờ thanh toán' : 'Đã hủy',
        paidAt: j.paidAt || null,
        createdAt: j.createdAt,
      };
    }),
    pagination: { total: count, page: safePage, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) || 0 },
  };
}

// ——— Admin ———

export async function listAdminListings({ page = 1, limit = 20, status, search }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const where = {};
  if (status != null && status !== '') where.status = parseInt(status, 10);

  const { count, rows } = await BusinessCtvMarketplaceListing.findAndCountAll({
    where,
    include: [
      JOB_COMMISSION_INCLUDE,
      { model: Business, as: 'business', required: false, attributes: ['id', 'companyName', 'contactName'] },
    ],
    order: [['submitted_at', 'DESC'], ['updated_at', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    listings: rows.map((r) => formatListing(r)),
    pagination: { total: count, page: safePage, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) || 0 },
  };
}

export async function approveAndPublishListing({ listingId, adminId, adminNote, autoPublish = true }) {
  const listing = await BusinessCtvMarketplaceListing.findByPk(listingId, {
    include: [
      { model: Job, as: 'job' },
      { model: Business, as: 'business', attributes: ['id', 'companyName'] },
    ],
  });
  if (!listing) {
    const err = new Error('Không tìm thấy listing');
    err.statusCode = 404;
    throw err;
  }
  if (Number(listing.status) !== MARKETPLACE_LISTING_STATUS.PENDING_APPROVAL) {
    const err = new Error('Listing không ở trạng thái chờ duyệt');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const transaction = await sequelize.transaction();
  try {
    const nextStatus = autoPublish ? MARKETPLACE_LISTING_STATUS.PUBLISHED : MARKETPLACE_LISTING_STATUS.APPROVED;
    let jobPickupId = listing.jobPickupId || null;
    if (autoPublish) {
      jobPickupId = await ensureMarketplaceJobPickup(listing.jobId, listing, transaction);
    }

    await listing.update({
      status: nextStatus,
      approvedAt: now,
      publishedAt: autoPublish ? now : null,
      handledByAdminId: adminId,
      adminNote: adminNote?.trim() || null,
      jobPickupId,
    }, { transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  await syncListingCounters(listing.id);
  await bumpJobListCacheVersion();

  try {
    await collaboratorNotificationService.notifyBusinessListingApproved({
      businessId: listing.businessId,
      jobTitle: listing.job?.title || listing.job?.jobCode,
      jobId: listing.jobId,
      listingId: listing.id,
    });
  } catch (err) {
    console.error('[candidateSharing] notifyBusinessListingApproved:', err?.message || err);
  }

  return formatListing(await BusinessCtvMarketplaceListing.findByPk(listingId, {
    include: [JOB_COMMISSION_INCLUDE, { model: Business, as: 'business', attributes: ['id', 'companyName'] }],
  }));
}

export async function rejectListing({ listingId, adminId, rejectionReason, adminNote }) {
  const listing = await BusinessCtvMarketplaceListing.findByPk(listingId);
  if (!listing) {
    const err = new Error('Không tìm thấy listing');
    err.statusCode = 404;
    throw err;
  }
  if (Number(listing.status) !== MARKETPLACE_LISTING_STATUS.PENDING_APPROVAL) {
    const err = new Error('Listing không ở trạng thái chờ duyệt');
    err.statusCode = 400;
    throw err;
  }
  await listing.update({
    status: MARKETPLACE_LISTING_STATUS.REJECTED,
    rejectedAt: new Date(),
    handledByAdminId: adminId,
    rejectionReason: rejectionReason?.trim() || 'Từ chối bởi WS',
    adminNote: adminNote?.trim() || null,
  });

  try {
    const full = await BusinessCtvMarketplaceListing.findByPk(listingId, {
      include: [{ model: Job, as: 'job', attributes: ['id', 'title', 'jobCode'] }],
    });
    await collaboratorNotificationService.notifyBusinessListingRejected({
      businessId: listing.businessId,
      jobTitle: full?.job?.title || full?.job?.jobCode,
      reason: rejectionReason?.trim() || null,
      listingId: listing.id,
    });
  } catch (err) {
    console.error('[candidateSharing] notifyBusinessListingRejected:', err?.message || err);
  }

  return formatListing(listing);
}

export async function adminPauseListing({ listingId }) {
  const listing = await BusinessCtvMarketplaceListing.findByPk(listingId);
  if (!listing) {
    const err = new Error('Không tìm thấy listing');
    err.statusCode = 404;
    throw err;
  }
  await listing.update({ status: MARKETPLACE_LISTING_STATUS.PAUSED });
  await bumpJobListCacheVersion();
  return formatListing(listing);
}

export async function adminPublishListing({ listingId, adminId }) {
  const listing = await BusinessCtvMarketplaceListing.findByPk(listingId);
  if (!listing) {
    const err = new Error('Không tìm thấy listing');
    err.statusCode = 404;
    throw err;
  }
  const transaction = await sequelize.transaction();
  try {
    const jobPickupId = await ensureMarketplaceJobPickup(listing.jobId, listing, transaction);
    await listing.update({
      status: MARKETPLACE_LISTING_STATUS.PUBLISHED,
      publishedAt: new Date(),
      handledByAdminId: adminId || listing.handledByAdminId,
      jobPickupId,
    }, { transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
  await bumpJobListCacheVersion();
  return formatListing(listing);
}

// ——— CTV ———

export async function listCtvMarketplaceJobs({ collaboratorId, page = 1, limit = 20, search }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const where = { status: MARKETPLACE_LISTING_STATUS.PUBLISHED };

  const { count, rows } = await BusinessCtvMarketplaceListing.findAndCountAll({
    where,
    include: [
      {
        ...JOB_COMMISSION_INCLUDE,
        required: true,
      },
      { model: Business, as: 'business', required: false, attributes: ['id', 'companyName'] },
    ],
    order: [['published_at', 'DESC']],
    limit: safeLimit,
    offset,
  });

  const listingIds = rows.map((r) => r.id);
  let interestedSet = new Set();
  if (listingIds.length) {
    const interests = await BusinessCtvMarketplaceInterest.findAll({
      where: { listingId: { [Op.in]: listingIds }, collaboratorId },
      attributes: ['listingId'],
    });
    interestedSet = new Set(interests.map((i) => i.listingId));
  }

  return {
    jobs: rows.map((r) => ({
      ...formatListing(r),
      isInterested: interestedSet.has(r.id),
    })),
    pagination: { total: count, page: safePage, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) || 0 },
  };
}

export async function expressCtvInterest({ listingId, collaboratorId }) {
  const listing = await BusinessCtvMarketplaceListing.findOne({
    where: { id: listingId, status: MARKETPLACE_LISTING_STATUS.PUBLISHED },
  });
  if (!listing) {
    const err = new Error('Job không còn trên sàn');
    err.statusCode = 404;
    throw err;
  }
  await BusinessCtvMarketplaceInterest.findOrCreate({
    where: { listingId, collaboratorId },
    defaults: { listingId, collaboratorId },
  });
  await syncListingCounters(listingId);
  return { success: true, listingId };
}

export async function getCtvMarketplaceStats({ collaboratorId }) {
  const interests = await BusinessCtvMarketplaceInterest.count({ where: { collaboratorId } });
  const nominations = await JobApplication.count({ where: { collaboratorId } });
  const publishedJobs = await BusinessCtvMarketplaceListing.count({ where: { status: MARKETPLACE_LISTING_STATUS.PUBLISHED } });
  return { interestedJobs: interests, myNominations: nominations, publishedJobs };
}

export default {
  getBusinessDashboard,
  listBusinessListings,
  createBusinessListing,
  updateBusinessListing,
  submitListingForApproval,
  pauseBusinessListing,
  closeBusinessListing,
  listBusinessNominations,
  listBusinessSettlements,
  listAdminListings,
  approveAndPublishListing,
  rejectListing,
  adminPauseListing,
  adminPublishListing,
  listCtvMarketplaceJobs,
  expressCtvInterest,
  getCtvMarketplaceStats,
  syncListingCounters,
};
