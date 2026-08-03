import { Op } from 'sequelize';
import {
  Job,
  JobApplication,
  JobCategory,
  BusinessCtvMarketplaceSettlement,
  BusinessCreditHistory,
} from '../models/index.js';
import { getJobApplicationStatus } from '../constants/jobApplicationStatus.js';
import {
  loadSourceMaps,
  resolveSourceType,
  SOURCE_LABELS,
} from './businessJobApplicationService.js';

const HIRED_STATUSES = [12, 14, 15];
const INTERVIEW_STATUSES = [7, 8, 9];

const PERIOD_MAP = {
  week: 'week',
  tuần: 'week',
  month: 'month',
  tháng: 'month',
  year: 'year',
  năm: 'year',
};

const SOURCE_DISPLAY = {
  ctv_marketplace: 'CTV (HR Partner)',
  ctv_nomination: 'CTV (HR Partner)',
  scout_credit: 'Scout (Mở bảng credit)',
  scout_performance: 'Scout Performance',
  landing: 'Website công ty',
  other: 'Khác',
};

function normalizePeriod(raw) {
  const key = String(raw || 'month').trim().toLowerCase();
  return PERIOD_MAP[key] || 'month';
}

function parseDateRange({ from, to, period = 'month' }) {
  const p = normalizePeriod(period);
  const end = to ? new Date(to) : new Date();
  if (Number.isNaN(end.getTime())) end.setTime(Date.now());
  end.setHours(23, 59, 59, 999);

  let start;
  if (from) {
    start = new Date(from);
    if (Number.isNaN(start.getTime())) start = new Date(end);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(end);
    if (p === 'week') start.setDate(start.getDate() - 28);
    else if (p === 'year') start.setFullYear(start.getFullYear() - 1);
    else start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }

  const durationMs = Math.max(end.getTime() - start.getTime(), 86400000);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  prevStart.setHours(0, 0, 0, 0);

  return { start, end, prevStart, prevEnd, period: p };
}

function inRange(date, start, end) {
  if (!date) return false;
  const t = new Date(date).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function formatDateLabel(d, period) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  if (period === 'year') return `${mm}/${String(d.getFullYear()).slice(-2)}`;
  return `${dd}/${mm}`;
}

function formatRangeLabel(start, end) {
  const fmt = (d) => d.toLocaleDateString('vi-VN');
  return `${fmt(start)} – ${fmt(end)}`;
}

function pctChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatPctChange(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n}% so với kỳ trước`;
}

function formatVnd(amount) {
  const n = Math.round(Number(amount) || 0);
  return `${n.toLocaleString('vi-VN')}đ`;
}

function jobStatusLabel(status) {
  const n = Number(status);
  if (n === 1) return 'Đang tuyển';
  if (n === 0) return 'Tạm dừng';
  if (n === 2 || n === 3) return 'Đã đóng';
  return 'Không xác định';
}

async function getOwnedJobIds(businessId) {
  const rows = await Job.findAll({
    where: { businessId },
    attributes: ['id'],
  });
  return rows.map((r) => Number(r.id));
}

function buildTrendBuckets(start, end, period) {
  const count = period === 'year' ? 6 : 5;
  const totalMs = end.getTime() - start.getTime();
  const buckets = [];
  for (let i = 0; i < count; i += 1) {
    const bucketEnd = new Date(start.getTime() + (totalMs * (i + 1)) / count);
    buckets.push({
      end: bucketEnd,
      label: formatDateLabel(bucketEnd, period),
    });
  }
  return buckets;
}

function countJobsUntil(jobs, until) {
  const t = until.getTime();
  return jobs.filter((j) => new Date(j.createdAt).getTime() <= t).length;
}

function appDate(a) {
  return a?.appliedAt || null;
}

function countAppsUntil(apps, until, filterFn) {
  const t = until.getTime();
  return apps.filter((a) => {
    const at = appDate(a);
    if (!at) return false;
    return new Date(at).getTime() <= t && (!filterFn || filterFn(a));
  }).length;
}

function buildTrendSeries(jobs, apps, start, end, period) {
  const buckets = buildTrendBuckets(start, end, period);
  return buckets.map((b) => ({
    date: b.label,
    jd: countJobsUntil(jobs, b.end),
    tiencu: countAppsUntil(apps, b.end),
    phongvan: countAppsUntil(apps, b.end, (a) => INTERVIEW_STATUSES.includes(Number(a.status)) || HIRED_STATUSES.includes(Number(a.status))),
    tuyendung: countAppsUntil(apps, b.end, (a) => HIRED_STATUSES.includes(Number(a.status))),
  }));
}

function buildSparkline(trend, key) {
  return trend.map((row) => Number(row[key]) || 0);
}

function aggregateSourceHires(apps, maps) {
  const counts = {};
  apps.forEach((row) => {
    if (!HIRED_STATUSES.includes(Number(row.status))) return;
    const source = resolveSourceType(row, maps);
    const label = SOURCE_DISPLAY[source] || SOURCE_LABELS[source] || source;
    counts[label] = (counts[label] || 0) + 1;
  });
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 0;
  return Object.entries(counts)
    .map(([name, value]) => ({
      name,
      value,
      percent: total ? `${Math.round((value / total) * 1000) / 10}%` : '0%',
    }))
    .sort((a, b) => b.value - a.value);
}

function buildDeptHires(jobs, apps) {
  const jobById = new Map(jobs.map((j) => [Number(j.id), j]));
  const counts = {};
  apps.forEach((a) => {
    if (!HIRED_STATUSES.includes(Number(a.status))) return;
    const job = jobById.get(Number(a.jobId));
    const dept = job?.category?.name || job?.businessSectorKey || 'Khác';
    counts[dept] = (counts[dept] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function buildTopPositions(jobs, apps, trend) {
  const byJob = {};
  apps.forEach((a) => {
    const jid = Number(a.jobId);
    if (!byJob[jid]) byJob[jid] = { total: 0, hired: 0 };
    byJob[jid].total += 1;
    if (HIRED_STATUSES.includes(Number(a.status))) byJob[jid].hired += 1;
  });

  const jobById = new Map(jobs.map((j) => [Number(j.id), j]));
  const totalHires = apps.filter((a) => HIRED_STATUSES.includes(Number(a.status))).length;

  return Object.entries(byJob)
    .map(([jobId, stats]) => {
      const job = jobById.get(Number(jobId));
      if (!job) return null;
      const rate = stats.total ? Math.round((stats.hired / stats.total) * 100) : 0;
      const base = Math.max(rate - 8, 5);
      const trendLine = [base, base + 2, base + 4, base + 6, rate].map((v) => Math.min(100, Math.max(0, v)));
      return {
        name: job.title,
        rate: `${rate}%`,
        rateNum: rate,
        hires: stats.hired,
        trend: trendLine,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.rateNum - a.rateNum || b.hires - a.hires)
    .slice(0, 5);
}

function buildJdTable(jobs, apps) {
  const byJob = {};
  apps.forEach((a) => {
    const jid = Number(a.jobId);
    if (!byJob[jid]) byJob[jid] = { tiencu: 0, phongvan: 0, tuyendung: 0 };
    byJob[jid].tiencu += 1;
    if (INTERVIEW_STATUSES.includes(Number(a.status)) || HIRED_STATUSES.includes(Number(a.status))) {
      byJob[jid].phongvan += 1;
    }
    if (HIRED_STATUSES.includes(Number(a.status))) byJob[jid].tuyendung += 1;
  });

  return jobs
    .map((job) => {
      const stats = byJob[Number(job.id)] || { tiencu: 0, phongvan: 0, tuyendung: 0 };
      const rate = stats.tiencu ? `${Math.round((stats.tuyendung / stats.tiencu) * 100)}%` : '0%';
      const code = job.jobCode ? ` (${job.jobCode})` : '';
      return {
        jd: `${job.title}${code}`,
        dept: job.category?.name || job.businessSectorKey || '—',
        tiencu: stats.tiencu,
        phongvan: stats.phongvan,
        tuyendung: stats.tuyendung,
        rate,
        status: jobStatusLabel(job.status),
      };
    })
    .sort((a, b) => b.tiencu - a.tiencu)
    .slice(0, 10);
}

function buildTimeToHireSeries(apps, start, end, period) {
  const hired = apps.filter((a) => HIRED_STATUSES.includes(Number(a.status)));
  const buckets = buildTrendBuckets(start, end, period);
  const points = buckets.map((b) => {
    const subset = hired.filter((a) => {
      const hireDate = a.nyushaDate || a.appliedAt;
      if (!hireDate) return false;
      return new Date(hireDate).getTime() <= b.end.getTime();
    });
    if (!subset.length) return { date: b.label, days: 0 };
    const totalDays = subset.reduce((sum, a) => {
      const from = appDate(a);
      const to = a.nyushaDate || a.appliedAt;
      if (!from || !to) return sum;
      const days = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000));
      return sum + days;
    }, 0);
    return { date: b.label, days: Math.round(totalDays / subset.length) };
  });
  const valid = points.filter((p) => p.days > 0);
  const avgDays = valid.length
    ? Math.round(valid.reduce((s, p) => s + p.days, 0) / valid.length)
    : 0;
  return { series: points, avgDays };
}

function buildHighlights({
  hiredChange,
  avgTimeToHire,
  prevAvgTimeToHire,
  topPosition,
  sourceData,
  totalNominations,
  hired,
}) {
  const items = [];
  if (hiredChange !== 0) {
    items.push({
      icon: '📊',
      title: hiredChange > 0
        ? `Tỷ lệ tuyển thành công tăng ${Math.abs(hiredChange)}%`
        : `Tỷ lệ tuyển thành công giảm ${Math.abs(hiredChange)}%`,
      desc: 'So với kỳ trước, hiệu quả tuyển dụng của bạn đang thay đổi theo xu hướng này.',
    });
  }
  if (topPosition?.name) {
    items.push({
      icon: '🎯',
      title: `${topPosition.name} là vị trí hiệu quả nhất`,
      desc: `Tỷ lệ chuyển đổi đạt ${topPosition.rate} trong kỳ đang xem.`,
    });
  }
  if (avgTimeToHire > 0) {
    const diff = prevAvgTimeToHire ? prevAvgTimeToHire - avgTimeToHire : 0;
    items.push({
      icon: '⏱️',
      title: diff > 0
        ? `Thời gian tuyển dụng trung bình giảm ${diff} ngày`
        : `Thời gian tuyển dụng trung bình: ${avgTimeToHire} ngày`,
      desc: diff > 0
        ? `Từ ${prevAvgTimeToHire} ngày xuống còn ${avgTimeToHire} ngày.`
        : 'Tính từ lúc nhận tiến cử đến khi tuyển thành công.',
    });
  }
  if (sourceData.length > 0 && totalNominations > 0) {
    const top = sourceData[0];
    items.push({
      icon: '👥',
      title: `Nguồn ${top.name} dẫn đầu tuyển thành công`,
      desc: `${top.value}/${hired || top.value} lượt tuyển thành công đến từ kênh này (${top.percent}).`,
    });
  }
  if (!items.length) {
    items.push({
      icon: '📋',
      title: 'Chưa đủ dữ liệu insight',
      desc: 'Đăng JD và nhận tiến cử để JobShare bắt đầu phân tích hiệu quả tuyển dụng.',
    });
  }
  return items.slice(0, 4);
}

async function sumRecruitmentCost(businessId, start, end) {
  const settlements = await BusinessCtvMarketplaceSettlement.findAll({
    where: {
      businessId,
      created_at: { [Op.between]: [start, end] },
    },
    attributes: ['totalAmountBusiness'],
  });
  const settlementTotal = settlements.reduce(
    (s, r) => s + Number(r.totalAmountBusiness || 0),
    0,
  );

  const creditRows = await BusinessCreditHistory.findAll({
    where: {
      businessId,
      changeAmount: { [Op.lt]: 0 },
      created_at: { [Op.between]: [start, end] },
    },
    attributes: ['changeAmount'],
  });
  const creditsUsed = creditRows.reduce((s, r) => s + Math.abs(Number(r.changeAmount) || 0), 0);
  // Ước tính 10.000đ / credit nếu chưa có hóa đơn settlement
  const creditEstimateVnd = creditsUsed * 10000;

  return settlementTotal + creditEstimateVnd;
}

export async function getBusinessInsightsReport({
  businessId,
  from,
  to,
  period = 'month',
  departmentId,
}) {
  const range = parseDateRange({ from, to, period });
  const { start, end, prevStart, prevEnd, period: p } = range;

  const ownedJobIds = await getOwnedJobIds(businessId);
  if (!ownedJobIds.length) {
    const emptyTrend = buildTrendSeries([], [], start, end, p);
    return {
      dateRange: { from: start.toISOString(), to: end.toISOString(), label: formatRangeLabel(start, end) },
      period: p,
      kpis: {
        totalJobs: 0,
        totalNominations: 0,
        interviewCount: 0,
        hiredCount: 0,
        recruitmentCostVnd: 0,
        changes: {
          totalJobs: 0,
          totalNominations: 0,
          interviewCount: 0,
          hiredCount: 0,
          recruitmentCostVnd: 0,
        },
      },
      trend: emptyTrend,
      funnel: [],
      funnelConversionRate: '0%',
      funnelConversionChange: 0,
      highlights: buildHighlights({ hiredChange: 0, avgTimeToHire: 0, prevAvgTimeToHire: 0, topPosition: null, sourceData: [], totalNominations: 0, hired: 0 }),
      deptData: [],
      sourceData: [],
      topPositions: [],
      jdTable: [],
      timeToHire: { avgDays: 0, changeDays: 0, series: emptyTrend.map((t) => ({ date: t.date, days: 0 })) },
      customReports: [],
    };
  }

  const jobWhere = {
    businessId,
    id: { [Op.in]: ownedJobIds },
    ...(departmentId ? { jobCategoryId: parseInt(departmentId, 10) } : {}),
  };

  const [jobs, applications, maps, recruitmentCost, prevRecruitmentCost] = await Promise.all([
    Job.findAll({
      where: jobWhere,
      attributes: ['id', 'title', 'jobCode', 'status', 'jobCategoryId', 'businessSectorKey', 'createdAt'],
      include: [
        { model: JobCategory, as: 'category', required: false, attributes: ['id', 'name'] },
      ],
    }),
    JobApplication.findAll({
      where: { jobId: { [Op.in]: ownedJobIds } },
      attributes: [
        'id', 'jobId', 'status', 'appliedAt', 'nyushaDate',
        'cvId', 'collaboratorId', 'adminId', 'applicantId',
      ],
      raw: true,
    }),
    loadSourceMaps(businessId, ownedJobIds),
    sumRecruitmentCost(businessId, start, end),
    sumRecruitmentCost(businessId, prevStart, prevEnd),
  ]);

  const jobIds = new Set(jobs.map((j) => Number(j.id)));
  const apps = applications.filter((a) => jobIds.has(Number(a.jobId)));

  const appsInRange = apps.filter((a) => inRange(appDate(a), start, end));
  const appsPrevRange = apps.filter((a) => inRange(appDate(a), prevStart, prevEnd));

  const jobsInRange = jobs.filter((j) => inRange(j.createdAt, start, end));
  const jobsPrevRange = jobs.filter((j) => inRange(j.createdAt, prevStart, prevEnd));

  const countInterview = (list) => list.filter(
    (a) => INTERVIEW_STATUSES.includes(Number(a.status)) || HIRED_STATUSES.includes(Number(a.status)),
  ).length;
  const countHired = (list) => list.filter((a) => HIRED_STATUSES.includes(Number(a.status))).length;

  const totalJobs = jobsInRange.length;
  const totalNominations = appsInRange.length;
  const interviewCount = countInterview(appsInRange);
  const hiredCount = countHired(appsInRange);

  const prevJobs = jobsPrevRange.length;
  const prevNominations = appsPrevRange.length;
  const prevInterview = countInterview(appsPrevRange);
  const prevHired = countHired(appsPrevRange);

  const changes = {
    totalJobs: pctChange(totalJobs, prevJobs),
    totalNominations: pctChange(totalNominations, prevNominations),
    interviewCount: pctChange(interviewCount, prevInterview),
    hiredCount: pctChange(hiredCount, prevHired),
    recruitmentCostVnd: pctChange(recruitmentCost, prevRecruitmentCost),
  };

  const trend = buildTrendSeries(jobs, apps, start, end, p);
  const totalJobsAll = jobs.length;
  const totalNominationsAll = apps.length;
  const interviewAll = countInterview(apps);
  const hiredAll = countHired(apps);

  const funnelConversion = totalNominationsAll
    ? Math.round((hiredAll / totalNominationsAll) * 1000) / 10
    : 0;
  const prevFunnelConversion = prevNominations
    ? Math.round((prevHired / prevNominations) * 1000) / 10
    : 0;

  const funnel = [
    { name: 'JD đã đăng', value: totalJobsAll, percent: '100%' },
    {
      name: 'Tiến cử nhận được',
      value: totalNominationsAll,
      percent: totalJobsAll ? `${Math.round((totalNominationsAll / totalJobsAll) * 1000) / 10}%` : '0%',
    },
    {
      name: 'Vào phỏng vấn',
      value: interviewAll,
      percent: totalNominationsAll ? `${Math.round((interviewAll / totalNominationsAll) * 1000) / 10}%` : '0%',
    },
    {
      name: 'Tuyển thành công',
      value: hiredAll,
      percent: interviewAll ? `${Math.round((hiredAll / interviewAll) * 1000) / 10}%` : '0%',
    },
  ];

  const sourceData = aggregateSourceHires(apps, maps);
  const deptData = buildDeptHires(jobs, apps);
  const topPositions = buildTopPositions(jobs, apps, trend);
  const jdTable = buildJdTable(jobs, apps);
  const timeToHireCurrent = buildTimeToHireSeries(
    apps.filter((a) => inRange(appDate(a), start, end)),
    start,
    end,
    p,
  );
  const timeToHirePrev = buildTimeToHireSeries(
    apps.filter((a) => inRange(appDate(a), prevStart, prevEnd)),
    prevStart,
    prevEnd,
    p,
  );

  const updatedLabel = end.toLocaleDateString('vi-VN');
  const customReports = [
    { title: 'Báo cáo hiệu quả tuyển dụng tổng quan', updated: updatedLabel },
    { title: 'Báo cáo chi phí tuyển dụng', updated: updatedLabel },
    { title: 'Báo cáo nguồn ứng viên', updated: updatedLabel },
    { title: 'Báo cáo JD theo phòng ban', updated: updatedLabel },
  ];

  return {
    dateRange: {
      from: start.toISOString(),
      to: end.toISOString(),
      label: formatRangeLabel(start, end),
    },
    period: p,
    kpis: {
      totalJobs,
      totalNominations,
      interviewCount,
      hiredCount,
      recruitmentCostVnd: recruitmentCost,
      changes,
      sparklines: {
        totalJobs: buildSparkline(trend, 'jd'),
        totalNominations: buildSparkline(trend, 'tiencu'),
        interviewCount: buildSparkline(trend, 'phongvan'),
        hiredCount: buildSparkline(trend, 'tuyendung'),
        recruitmentCostVnd: buildSparkline(trend, 'tuyendung').map((v) => Math.round((recruitmentCost / Math.max(hiredCount, 1)) * v)),
      },
    },
    trend,
    funnel,
    funnelConversionRate: `${funnelConversion}%`,
    funnelConversionChange: Math.round((funnelConversion - prevFunnelConversion) * 10) / 10,
    highlights: buildHighlights({
      hiredChange: changes.hiredCount,
      avgTimeToHire: timeToHireCurrent.avgDays,
      prevAvgTimeToHire: timeToHirePrev.avgDays,
      topPosition: topPositions[0] || null,
      sourceData,
      totalNominations,
      hired: hiredCount,
    }),
    deptData,
    sourceData,
    topPositions,
    jdTable,
    timeToHire: {
      avgDays: timeToHireCurrent.avgDays,
      changeDays: timeToHirePrev.avgDays
        ? timeToHirePrev.avgDays - timeToHireCurrent.avgDays
        : 0,
      series: timeToHireCurrent.series,
    },
    customReports,
  };
}

function daysBetweenDates(from, to) {
  if (!from || !to) return null;
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(1, Math.round((end - start) / 86400000));
}

function getHealthRatingKey(score) {
  const n = Number(score) || 0;
  if (n >= 80) return 'excellent';
  if (n >= 65) return 'good';
  if (n >= 50) return 'average';
  if (n > 0) return 'needsImprovement';
  return 'noData';
}

/**
 * Chỉ số Recruitment Health tổng hợp trên toàn bộ JD của doanh nghiệp.
 *
 * Công thức (0–100):
 * - 30% Pipeline: % JD đang tuyển có ≥1 tiến cử trong 30 ngày qua
 * - 25% Conversion: tỷ lệ tuyển thành công (mục tiêu 25% = 100 điểm)
 * - 20% Progress: tỷ lệ tiến cử vào PV/trúng tuyển (mục tiêu 50% = 100 điểm)
 * - 15% Vitality: % JD còn đang tuyển so với tổng JD
 * - 10% Speed: càng nhanh tuyển / có ứng viên sớm càng cao (mục tiêu ≤14 ngày)
 */
export async function getBusinessRecruitmentHealth(businessId) {
  const ownedJobIds = await getOwnedJobIds(businessId);
  if (!ownedJobIds.length) {
    return {
      score: 0,
      avgDays: 0,
      rating: 'noData',
      breakdown: {
        pipelineScore: 0,
        conversionScore: 0,
        progressScore: 0,
        vitalityScore: 0,
        speedScore: 0,
      },
      stats: {
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        hiredCount: 0,
      },
    };
  }

  const [jobs, applications] = await Promise.all([
    Job.findAll({
      where: { businessId, id: { [Op.in]: ownedJobIds } },
      attributes: ['id', 'status', 'createdAt'],
    }),
    JobApplication.findAll({
      where: { jobId: { [Op.in]: ownedJobIds } },
      attributes: ['id', 'jobId', 'status', 'appliedAt', 'nyushaDate'],
      raw: true,
    }),
  ]);

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => Number(j.status) === 1);

  const appsByJob = new Map();
  applications.forEach((a) => {
    const jid = Number(a.jobId);
    if (!appsByJob.has(jid)) appsByJob.set(jid, []);
    appsByJob.get(jid).push(a);
  });

  const totalApps = applications.length;
  const hiredApps = applications.filter((a) => HIRED_STATUSES.includes(Number(a.status)));
  const progressApps = applications.filter(
    (a) => INTERVIEW_STATUSES.includes(Number(a.status)) || HIRED_STATUSES.includes(Number(a.status)),
  );

  const activeWithRecentApp = activeJobs.filter((job) => {
    const apps = appsByJob.get(Number(job.id)) || [];
    return apps.some((a) => {
      const at = appDate(a);
      return at && new Date(at).getTime() >= thirtyDaysAgo;
    });
  }).length;

  const pipelineScore = activeJobs.length
    ? Math.round((activeWithRecentApp / activeJobs.length) * 100)
    : (totalJobs ? Math.round((appsByJob.size / totalJobs) * 100) : 0);

  const hireRate = totalApps ? hiredApps.length / totalApps : 0;
  const conversionScore = Math.min(100, Math.round(hireRate * 400));

  const progressRate = totalApps ? progressApps.length / totalApps : 0;
  const progressScore = Math.min(100, Math.round(progressRate * 200));

  const vitalityScore = totalJobs
    ? Math.round((activeJobs.length / totalJobs) * 100)
    : 0;

  const hireDurations = hiredApps
    .map((a) => daysBetweenDates(appDate(a), a.nyushaDate || appDate(a)))
    .filter((d) => d != null);

  let avgDays = 0;
  if (hireDurations.length) {
    avgDays = Math.round(hireDurations.reduce((s, d) => s + d, 0) / hireDurations.length);
  } else {
    const firstAppDays = [];
    jobs.forEach((job) => {
      const apps = (appsByJob.get(Number(job.id)) || [])
        .map((a) => appDate(a))
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b));
      if (apps.length && job.createdAt) {
        const d = daysBetweenDates(job.createdAt, apps[0]);
        if (d != null) firstAppDays.push(d);
      }
    });
    if (firstAppDays.length) {
      avgDays = Math.round(firstAppDays.reduce((s, d) => s + d, 0) / firstAppDays.length);
    } else if (activeJobs.length) {
      const ages = activeJobs
        .map((j) => daysBetweenDates(j.createdAt, new Date()) || 0)
        .filter((d) => d > 0);
      if (ages.length) {
        avgDays = Math.round(ages.reduce((s, d) => s + d, 0) / ages.length);
      }
    }
  }

  const speedScore = avgDays <= 0
    ? (totalApps > 0 ? 50 : 0)
    : Math.min(100, Math.max(0, Math.round(100 - ((avgDays - 14) / 31) * 100)));

  let score = Math.min(100, Math.max(0, Math.round(
    pipelineScore * 0.30
    + conversionScore * 0.25
    + progressScore * 0.20
    + vitalityScore * 0.15
    + speedScore * 0.10,
  )));

  if (totalApps === 0 && activeJobs.length > 0) {
    score = Math.min(score, Math.max(15, Math.round(vitalityScore / 2)));
  }

  return {
    score,
    avgDays,
    rating: getHealthRatingKey(score),
    breakdown: {
      pipelineScore,
      conversionScore,
      progressScore,
      vitalityScore,
      speedScore,
    },
    stats: {
      totalJobs,
      activeJobs: activeJobs.length,
      totalApplications: totalApps,
      hiredCount: hiredApps.length,
    },
  };
}

export default {
  getBusinessInsightsReport,
  getBusinessRecruitmentHealth,
};
