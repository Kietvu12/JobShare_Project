/** Parse note từ BrandingServiceIntakeModal / service request thành các dòng có nhãn. */
export function parseServiceRequestNote(note) {
  if (!note) return { sectionTitle: null, fields: [], freeText: null };

  const raw = String(note).trim();
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  let sectionTitle = null;
  const fields = [];
  const freeLines = [];

  for (const line of lines) {
    if (/^---.+---$/.test(line)) {
      sectionTitle = line.replace(/^---\s*|\s*---$/g, '').trim();
      continue;
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const label = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (value.includes('\n') || value.length > 120) {
        fields.push({ label, value, multiline: true });
      } else {
        fields.push({ label, value, multiline: false });
      }
    } else {
      freeLines.push(line);
    }
  }

  return {
    sectionTitle,
    fields,
    freeText: freeLines.length ? freeLines.join('\n') : null,
  };
}

/** Map key intake modal (Branding) → key billing / API */
export function getBillingServiceKeyFromIntake(intakeServiceKey) {
  const key = String(intakeServiceKey || '').trim();
  if (key === 'recruitment_event') return 'seminar_campaign';
  if (key === 'recruitment_ads' || key === 'company_profile' || key === 'landing_page_premium') return key;
  return null;
}
