export const MOCK_BUSINESS_USER = {
  id: 1,
  companyName: 'Công ty Demo JobShare',
  companyNameEn: 'JobShare Demo Co., Ltd.',
  companyNameJp: 'ジョブシェアデモ株式会社',
  contactName: 'Nguyễn Minh Demo',
  contactTitle: 'HR Manager',
  email: 'demo@jobshare.vn',
  credit: 120,
}

export const MOCK_JOBS = [
  {
    id: 101,
    jobCode: 'JOB00001201214',
    title: 'ソフトウェア開発エンジニア',
    titleEn: 'Software Development Engineer',
    status: 1,
    recruitmentType: 1,
    interviewLocation: 'Tokyo, Japan',
    numberOfHires: '2名',
    description: 'React / Node.js を中心とした Web アプリ開発。チームと協力しながら新機能の設計・実装を担当します。',
    descriptionEn: 'Web application development centered on React and Node.js.',
    requirements: [
      { type: 'experience', status: 'required', content: '実務経験3年以上' },
      { type: 'language', status: 'required', content: '日本語 N2 以上' },
    ],
    salaryRanges: [{ type: 'yearly', salaryRange: '500万円〜700万円' }],
    workingLocations: [{ workingLocation: '東京都港区' }],
    workingHours: [{ workingHours: '9:00 - 18:00（フレックス可）' }],
    highlights: ['remote_partial', 'visa_support'],
    createdAt: '2025-08-12T08:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 102,
    jobCode: 'FE2405-0012',
    title: 'Frontend Developer (ReactJS)',
    titleEn: 'Frontend Developer (ReactJS)',
    status: 1,
    recruitmentType: 1,
    interviewLocation: 'Hà Nội',
    description: 'Phát triển sản phẩm SaaS tuyển dụng với React, TypeScript.',
    requirements: [{ type: 'skill', status: 'required', content: 'React, TypeScript' }],
    createdAt: '2025-05-18T10:30:00.000Z',
    updatedAt: '2025-12-20T14:20:00.000Z',
  },
  {
    id: 103,
    jobCode: 'MECH-2024-08',
    title: 'Kỹ sư cơ khí',
    titleEn: 'Mechanical Engineer',
    status: 0,
    recruitmentType: 1,
    interviewLocation: 'Osaka',
    description: 'Thiết kế và tối ưu linh kiện cơ khí cho dây chuyền sản xuất.',
    createdAt: '2024-11-02T09:00:00.000Z',
    updatedAt: '2025-01-15T11:00:00.000Z',
  },
  {
    id: 104,
    jobCode: 'QA-2401-009',
    title: 'QA Engineer',
    titleEn: 'QA Engineer',
    status: 2,
    recruitmentType: 1,
    interviewLocation: 'Đà Nẵng',
    description: 'Kiểm thử manual và automation cho hệ thống HR.',
    createdAt: '2024-01-09T08:00:00.000Z',
    updatedAt: '2024-06-01T08:00:00.000Z',
  },
]

const baseScoutCandidate = {
  desiredPosition: 'Software Engineer',
  experienceYears: 5,
  desiredWorkLocation: 'Tokyo',
  desiredSalary: '600万円',
  jlptLevel: 'N2',
  jpResidenceStatus: 'engineer',
  educations: [{ period: '2015 - 2019', content: 'Đại học Bách Khoa — CNTT' }],
  certificates: [{ name: 'JLPT N2', year: '2022' }],
  workExperiences: [
    {
      role: 'Backend Developer',
      companyTypeLabel: 'IT / SaaS',
      period: '2020 - nay',
      companyName: 'Tech Corp Japan',
      description: 'Phát triển API và tích hợp hệ thống.',
    },
  ],
  prSummary: 'Có kinh nghiệm làm việc tại Nhật, giao tiếp tiếng Nhật tốt.',
  skillTags: ['React', 'Node.js', 'TypeScript', 'AWS'],
  email: 'hoan.demo@example.com',
  phone: '+81 90 1234 5678',
  gender: 'male',
  birthDate: '1995-04-12',
  addressCurrent: 'Tokyo, Japan',
}

