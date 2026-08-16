import {
  Job,
  JobCategory,
  Company,
  CompanyBusinessField,
  CompanyOffice,
  JobRecruitingCompany,
  JobRecruitingCompanyService,
  JobRecruitingCompanyBusinessSector,
  WorkingLocation,
  WorkingLocationDetail,
  SalaryRange,
  SalaryRangeDetail,
  OvertimeAllowance,
  OvertimeAllowanceDetail,
  Requirement,
  SmokingPolicy,
  SmokingPolicyDetail,
  WorkingHour,
  WorkingHourDetail,
  Benefit,
  JobPickup,
  JobPickupId,
  Type,
  Value,
  JobValue,
  JobCampaign,
  Campaign,
} from '../models/index.js';
import { isNumericJobId } from '../utils/resolveJobByIdOrSlug.js';

function toPlainRows(rows) {
  return rows.map((row) => (typeof row.toJSON === 'function' ? row.toJSON() : row));
}

function buildBelongsToIncludes(scope) {
  const includes = [
    {
      model: JobCategory,
      as: 'category',
      required: false,
    },
  ];

  if (scope === 'ctv') {
    includes.push({
      model: Company,
      as: 'company',
      required: false,
      include: [
        {
          model: CompanyBusinessField,
          as: 'businessFields',
          required: false,
          attributes: ['id', 'content'],
        },
        {
          model: CompanyOffice,
          as: 'offices',
          required: false,
          attributes: ['id', 'address', 'isHeadOffice'],
        },
      ],
    });
  } else {
    includes.push({
      model: Company,
      as: 'company',
      required: false,
    });
  }

  includes.push({
    model: JobRecruitingCompany,
    as: 'recruitingCompany',
    required: false,
  });

  return includes;
}

async function loadRecruitingCompanyNested(recruitingCompanyId) {
  if (!recruitingCompanyId) {
    return { services: [], businessSectors: [] };
  }

  const [services, businessSectors] = await Promise.all([
    JobRecruitingCompanyService.findAll({
      where: { jobRecruitingCompanyId: recruitingCompanyId },
      order: [['order', 'ASC']],
    }),
    JobRecruitingCompanyBusinessSector.findAll({
      where: { jobRecruitingCompanyId: recruitingCompanyId },
      order: [['order', 'ASC']],
    }),
  ]);

  return {
    services: toPlainRows(services),
    businessSectors: toPlainRows(businessSectors),
  };
}

async function loadJobValues(jobId, scope) {
  const typeAttrs = scope === 'ctv' ? ['id', 'typename'] : undefined;
  const valueAttrs = scope === 'ctv'
    ? ['id', 'valuename', 'valuenameEn', 'valuenameJp']
    : undefined;

  const rows = await JobValue.findAll({
    where: { jobId },
    include: [
      {
        model: Type,
        as: 'type',
        required: false,
        ...(typeAttrs ? { attributes: typeAttrs } : {}),
      },
      {
        model: Value,
        as: 'valueRef',
        required: false,
        ...(valueAttrs ? { attributes: valueAttrs } : {}),
      },
    ],
  });

  return toPlainRows(rows);
}

async function loadJobCampaigns(jobId, scope) {
  const rows = await JobCampaign.findAll({
    where: { jobId },
    paranoid: true,
    ...(scope === 'ctv' ? { attributes: ['id', 'campaignId', 'jobId'] } : {}),
    include: [
      {
        model: Campaign,
        as: 'campaign',
        required: false,
        attributes: scope === 'ctv' ? ['id', 'name', 'percent'] : ['id', 'name', 'status'],
      },
    ],
  });

  return toPlainRows(rows);
}

