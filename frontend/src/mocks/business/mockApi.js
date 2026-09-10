import {
  MOCK_BUSINESS_USER,
  MOCK_JOBS,
  MOCK_SCOUT_CANDIDATES,
  MOCK_LANDING_TEMPLATES,
  MOCK_LANDING_PAGES,
  MOCK_CTV_SHARING,
  MOCK_CATEGORY_TREE,
  MOCK_JOB_CATEGORIES,
} from './fixtures'

const delay = (ms = 120) => new Promise((resolve) => { setTimeout(resolve, ms) })

function ok(data, message) {
  return delay().then(() => (message ? { success: true, data, message } : { success: true, data }))
}

function paginate(items, { page = 1, limit = 20 } = {}) {
  const p = Math.max(1, Number.parseInt(page, 10) || 1)
  const l = Math.max(1, Number.parseInt(limit, 10) || 20)
  const start = (p - 1) * l
  return {
    items: items.slice(start, start + l),
    pagination: {
      total: items.length,
      page: p,
      limit: l,
      totalPages: Math.max(1, Math.ceil(items.length / l)),
    },
  }
}

function findJob(id) {
  return MOCK_JOBS.find((job) => String(job.id) === String(id)) || null
}

function findScoutCandidate(id) {
  return MOCK_SCOUT_CANDIDATES.find((c) => String(c.id) === String(id)) || null
}

function findLandingPage(id) {
  return MOCK_LANDING_PAGES.find((p) => String(p.id) === String(id)) || null
}

let mockJobs = [...MOCK_JOBS]
let mockLandingPages = [...MOCK_LANDING_PAGES]
let mockScoutCandidates = MOCK_SCOUT_CANDIDATES.map((c) => ({ ...c }))
let nextJobId = 200
let nextLandingId = 10

