import { Op } from 'sequelize';
import {
  Job,
  JobCategory,
  JobApplication,
  JobValue,
  Type,
  Value,
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
  const { withCommission, ...findOptions } = options;
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

      res.json({
        success: true,
        data: {
          jobs: rows,
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
      const job = await findOwnedJob(req.params.id, req.business.id, { withCommission: true });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy việc làm',
        });
      }

      res.json({
        success: true,
        data: { job },
      });
    } catch (error) {
      next(error);
    }
  },

  /** Ủy quyền admin createJob: parse FormData `data`, lưu nested relations, gán businessId. */
  createJob: jobController.createJob,

  updateJob: async (req, res, next) => {
    try {
      const job = await Job.findOne({
        where: { id: req.params.id, businessId: req.business.id },
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy việc làm',
        });
      }

      const body = pickWritableFields(req.body);

      if (body.jobCategoryId !== undefined) {
        const category = await validateJobCategory(body.jobCategoryId);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Danh mục việc làm không tồn tại',
          });
        }
      }

      if (body.jobCode && body.jobCode !== job.jobCode) {
        const existingCode = await Job.findOne({ where: { jobCode: body.jobCode } });
        if (existingCode) {
          return res.status(409).json({
            success: false,
            message: 'Mã việc làm đã tồn tại',
          });
        }
      }

      if (body.slug && body.slug !== job.slug) {
        const existingSlug = await Job.findOne({ where: { slug: body.slug } });
        if (existingSlug) {
          return res.status(409).json({
            success: false,
            message: 'Slug đã tồn tại',
          });
        }
      } else if (body.title && !body.slug && body.title !== job.title) {
        body.slug = await generateUniqueSlug(body.title, job.id);
      }

      await job.update(body);
      await bumpJobListCacheVersion();

      const updated = await findOwnedJob(job.id, req.business.id);

      res.json({
        success: true,
        message: 'Cập nhật việc làm thành công',
        data: { job: updated },
      });
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