async function loadHasManyRelations(jobId, scope) {
  const where = { jobId };
  const isCtv = scope === 'ctv';

  const tasks = [
    ['workingLocationDetails', WorkingLocationDetail.findAll({
      where,
      ...(isCtv ? { attributes: ['id', 'content', 'contentEn', 'contentJp'] } : {}),
    })],
    ['salaryRanges', SalaryRange.findAll({
      where,
      ...(isCtv ? { attributes: ['id', 'salaryRange', 'salaryRangeEn', 'salaryRangeJp', 'type'] } : {}),
    })],
    ['salaryRangeDetails', SalaryRangeDetail.findAll({
      where,
      ...(isCtv ? { attributes: ['id', 'content', 'contentEn', 'contentJp'] } : {}),
    })],
    ['overtimeAllowanceDetails', OvertimeAllowanceDetail.findAll({
      where,
      ...(isCtv ? { attributes: ['id', 'content'] } : {}),
    })],
    ['requirements', Requirement.findAll({
      where,
      ...(isCtv ? { attributes: ['id', 'content', 'contentEn', 'contentJp', 'type', 'status'] } : {}),
    })],
    ['smokingPolicies', SmokingPolicy.findAll({
      where,
      ...(isCtv ? { attributes: ['id', 'allow'] } : {}),
    })],
    ['smokingPolicyDetails', SmokingPolicyDetail.findAll({
      where,
      ...(isCtv ? { attributes: ['id', 'content'] } : {}),
    })],
    ['workingHourDetails', WorkingHourDetail.findAll({
      where,
      ...(isCtv ? { attributes: ['id', 'content'] } : {}),
    })],
    ['benefits', Benefit.findAll({
      where,
      attributes: ['id', 'content', 'contentEn', 'contentJp'],
    })],
  ];

  if (!isCtv) {
    tasks.push(
      ['workingLocations', WorkingLocation.findAll({ where })],
      ['overtimeAllowances', OvertimeAllowance.findAll({ where })],
      ['workingHours', WorkingHour.findAll({ where })],
      ['jobPickupIds', JobPickupId.findAll({
        where,
        include: [{ model: JobPickup, as: 'pickup', required: false }],
      })],
    );
  }

  const entries = await Promise.all(tasks.map(async ([key, promise]) => [key, await promise]));
  const out = {};
  for (const [key, rows] of entries) {
    out[key] = toPlainRows(rows);
  }
  return out;
}

/** Resolve PK từ id số, slug hoặc jobCode — chỉ query cột id. */
export async function resolveJobPrimaryKey(idOrSlug) {
  const raw = decodeURIComponent(String(idOrSlug ?? '').trim());
  if (!raw) return null;

  if (isNumericJobId(raw)) {
    return parseInt(raw, 10);
  }

  const bySlug = await Job.findOne({
    where: { slug: raw },
    attributes: ['id'],
  });
  if (bySlug) return bySlug.id;

  const byCode = await Job.findOne({
    where: { jobCode: raw },
    attributes: ['id'],
  });
  return byCode?.id ?? null;
}

/**
 * Tải chi tiết job: 1 query belongsTo + batch song song hasMany (thay vì 15+ query tuần tự / cartesian join).
 * @param {number} jobId
 * @param {{ scope?: 'admin' | 'ctv' }} [options]
 */
export async function loadJobDetailById(jobId, options = {}) {
  const scope = options.scope === 'ctv' ? 'ctv' : 'admin';
  const pk = typeof jobId === 'number' ? jobId : parseInt(jobId, 10);
  if (!Number.isFinite(pk)) return null;

  const job = await Job.findByPk(pk, {
    include: buildBelongsToIncludes(scope),
  });
  if (!job) return null;

  const jobJson = job.toJSON();
  const resolvedJobId = jobJson.id;

  const [hasMany, jobValues, jobCampaigns, recruitingNested] = await Promise.all([
    loadHasManyRelations(resolvedJobId, scope),
    loadJobValues(resolvedJobId, scope),
    loadJobCampaigns(resolvedJobId, scope),
    loadRecruitingCompanyNested(jobJson.recruitingCompany?.id),
  ]);

  Object.assign(jobJson, hasMany, { jobValues, jobCampaigns });
  if (jobJson.recruitingCompany) {
    Object.assign(jobJson.recruitingCompany, recruitingNested);
  }

  return jobJson;
}

export async function loadJobDetailByIdOrSlug(idOrSlug, options = {}) {
  const pk = await resolveJobPrimaryKey(idOrSlug);
  if (!pk) return null;
  return loadJobDetailById(pk, options);
}
