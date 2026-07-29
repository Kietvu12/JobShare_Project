const STORAGE_KEY = 'wjs_job_builder_threads';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(threads) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    /* quota */
  }
}

export function createJobBuilderThreadId() {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listJobBuilderThreads() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getJobBuilderThread(threadId) {
  if (!threadId) return null;
  return readAll().find((t) => t.id === threadId) || null;
}

export function getJobBuilderThreadByJobId(jobId) {
  if (!jobId) return null;
  return readAll().find((t) => Number(t.jobId) === Number(jobId)) || null;
}

export function upsertJobBuilderThread(thread) {
  if (!thread?.id) return null;
  const all = readAll();
  const idx = all.findIndex((t) => t.id === thread.id);
  const next = {
    ...thread,
    updatedAt: Date.now(),
    createdAt: thread.createdAt || Date.now(),
  };
  if (idx >= 0) all[idx] = { ...all[idx], ...next };
  else all.unshift(next);
  writeAll(all);
  return next;
}

export function deleteJobBuilderThread(threadId) {
  writeAll(readAll().filter((t) => t.id !== threadId));
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
