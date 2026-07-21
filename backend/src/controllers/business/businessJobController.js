import { Op, fn, col } from 'sequelize';
import {
  Job,
  JobCategory,
  JobApplication,
  JobValue,
  Type,
  Value,
  Requirement,
  Benefit,
  SalaryRange,
  SalaryRangeDetail,
  WorkingHour,
  WorkingHourDetail,
  WorkingLocation,
  WorkingLocationDetail,
  OvertimeAllowance,
  OvertimeAllowanceDetail,
  Company,
  SmokingPolicy,
  SmokingPolicyDetail,
  JobRecruitingCompany,
  JobRecruitingCompanyService,
  JobRecruitingCompanyBusinessSector,
} from '../../models/index.js';
import { bumpJobListCacheVersion } from '../../services/jobListCache.js';
import { jobController } from '../admin/jobController.js';

function normalizeQueryParam(value) {
  if (value == null || value === 'undefined' || value === 'null') return null;
  const s = String(value).trim();
  return s || null;
}

function slugify(text) {
  return (
    String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200) || 'job'
  );
}

async function generateUniqueSlug(base, excludeId = null) {
  let slug = slugify(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix ? `${slug}-${suffix}` : slug;
    const where = { slug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await Job.findOne({ where });
    if (!existing) return candidate;
    suffix += 1;
  }
}

async function generateUniqueJobCode(businessId) {
  for (let i = 0; i < 10; i++) {
    const code = `B${businessId}-${Date.now().toString(36).toUpperCase()}${i > 0 ? i : ''}`;
    const existing = await Job.findOne({ where: { jobCode: code } });
    if (!existing) return code;
  }
  throw new Error('Không thể tạo mã việc làm');
}

const WRITABLE_FIELDS = [
  'jobCategoryId',
  'businessSectorKey',
  'title',
  'titleEn',
  'titleJp',
  'slug',
  'jobCode',
  'description',
  'descriptionEn',
  'descriptionJp',
  'instruction',
  'instructionEn',
  'instructionJp',
  'recruitmentReason',
  'recruitmentReasonEn',
  'recruitmentReasonJp',
  'highlights',
  'interviewLocation',
  'numberOfHires',
  'numberOfHiresEn',
  'numberOfHiresJp',
  'bonus',
  'bonusEn',
  'bonusJp',
  'salaryReview',
  'salaryReviewEn',
  'salaryReviewJp',
  'holidays',
  'holidaysEn',
  'holidaysJp',
  'holidayDetails',
  'holidayDetailsEn',
  'holidayDetailsJp',
  'socialInsurance',
  'socialInsuranceEn',
  'socialInsuranceJp',
  'transportation',
  'transportationEn',
  'transportationJp',
  'breakTime',
  'breakTimeEn',
  'breakTimeJp',
  'overtime',
  'overtimeEn',
  'overtimeJp',
  'recruitmentType',
  'residenceStatus',
  'residenceStatusEn',
  'residenceStatusJp',
  'contractPeriod',
  'contractPeriodEn',
  'contractPeriodJp',
  'probationPeriod',
  'probationPeriodEn',
  'probationPeriodJp',
  'probationDetail',
  'probationDetailEn',
  'probationDetailJp',
  'recruitmentProcess',
  'recruitmentProcessEn',
  'recruitmentProcessJp',
  'transferAbility',
  'transferAbilityEn',
  'transferAbilityJp',
  'deadline',
  'status',
];

function pickWritableFields(body) {
  const result = {};
  for (const key of WRITABLE_FIELDS) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

async function validateJobCategory(jobCategoryId) {
  if (!jobCategoryId) return null;
  const category = await JobCategory.findByPk(jobCategoryId);
  return category || null;
}

async function findOwnedJob(id, businessId, options = {}) {
  const include = [
    {
      model: JobCategory,
      as: 'category',
      required: false,
    },
  ];
  if (options.withCommission) {
    include.push({
      model: JobValue,
      as: 'jobValues',
      required: false,
      include: [
        { model: Type, as: 'type', required: false },
        { model: Value, as: 'valueRef', required: false },
      ],
    });
  }
  if (options.withDetail) {
    include.push(
      {
        model: Company,
        as: 'company',
        required: false,
      },
      {
        model: JobRecruitingCompany,
        as: 'recruitingCompany',
        required: false,
        include: [
          {
            model: JobRecruitingCompanyService,
            as: 'services',
            required: false,
          },
          {
            model: JobRecruitingCompanyBusinessSector,
            as: 'businessSectors',
            required: false,
          },
        ],
      },
      { model: Requirement, as: 'requirements', required: false, separate: true },
      {
        model: Benefit,
        as: 'benefits',
        required: false,
        separate: true,
        attributes: ['id', 'content', 'contentEn', 'contentJp'],
      },
      { model: SalaryRange, as: 'salaryRanges', required: false, separate: true },
      { model: SalaryRangeDetail, as: 'salaryRangeDetails', required: false, separate: true },
      { model: WorkingHour, as: 'workingHours', required: false, separate: true },
      { model: WorkingHourDetail, as: 'workingHourDetails', required: false, separate: true },
      { model: WorkingLocation, as: 'workingLocations', required: false },
      { model: WorkingLocationDetail, as: 'workingLocationDetails', required: false, separate: true },
      { model: OvertimeAllowance, as: 'overtimeAllowances', required: false, separate: true },
      { model: OvertimeAllowanceDetail, as: 'overtimeAllowanceDetails', required: false, separate: true },
      { model: SmokingPolicy, as: 'smokingPolicies', required: false, separate: true },
      { model: SmokingPolicyDetail, as: 'smokingPolicyDetails', required: false, separate: true },
    );
  }
  const { withCommission, withDetail, ...findOptions } = options;
  return Job.findOne({
    where: { id, businessId },
    include,
    ...findOptions,
  });
}

export const businessJobController = {
  getJobs: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const offset = (page - 1) * limit;
      const search = normalizeQueryParam(req.query.search);
      const statusText = normalizeQueryParam(req.query.status);

      const where = { businessId: req.business.id };

      if (statusText != null && statusText !== '') {
        where.status = parseInt(statusText, 10);
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { titleEn: { [Op.like]: `%${search}%` } },
          { titleJp: { [Op.like]: `%${search}%` } },
          { jobCode: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Job.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: JobCategory,
            as: 'category',
            required: false,
            attributes: ['id', 'name', 'nameEn', 'nameJp'],
          },
        ],
      });

      const jobIds = rows.map((row) => row.id);
      let applicationCountByJobId = {};
      if (jobIds.length > 0) {
        const countRows = await JobApplication.findAll({
          attributes: ['jobId', [fn('COUNT', col('id')), 'applicationCount']],
          where: { jobId: { [Op.in]: jobIds } },
          group: ['jobId'],
          raw: true,
        });
        applicationCountByJobId = Object.fromEntries(
          countRows.map((row) => [
            String(row.jobId ?? row.job_id),
            Number(row.applicationCount ?? 0),
          ]),
        );
      }

      const jobs = rows.map((row) => ({
        ...row.toJSON(),
        applicationCount: applicationCountByJobId[String(row.id)] ?? 0,
      }));

      res.json({
        success: true,
        data: {
          jobs,
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

  getJobById: async (req, res, next) => {
    try {
      const job = await findOwnedJob(req.params.id, req.business.id, {
        withCommission: true,
        withDetail: true,
      });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy việc làm',
        });
      }

      res.json({
        success: true,
        data: { job: typeof job.toJSON === 'function' ? job.toJSON() : job },
      });
    } catch (error) {
      next(error);
    }
  },

  /** Ủy quyền admin createJob: parse FormData `data`, lưu nested relations, gán businessId. */
  createJob: jobController.createJob,

  updateJob: async (req, res, next) => {
    try {
      const owned = await Job.findOne({
        where: { id: req.params.id, businessId: req.business.id },
      });
      if (!owned) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy việc làm',
        });
      }
      return jobController.updateJob(req, res, next);
    } catch (error) {
      next(error);
    }
  },

  deleteJob: async (req, res, next) => {
    try {
      const job = await Job.findOne({
        where: { id: req.params.id, businessId: req.business.id },
        include: [
          {
            model: JobApplication,
            as: 'applications',
            required: false,
            attributes: ['id'],
          },
        ],
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy việc làm',
        });
      }

      if (job.applications && job.applications.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            'Không thể xóa việc làm có ứng viên đã ứng tuyển. Vui lòng đóng việc làm trước.',
        });
      }

      await job.destroy();
      await bumpJobListCacheVersion();

      res.json({
        success: true,
        message: 'Xóa việc làm thành công',
      });
    } catch (error) {
      next(error);
    }
  },
};
