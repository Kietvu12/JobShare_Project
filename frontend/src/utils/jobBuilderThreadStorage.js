import apiService from '../services/api';

const LEGACY_STORAGE_KEY = 'wjs_job_builder_threads';
const LEGACY_IMPORT_FLAG_PREFIX = 'wjs_job_builder_threads_legacy_imported_';

export function createJobBuilderThreadId() {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readLegacyLocalThreads() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function importLegacyJobBuilderThreadsFromLocalStorage() {
  const bid = getCurrentBusinessUserId() || 'unknown';
  const flagKey = `${LEGACY_IMPORT_FLAG_PREFIX}${bid}`;
  if (localStorage.getItem(flagKey) === '1') return { imported: 0 };
  const legacy = readLegacyLocalThreads();
  if (!legacy.length) {
    localStorage.setItem(flagKey, '1');
    return { imported: 0 };
  }
  try {
    const res = await apiService.importLegacyBusinessJobBuilderThreads(legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(flagKey, '1');
    return res?.data || { imported: legacy.length };
  } catch (e) {
    console.warn('Legacy JD thread import failed:', e);
    throw e;
  }
}

export async function listJobBuilderThreads() {
  const res = await apiService.listBusinessJobBuilderThreads();
  return res?.data?.threads ?? [];
}

export async function getJobBuilderThread(threadId) {
  if (!threadId) return null;
  try {
    const res = await apiService.getBusinessJobBuilderThread(threadId);
    return res?.data?.thread ?? null;
  } catch {
    return null;
  }
}

export async function getJobBuilderThreadByJobId(jobId) {
  if (!jobId) return null;
  const res = await apiService.listBusinessJobBuilderThreads({ jobId: Number(jobId) });
  const threads = res?.data?.threads ?? [];
  return threads[0] || null;
}

export async function ensureJobBuilderThreadForJob(jobId, { title, formSnapshot } = {}) {
  const numericId = Number(jobId);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;
  const existing = await getJobBuilderThreadByJobId(numericId);
  if (existing) return existing;
  const thread = {
    id: createJobBuilderThreadId(),
    jobId: numericId,
    title: title || `JD #${numericId}`,
    messages: [],
    sessionId: null,
    formSnapshot: formSnapshot || null,
  };
  return upsertJobBuilderThread(thread);
}

export async function upsertJobBuilderThread(thread) {
  if (!thread?.id && !thread?.title) return null;
  const payload = {
    id: thread.id,
    jobId: thread.jobId ?? null,
    title: thread.title || 'JD mới',
    sessionId: thread.sessionId ?? null,
    messages: Array.isArray(thread.messages) ? thread.messages : [],
    formSnapshot: thread.formSnapshot ?? null,
  };
  // Chỉ gửi file khi có dữ liệu — tránh ghi đè null / payload quá lớn lúc auto-save
  if (thread.jdOriginalStored != null) {
    payload.jdOriginalStored = thread.jdOriginalStored;
  }
  const res = await apiService.upsertBusinessJobBuilderThread(payload);
  return res?.data?.thread ?? null;
}

export async function deleteJobBuilderThread(threadId) {
  if (!threadId) return;
  await apiService.deleteBusinessJobBuilderThread(threadId);
}

export async function fileToStoredJd(file) {
  if (!file) return null;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    dataUrl: String(dataUrl),
  };
}

export function storedJdToFile(stored) {
  if (!stored?.dataUrl) return null;
  try {
    const [header, base64] = String(stored.dataUrl).split(',');
    const mime = stored.type || (header.match(/:(.*?);/)?.[1]) || 'application/octet-stream';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], stored.name || 'jd-original.pdf', { type: mime });
  } catch {
    return null;
  }
}

/** @deprecated — dùng API; giữ export để không vỡ import cũ */
export function getCurrentBusinessUserId() {
  try {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    const id = user?.id;
    if (id == null || id === '') return null;
    return String(id);
  } catch {
    return null;
  }
}

/** @deprecated */
export async function migrateLegacyJobBuilderThreads() {
  return importLegacyJobBuilderThreadsFromLocalStorage();
}
