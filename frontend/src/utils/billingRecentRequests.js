/** Gộp yêu cầu dịch vụ vừa tạo vào dashboard (hiển thị ngay trên sidebar). */
export function mergeCreatedServiceRequestIntoDashboard(dashboard, created) {
  if (!created?.requestCode) return dashboard;

  let sub = '—';
  if (created.note) {
    const lines = String(created.note).split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^---.+---$/.test(line)) continue;
      const idx = line.indexOf(':');
      if (idx > 0) {
        sub = line.slice(idx + 1).trim() || sub;
        break;
      }
    }
  }

  const entry = {
    id: created.requestCode,
    title: created.serviceTitle || 'Yêu cầu dịch vụ',
    sub,
    date: new Date().toLocaleDateString('vi-VN'),
    status: 'Đang chờ WS',
    statusBg: '#fee2e2',
    statusColor: '#dc2626',
  };

  const recent = dashboard?.recentRequests || [];
  return {
    ...(dashboard || {}),
    recentRequests: [
      entry,
      ...recent.filter((r) => r.id !== entry.id),
    ].slice(0, 8),
  };
}

/** Handler dùng chung sau khi gửi yêu cầu dịch vụ. */
export function createServiceRequestSubmittedHandler(setDashboard, loadDashboard) {
  return async (created) => {
    if (created?.requestCode) {
      setDashboard((prev) => mergeCreatedServiceRequestIntoDashboard(prev, created));
    }
    await loadDashboard();
    if (created?.requestCode) {
      setDashboard((prev) => {
        const has = prev?.recentRequests?.some((r) => r.id === created.requestCode);
        if (has) return prev;
        return mergeCreatedServiceRequestIntoDashboard(prev, created);
      });
    }
  };
}
