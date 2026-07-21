import React from 'react';

function JobLine({ content }) {
  const snap = content?.jobSnapshot;
  if (!snap?.title) return null;
  return (
    <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.75rem' }}>
      Vị trí: {snap.title}{snap.jobCode ? ` · ${snap.jobCode}` : ''}
    </p>
  );
}

const EMPTY_FORM = { name: '', email: '', phone: '', message: '' };

export function ApplyFormSection({
  content,
  form,
  setForm,
  onSubmit,
  submitting,
  submitted,
  readOnly = false,
}) {
  const formMeta = content?.form || {};
  const values = form || EMPTY_FORM;
  const updateField = setForm || (() => {});
  const handleSubmit = onSubmit || ((e) => e.preventDefault());

  if (submitted) {
    return (
      <div className="lp-apply-success" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Đã gửi hồ sơ thành công!</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Chúng tôi sẽ liên hệ với bạn sớm nhất.</p>
      </div>
    );
  }

  return (
    <form className="lp-apply-form" onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto' }}>
      <h3 style={{ marginBottom: '0.75rem' }}>{formMeta.title || 'Đăng ký ứng tuyển'}</h3>
      <JobLine content={content} />
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>Họ và tên *</label>
        <input
          required={!readOnly}
          readOnly={readOnly}
          value={values.name || ''}
          onChange={(e) => updateField((f) => ({ ...(f || EMPTY_FORM), name: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4 }}
        />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>Email *</label>
        <input
          type="email"
          required={!readOnly}
          readOnly={readOnly}
          value={values.email || ''}
          onChange={(e) => updateField((f) => ({ ...(f || EMPTY_FORM), email: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4 }}
        />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>Số điện thoại</label>
        <input
          readOnly={readOnly}
          value={values.phone || ''}
          onChange={(e) => updateField((f) => ({ ...(f || EMPTY_FORM), phone: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4 }}
        />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>Lời nhắn</label>
        <textarea
          rows={4}
          readOnly={readOnly}
          value={values.message || ''}
          onChange={(e) => updateField((f) => ({ ...(f || EMPTY_FORM), message: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4, resize: 'vertical' }}
        />
      </div>
      <button
        type="submit"
        disabled={submitting || readOnly}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: 'none',
          borderRadius: 6,
          fontWeight: 700,
          cursor: submitting ? 'wait' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? 'Đang gửi...' : (formMeta.submitText || 'Gửi hồ sơ')}
      </button>
    </form>
  );
}
