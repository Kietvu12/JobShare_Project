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

export function ApplyFormSection({
  content,
  form,
  setForm,
  onSubmit,
  submitting,
  submitted,
}) {
  const formMeta = content?.form || {};

  if (submitted) {
    return (
      <div className="lp-apply-success" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Đã gửi hồ sơ thành công!</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Chúng tôi sẽ liên hệ với bạn sớm nhất.</p>
      </div>
    );
  }

  return (
    <form className="lp-apply-form" onSubmit={onSubmit} style={{ maxWidth: 480, margin: '0 auto' }}>
      <h3 style={{ marginBottom: '0.75rem' }}>{formMeta.title || 'Đăng ký ứng tuyển'}</h3>
      <JobLine content={content} />
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>Họ và tên *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4 }}
        />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>Email *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4 }}
        />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>Số điện thoại</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4 }}
        />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>Lời nhắn</label>
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4, resize: 'vertical' }}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
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
