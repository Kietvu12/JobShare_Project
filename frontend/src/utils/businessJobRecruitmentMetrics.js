import { parseStatusMessageContent } from './statusChangeMessage';

/** senderType trong NominationChat — doanh nghiệp */
export const SENDER_TYPE_BUSINESS = 5;
/** Tin nhắn hệ thống (đổi trạng thái) */
export const SENDER_TYPE_SYSTEM = 3;

/** Trạng thái ban đầu — chưa có phản hồi từ doanh nghiệp */
export const UNRESPONDED_NOMINATION_STATUSES = [2, 3, 5];

/** Trạng thái tích cực (phỏng vấn, trúng tuyển, thành công) */
export const POSITIVE_NOMINATION_STATUSES = [7, 8, 9, 11, 12, 14, 15];

const DEFAULT_PERIOD_DAYS = 7;

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(start, end) {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b) return null;
  return Math.max(0, (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function isInPeriod(dateValue, periodDays, now = new Date()) {
  const d = toDate(dateValue);
  if (!d) return false;
  const diffDays = daysBetween(d, now);
  return diffDays != null && diffDays <= periodDays;
}

function isPositiveStatusCode(code) {
  const n = Number(code);
  return POSITIVE_NOMINATION_STATUSES.includes(n);
}

function isRespondedByStatus(status) {
  const n = Number(status);
  if (!Number.isFinite(n)) return false;
  return !UNRESPONDED_NOMINATION_STATUSES.includes(n);
}

export function analyzeNominationChat(messages = []) {
  const list = Array.isArray(messages) ? messages : [];
  let hasBusinessMessage = false;
  let firstBusinessMessageAt = null;
  const statusChanges = [];

  list.forEach((msg) => {
    const senderType = Number(msg?.senderType ?? msg?.sender_type);
    const createdAt = msg?.createdAt || msg?.created_at;

    if (senderType === SENDER_TYPE_BUSINESS) {
      hasBusinessMessage = true;
      if (!firstBusinessMessageAt && createdAt) firstBusinessMessageAt = createdAt;
    }

    if (senderType === SENDER_TYPE_SYSTEM) {
      const parsed = parseStatusMessageContent(msg?.content);
      if (parsed.isStatusChange) {
        statusChanges.push({
          statusCode: parsed.statusCode,
          statusName: parsed.statusName,
          createdAt,
          isPositive: isPositiveStatusCode(parsed.statusCode),
        });
      }
    }
  });

  const hasPositiveStatusChange = statusChanges.some((s) => s.isPositive);
  const firstStatusChangeAt = statusChanges.find((s) => s.createdAt)?.createdAt || null;
  const firstResponseAt = [firstBusinessMessageAt, firstStatusChangeAt]
    .filter(Boolean)
    .map((v) => toDate(v))
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  return {
    hasBusinessMessage,
    hasStatusChange: statusChanges.length > 0,
    hasPositiveStatusChange,
    statusChanges,
    firstResponseAt: firstResponseAt ? firstResponseAt.toISOString() : null,
    isResponded: hasBusinessMessage || statusChanges.length > 0,
    isPositive: hasPositiveStatusChange || false,
  };
}

export function computeRecruitmentMetrics({
  nominations = [],
  messagesByNominationId = {},
  job = null,
  periodDays = DEFAULT_PERIOD_DAYS,
}) {
  const now = new Date();
  const period = Math.max(1, Number(periodDays) || DEFAULT_PERIOD_DAYS);
  const all = Array.isArray(nominations) ? nominations : [];
  const inPeriod = all.filter((n) => isInPeriod(n.appliedAt || n.createdAt, period, now));

  const jobCreatedAt = job?.createdAt || job?.created_at || null;
  const sortedByApplied = [...all]
    .map((n) => ({ ...n, appliedDate: toDate(n.appliedAt || n.createdAt) }))
    .filter((n) => n.appliedDate)
    .sort((a, b) => a.appliedDate - b.appliedDate);

  const firstNomination = sortedByApplied[0] || null;
  const timeToFirstApplicationDays = jobCreatedAt && firstNomination?.appliedDate
    ? Math.round(daysBetween(jobCreatedAt, firstNomination.appliedDate) * 10) / 10
    : null;

  const responseTimes = [];
  let respondedCount = 0;
  let positiveCount = 0;

  all.forEach((nomination) => {
    const chat = analyzeNominationChat(messagesByNominationId[String(nomination.id)] || []);
    const statusNum = Number(nomination.status);
    const responded = chat.isResponded || isRespondedByStatus(statusNum);
    const positive = chat.isPositive
      || chat.hasPositiveStatusChange
      || isPositiveStatusCode(statusNum);

    if (responded) {
      respondedCount += 1;
      const appliedAt = nomination.appliedAt || nomination.createdAt;
      if (chat.firstResponseAt && appliedAt) {
        const rt = daysBetween(appliedAt, chat.firstResponseAt);
        if (rt != null) responseTimes.push(rt);
      }
    }
    if (positive) positiveCount += 1;
  });

  const totalNominations = all.length;
  const applicationsInPeriod = inPeriod.length;
  const avgApplicationsPerDay = Math.round((applicationsInPeriod / period) * 10) / 10;
  const avgResponseTimeDays = responseTimes.length
    ? Math.round((responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length) * 10) / 10
    : null;

  const responseRate = totalNominations > 0
    ? Math.round((respondedCount / totalNominations) * 100)
    : 0;
  const positiveChangeRate = respondedCount > 0
    ? Math.round((positiveCount / respondedCount) * 100)
    : 0;
  const forwardRate = totalNominations > 0
    ? Math.round((positiveCount / totalNominations) * 100)
    : 0;

  const speedScore = Math.min(100, Math.round(
    (timeToFirstApplicationDays == null ? 40 : Math.max(0, 100 - timeToFirstApplicationDays * 8)) * 0.35
    + Math.min(100, applicationsInPeriod * 12) * 0.35
    + (avgResponseTimeDays == null ? 35 : Math.max(0, 100 - avgResponseTimeDays * 12)) * 0.3,
  ));

  const performanceScore = Math.min(100, Math.round(
    responseRate * 0.55 + positiveChangeRate * 0.45,
  ));

  return {
    periodDays: period,
    totalNominations,
    applicationsInPeriod,
    avgApplicationsPerDay,
    timeToFirstApplicationDays,
    avgResponseTimeDays,
    responseRate,
    positiveChangeRate,
    forwardRate,
    speedScore,
    performanceScore,
    speedRating: getRecruitmentRating(speedScore),
    performanceRating: getRecruitmentRating(performanceScore),
    speedLines: [
      `${applicationsInPeriod} đơn tiến cử (${period} ngày qua)`,
      timeToFirstApplicationDays != null
        ? `Thời gian có ứng viên đầu tiên: ${timeToFirstApplicationDays} ngày`
        : 'Thời gian có ứng viên đầu tiên: —',
      avgResponseTimeDays != null
        ? `Thời gian phản hồi TB: ${avgResponseTimeDays} ngày`
        : 'Thời gian phản hồi TB: —',
    ],
    performanceLines: [
      `Tỷ lệ phản hồi: ${responseRate}%`,
      `Tỷ lệ chuyển tiếp tích cực: ${forwardRate}%`,
    ],
  };
}

export function getRecruitmentRating(score) {
  const n = Number(score) || 0;
  if (n >= 80) return 'Tốt';
  if (n >= 65) return 'Khá';
  if (n >= 50) return 'Trung bình';
  if (n > 0) return 'Cần cải thiện';
  return '—';
}

export async function fetchAllNominationsForJob(apiService, jobId) {
  const nominations = [];
  let page = 1;
  const limit = 50;
  let totalPages = 1;

  do {
    const res = await apiService.getBusinessCandidateSharingNominations({
      page,
      limit,
      jobId,
    });
    if (!res?.success) break;
    nominations.push(...(res.data?.nominations || []));
    totalPages = res.data?.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return nominations;
}

async function fetchMessagesInBatches(apiService, nominationIds, batchSize = 5) {
  const map = {};
  const ids = (nominationIds || []).map((id) => Number(id)).filter((id) => !Number.isNaN(id));
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    const results = await Promise.all(
      chunk.map(async (id) => {
        try {
          const res = await apiService.getBusinessMessagesByJobApplication(id);
          return [String(id), res?.data?.messages || res?.data || []];
        } catch {
          return [String(id), []];
        }
      }),
    );
    results.forEach(([id, messages]) => {
      map[id] = Array.isArray(messages) ? messages : [];
    });
  }
  return map;
}

export async function fetchJobRecruitmentMetrics(apiService, jobId, job, periodDays = DEFAULT_PERIOD_DAYS) {
  const nominations = await fetchAllNominationsForJob(apiService, jobId);
  const nominationIds = nominations.map((n) => n.id);
  const messagesByNominationId = nominationIds.length
    ? await fetchMessagesInBatches(apiService, nominationIds)
    : {};

  return computeRecruitmentMetrics({
    nominations,
    messagesByNominationId,
    job,
    periodDays,
  });
}