export const businessMockApi = {
  loginBusiness: async () => ok({ token: 'static-ui-mock-token', business: MOCK_BUSINESS_USER }),
  registerBusiness: async () => ok({ message: 'Đăng ký demo thành công' }),
  verifyBusinessEmail: async () => ok({ message: 'Xác thực demo thành công' }),
  resendBusinessVerification: async () => ok({}),
  forgotPasswordBusiness: async () => ok({ message: 'Đã gửi email demo' }),
  resetPasswordBusiness: async () => ok({ message: 'Đặt lại mật khẩu demo thành công' }),
  changePasswordBusiness: async () => ok({}),
  getBusinessProfile: async () => ok({ business: MOCK_BUSINESS_USER }),
  logoutBusiness: async () => ok({}),
  getBusinessCredit: async () => ok({ credit: MOCK_BUSINESS_USER.credit }),
  getBusinessCreditHistory: async () => ok({ history: [], pagination: paginate([], {}).pagination }),

  getBusinessJobs: async (params = {}) => {
    let items = [...mockJobs]
    if (params.status != null && params.status !== '') {
      items = items.filter((job) => Number(job.status) === Number(params.status))
    }
    const { items: jobs, pagination } = paginate(items, params)
    return ok({ jobs, pagination })
  },
  getBusinessJobById: async (id) => {
    const job = findJob(id)
    return job ? ok({ job }) : delay().then(() => ({ success: false, message: 'Không tìm thấy JD' }))
  },
  createBusinessJob: async (payload) => {
    const job = {
      id: nextJobId++,
      jobCode: `JOB-DEMO-${nextJobId}`,
      status: 1,
      recruitmentType: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload,
    }
    mockJobs = [job, ...mockJobs]
    return ok({ job })
  },
  updateBusinessJob: async (id, payload) => {
    const idx = mockJobs.findIndex((job) => String(job.id) === String(id))
    if (idx < 0) return delay().then(() => ({ success: false, message: 'Không tìm thấy JD' }))
    mockJobs[idx] = { ...mockJobs[idx], ...payload, updatedAt: new Date().toISOString() }
    return ok({ job: mockJobs[idx] })
  },
  deleteBusinessJob: async (id) => {
    mockJobs = mockJobs.filter((job) => String(job.id) !== String(id))
    return ok({})
  },

  getBusinessScoutSettings: async () => ok({ scoutCreditCost: 5, credit: MOCK_BUSINESS_USER.credit }),
  getBusinessScoutCandidates: async (params = {}) => {
    let items = mockScoutCandidates.filter((c) => !c.isUnlocked || c.unlockType !== 'scout_performance')
    if (params.search) {
      const q = String(params.search).toLowerCase()
      items = items.filter((c) =>
        [c.name, c.code, c.desiredPosition, ...(c.skillTags || [])]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)))
    }
    const { items: candidates, pagination } = paginate(items, params)
    return ok({
      candidates,
      pagination,
      scoutCreditCost: 5,
      credit: MOCK_BUSINESS_USER.credit,
    })
  },
  getBusinessScoutCandidateById: async (id) => {
    const candidate = findScoutCandidate(id)
    return candidate
      ? ok({ candidate, scoutCreditCost: 5, credit: MOCK_BUSINESS_USER.credit })
      : delay().then(() => ({ success: false, message: 'Không tìm thấy ứng viên' }))
  },
  unlockBusinessScoutCandidate: async (id) => {
    mockScoutCandidates = mockScoutCandidates.map((c) =>
      String(c.id) === String(id)
        ? { ...c, isUnlocked: true, unlockType: 'scout_credit', name: c.name || `Ứng viên #${id}` }
        : c)
    return ok({ candidate: findScoutCandidate(id), credit: MOCK_BUSINESS_USER.credit - 5 })
  },
  getBusinessScoutUnlockedCandidates: async (params = {}) => {
    const items = mockScoutCandidates.filter((c) => c.isUnlocked)
    const { items: candidates, pagination } = paginate(items, params)
    return ok({ candidates, pagination })
  },
  getBusinessScoutUnlockedCandidateById: async (id) => {
    const candidate = findScoutCandidate(id)
    return candidate?.isUnlocked
      ? ok({ candidate })
      : delay().then(() => ({ success: false, message: 'Hồ sơ chưa mở' }))
  },
  createBusinessScoutPerformanceRequest: async (cvId, payload = {}) => {
    mockScoutCandidates = mockScoutCandidates.map((c) =>
      String(c.id) === String(cvId)
        ? {
          ...c,
          isUnlocked: true,
          unlockType: 'scout_performance',
          name: c.name || `Ứng viên #${cvId}`,
        }
        : c)
    return ok({
      performanceRequest: {
        id: 9001,
        cvId: Number(cvId),
        jobId: payload.jobId || MOCK_JOBS[0].id,
        status: 'pending',
      },
      candidate: findScoutCandidate(cvId),
    })
  },
  getBusinessScoutPerformanceRequests: async (params = {}) => ok({
    requests: [],
    pagination: paginate([], params).pagination,
  }),

  getBusinessLandingPageTemplates: async () => ok({ templates: MOCK_LANDING_TEMPLATES }),
  getBusinessLandingPageDashboard: async () => ok({
    totalPages: mockLandingPages.length,
    published: mockLandingPages.filter((p) => p.status === 'published').length,
    draft: mockLandingPages.filter((p) => p.status === 'draft').length,
  }),
  getBusinessLandingPages: async (params = {}) => {
    const { items: landingPages, pagination } = paginate(mockLandingPages, params)
    return ok({ landingPages, pagination })
  },
  getBusinessLandingPageById: async (id) => {
    const landingPage = findLandingPage(id)
    return landingPage
      ? ok({ landingPage })
      : delay().then(() => ({ success: false, message: 'Không tìm thấy landing page' }))
  },
  createBusinessLandingPage: async ({ jobId, templateKey }) => {
    const job = findJob(jobId)
    const landingPage = {
      id: nextLandingId++,
      jobId: Number(jobId),
      templateKey,
      title: job?.title || 'Landing page demo',
      status: 'draft',
      statusLabel: 'Nháp',
      slug: `demo-${nextLandingId}`,
      content: '<section>Demo landing page content</section>',
      metaTitle: job?.title || 'Demo',
      metaDescription: 'Static UI demo landing page',
      metaKeywords: 'demo, jobshare',
      updatedAt: new Date().toISOString(),
      job,
    }
    mockLandingPages = [landingPage, ...mockLandingPages]
    return ok({ landingPage })
  },
  updateBusinessLandingPage: async (id, patch) => {
    const idx = mockLandingPages.findIndex((p) => String(p.id) === String(id))
    if (idx < 0) return delay().then(() => ({ success: false, message: 'Không tìm thấy landing page' }))
    mockLandingPages[idx] = { ...mockLandingPages[idx], ...patch, updatedAt: new Date().toISOString() }
    return ok({ landingPage: mockLandingPages[idx] })
  },
  publishBusinessLandingPage: async (id) => {
    const page = findLandingPage(id)
    if (!page) return delay().then(() => ({ success: false, message: 'Không tìm thấy landing page' }))
    return businessMockApi.updateBusinessLandingPage(id, { status: 'published', statusLabel: 'Đang hoạt động' })
  },
  pauseBusinessLandingPage: async (id) => businessMockApi.updateBusinessLandingPage(id, { status: 'paused', statusLabel: 'Tạm dừng' }),
  uploadBusinessLandingPageMedia: async () => ok({ url: 'https://placehold.co/800x450/png', filename: 'demo.png' }),

  getBusinessCandidateSharingDashboard: async () => ok(MOCK_CTV_SHARING.dashboard),
  getBusinessCandidateSharingListings: async (params = {}) => {
    const { items: listings, pagination } = paginate(MOCK_CTV_SHARING.listings, params)
    return ok({ listings, pagination })
  },
  createBusinessCandidateSharingListing: async (payload) => ok({
    listing: {
      id: 99,
      ...payload,
      status: 'draft',
      statusLabel: 'Nháp',
      createdAt: new Date().toISOString(),
    },
  }),
  submitBusinessCandidateSharingListing: async (id) => ok({
    listing: { id, status: 'pending_review', statusLabel: 'Chờ duyệt' },
  }),
  getBusinessCandidateSharingNominations: async (params = {}) => {
    const { items: nominations, pagination } = paginate(MOCK_CTV_SHARING.nominations, params)
    return ok({ nominations, pagination })
  },
  getBusinessCandidateSharingSettlements: async (params = {}) => {
    const { items: settlements, pagination } = paginate(MOCK_CTV_SHARING.settlements, params)
    return ok({ settlements, pagination })
  },

  getBusinessApplications: async (params = {}) => ok({
    applications: [],
    pagination: paginate([], params).pagination,
  }),
  getBusinessApplicationStats: async () => ok({ stats: { total: 0, active: 0 } }),
  getBusinessApplicationById: async () => ok({ application: null }),
  getBusinessApplicationCv: async () => ok({ cv: findScoutCandidate(501) }),
  updateBusinessApplicationStatus: async () => ok({}),

  getBusinessBillingDashboard: async () => ok({ balance: MOCK_BUSINESS_USER.credit }),
  getBusinessBillingTransactions: async () => ok({ transactions: [], pagination: paginate([], {}).pagination }),
  getBusinessBillingRequests: async () => ok({ requests: [], pagination: paginate([], {}).pagination }),
  getBusinessBillingInvoices: async () => ok({ invoices: [], pagination: paginate([], {}).pagination }),
  getBusinessCreditRequests: async () => ok({ requests: [], pagination: paginate([], {}).pagination }),
  createBusinessCreditRequest: async () => ok({ request: { id: 1, status: 'pending' } }),
  getBusinessCreditRequestById: async () => ok({ request: { id: 1, status: 'approved' } }),
  updateBusinessCreditRequest: async () => ok({}),
  deleteBusinessCreditRequest: async () => ok({}),

  getBusinessMessages: async () => ok({ messages: [] }),
  getBusinessMessagesByApplication: async () => ok({ messages: [] }),
  createBusinessMessage: async () => ok({}),

  jdBuilderStart: async () => ok({
    session_id: 'mock-jd-session',
    reply: 'Xin chào! Hãy mô tả vị trí bạn muốn tuyển.',
    done: false,
  }),
  jdBuilderGetSession: async () => ok({
    session_id: 'mock-jd-session',
    messages: [{ role: 'assistant', content: 'Phiên demo JD builder.' }],
    done: false,
  }),
  jdBuilderChat: async () => ok({
    session_id: 'mock-jd-session',
    reply: 'Đã ghi nhận. Bạn có thể bổ sung thêm yêu cầu kỹ năng.',
    done: false,
  }),
  jdBuilderFinalizeTranslate: async () => ok({
    jobDraft: {
      title: 'Software Engineer (Demo)',
      description: 'JD được tạo từ mock AI builder.',
    },
  }),

  getCTVJobCategoryTree: async () => ok({ tree: MOCK_CATEGORY_TREE }),
  getCTVJobCategories: async () => ok({ categories: MOCK_JOB_CATEGORIES, pagination: paginate(MOCK_JOB_CATEGORIES, { limit: 500 }).pagination }),
  getAllTypes: async () => ok({ types: [] }),
  getValuesByType: async () => ok({ values: [] }),
  createType: async (data) => ok({ type: { id: 1, ...data } }),
  updateType: async (id, data) => ok({ type: { id, ...data } }),
  deleteType: async () => ok({}),
  createValue: async (data) => ok({ value: { id: 1, ...data } }),
  updateValue: async (id, data) => ok({ value: { id, ...data } }),
  deleteValue: async () => ok({}),
  getCompanies: async () => ok({ companies: [{ id: 1, name: MOCK_BUSINESS_USER.companyName }] }),
  getAdminCampaigns: async () => ok({ campaigns: [], pagination: paginate([], {}).pagination }),
  previewAdminJobJdPdf: async () => ok({ url: 'about:blank' }),
  syncJobVector: async () => ok({}),
}

export default businessMockApi