export const MOCK_SCOUT_CANDIDATES = [
  {
    id: 501,
    code: 'CV-B85A9A74',
    name: 'NGUYEN VAN HOAN',
    matchScore: 88,
    isUnlocked: true,
    unlockType: 'scout_performance',
    ...baseScoutCandidate,
  },
  {
    id: 502,
    code: 'CV-ANON-002',
    displayNameVi: 'Ứng viên ẩn danh #2',
    matchScore: 76,
    isUnlocked: false,
    desiredPosition: 'Frontend Developer',
    experienceYears: 4,
    desiredWorkLocation: 'Osaka',
    skillTags: ['React', 'Vue', 'CSS'],
  },
  {
    id: 503,
    code: 'CV-ANON-003',
    displayNameVi: 'Ứng viên ẩn danh #3',
    matchScore: 71,
    isUnlocked: false,
    desiredPosition: 'DevOps Engineer',
    experienceYears: 6,
    desiredWorkLocation: 'Tokyo',
    skillTags: ['Docker', 'Kubernetes', 'AWS'],
  },
  {
    id: 504,
    code: 'CV-UNLOCK-004',
    name: 'TRAN THI LAN',
    matchScore: 82,
    isUnlocked: true,
    unlockType: 'scout_credit',
    desiredPosition: 'QA Engineer',
    experienceYears: 3,
    desiredWorkLocation: 'Hà Nội',
    email: 'lan.demo@example.com',
    phone: '+84 912 345 678',
    skillTags: ['Selenium', 'Jest', 'Manual QA'],
    prSummary: 'Kinh nghiệm QA sản phẩm B2B.',
  },
]

export const MOCK_LANDING_TEMPLATES = [
  { key: 'tp_lp3_biz_movie1', name: 'Corporate Video', description: 'Landing page giới thiệu công ty + video' },
  { key: 'tp_lp1_biz_standard', name: 'Standard JD', description: 'Template JD chuẩn JobShare' },
]

export const MOCK_LANDING_PAGES = [
  {
    id: 1,
    jobId: 101,
    templateKey: 'tp_lp3_biz_movie1',
    title: 'Software Engineer — Join Our Team',
    status: 'published',
    statusLabel: 'Đang hoạt động',
    slug: 'software-engineer-demo',
    updatedAt: '2026-02-10T09:00:00.000Z',
    job: MOCK_JOBS[0],
  },
  {
    id: 2,
    jobId: 102,
    templateKey: 'tp_lp1_biz_standard',
    title: 'Frontend Developer',
    status: 'draft',
    statusLabel: 'Nháp',
    slug: 'frontend-developer-demo',
    updatedAt: '2026-01-05T15:30:00.000Z',
    job: MOCK_JOBS[1],
  },
]

export const MOCK_CTV_SHARING = {
  dashboard: {
    activeListings: 2,
    pendingNominations: 3,
    totalCommissionPaid: 45000000,
    openSettlements: 1,
  },
  listings: [
    {
      id: 11,
      jobId: 101,
      jobTitle: MOCK_JOBS[0].title,
      status: 'active',
      statusLabel: 'Đang đăng',
      commissionType: 'percent',
      createdAt: '2025-10-01T08:00:00.000Z',
    },
  ],
  nominations: [
    {
      id: 21,
      candidateName: 'Le Van A',
      jobTitle: MOCK_JOBS[0].title,
      status: 'reviewing',
      statusLabel: 'Đang xem xét',
      ctvName: 'Partner CTV 01',
      createdAt: '2026-02-20T08:00:00.000Z',
    },
  ],
  settlements: [
    {
      id: 31,
      amount: 12000000,
      status: 'pending',
      statusLabel: 'Chờ thanh toán',
      period: '2026-01',
    },
  ],
}

export const MOCK_CATEGORY_TREE = [
  {
    id: 1,
    name: 'IT / Phần mềm',
    nameEn: 'IT / Software',
    children: [
      { id: 11, name: 'Frontend', nameEn: 'Frontend', parentId: 1 },
      { id: 12, name: 'Backend', nameEn: 'Backend', parentId: 1 },
    ],
  },
  {
    id: 2,
    name: 'Kỹ thuật',
    nameEn: 'Engineering',
    children: [{ id: 21, name: 'Cơ khí', nameEn: 'Mechanical', parentId: 2 }],
  },
]

export const MOCK_JOB_CATEGORIES = MOCK_CATEGORY_TREE.flatMap((parent) => [
  parent,
  ...(parent.children || []),
])
