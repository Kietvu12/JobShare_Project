import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Save, Send } from 'lucide-react';
import apiService from '../../services/api';

const STATUS_COLORS = {
  0: { label: 'Nháp', color: '#64748b', bg: '#f1f5f9' },
  1: { label: 'Đang hoạt động', color: '#10b981', bg: '#d1fae5' },
  2: { label: 'Tạm dừng', color: '#f59e0b', bg: '#fef3c7' },
  3: { label: 'Đã đóng', color: '#dc2626', bg: '#fee2e2' },
};

function BusinessLandingPageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [page, setPage] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getBusinessLandingPageById(pageId);
      if (res?.success && res.data?.landingPage) {
        const lp = res.data.landingPage;
        setPage(lp);
        setTitle(lp.title || '');
        setContent(lp.content || {});
        setMetaTitle(lp.metaTitle || '');
        setMetaDescription(lp.metaDescription || '');
        setMetaKeywords(lp.metaKeywords || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const updateHero = (field, value) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...(prev?.hero || {}), [field]: value },
    }));
  };

  const updateSection = (editKey, field, value) => {
    setContent((prev) => {
      if (Array.isArray(prev?.sections)) {
        const sections = [...prev.sections];
        sections[editKey] = { ...sections[editKey], [field]: value };
        return { ...prev, sections };
      }
      if (prev?.sections && typeof prev.sections === 'object') {
        const arr = [...(prev.sections[editKey] || [])];
        arr[0] = { ...(arr[0] || {}), [field]: value };
        return { ...prev, sections: { ...prev.sections, [editKey]: arr } };
      }
      return prev;
    });
  };

  const editableSections = useMemo(() => {
    const sections = content?.sections;
    if (Array.isArray(sections)) {
      return sections.map((section, idx) => ({
        editKey: idx,
        title: section.title || `Section ${idx + 1}`,
        body: section.body || '',
      }));
    }
    if (sections && typeof sections === 'object') {
      const list = [];
      [
        ['kodawari', 'Giới thiệu công việc'],
        ['service', 'Quyền lợi & điểm nổi bật'],
      ].forEach(([key, fallbackTitle]) => {
        const item = sections[key]?.[0];
        if (item) {
          list.push({
            editKey: key,
            title: item.title || fallbackTitle,
            body: item.body || '',
          });
        }
      });
      return list;
    }
    return [];
  }, [content?.sections]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiService.updateBusinessLandingPage(pageId, {
        title,
        content,
        metaTitle,
        metaDescription,
        metaKeywords,
        regenerateSeo: false,
      });
      if (res?.success) {
        setPage(res.data.landingPage);
        alert('Đã lưu');
      } else {
        alert(res?.message || 'Lưu thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Phát hành landing page? Link public sẽ có thể truy cập và dùng cho quảng cáo.')) return;
    setPublishing(true);
    try {
      await apiService.updateBusinessLandingPage(pageId, { title, content, metaTitle, metaDescription, metaKeywords });
      const res = await apiService.publishBusinessLandingPage(pageId);
      if (res?.success) {
        setPage(res.data.landingPage);
        alert('Đã phát hành! Sao chép link public để chạy quảng cáo.');
      } else {
        alert(res?.message || 'Publish thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Publish thất bại');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Đang tải...
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-6 text-center text-slate-500">
        Không tìm thấy landing page.
        <Link to="/business/saiyo" className="block mt-2 text-blue-600 text-sm">Quay lại Saiyo</Link>
      </div>
    );
  }

  const st = STATUS_COLORS[page.status] || STATUS_COLORS[0];
  const publicUrl = `${window.location.origin}${page.publicPath || `/lp/${page.slug}`}`;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/business/saiyo" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-bold text-slate-800 flex-1">Chỉnh sửa landing page</h1>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>
          {st.label}
        </span>
      </div>

      {page.status === 1 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between gap-2">
          <span className="text-xs text-blue-800 truncate">{publicUrl}</span>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(publicUrl)}
              className="text-xs px-2 py-1 bg-white border rounded"
            >
              Copy link
            </button>
            <a href={page.publicPath} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 bg-white border rounded flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Xem
            </a>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600">Tên landing page</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Tiêu đề hero</label>
          <input
            value={content?.hero?.headline || ''}
            onChange={(e) => updateHero('headline', e.target.value)}
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Mô tả hero</label>
          <textarea
            rows={2}
            value={content?.hero?.subheadline || ''}
            onChange={(e) => updateHero('subheadline', e.target.value)}
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {(editableSections).map((section) => (
          <div key={section.editKey} className="border-t pt-4">
            <label className="text-xs font-semibold text-slate-600">{section.title}</label>
            <textarea
              rows={4}
              value={section.body}
              onChange={(e) => updateSection(section.editKey, 'body', e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-800">SEO (quảng cáo / Google / Facebook)</h2>
        <div>
          <label className="text-xs font-semibold text-slate-600">Meta title</label>
          <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Meta description</label>
          <textarea rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Meta keywords</label>
          <input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu nháp'}
        </button>
        <button
          type="button"
          disabled={publishing}
          onClick={handlePublish}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {publishing ? 'Đang publish...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}

export default BusinessLandingPageEditor;
