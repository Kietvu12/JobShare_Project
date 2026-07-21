import React, { useState } from 'react';
import { Loader2, X, FileText } from 'lucide-react';
import { LANDING_PAGE_TEMPLATES } from '../../constants/landingPageTemplates';
import { getRegisteredLandingPageTemplates, getTemplatePages, isHtmlTemplate } from '../../constants/templatePageRegistry';
import { buildCompanyContentFromTemplate } from '../../utils/companyLandingPageSchema';
import apiService from '../../services/api';
import { wjsDebug } from '../../utils/wjsBuilderDebug';

export default function TemplateSlidePanel({ open, onClose, onCreated }) {
  const [creatingKey, setCreatingKey] = useState(null);
  const availableTemplates = getRegisteredLandingPageTemplates(LANDING_PAGE_TEMPLATES);

  const handlePick = async (templateKey) => {
    if (creatingKey) return;
    setCreatingKey(templateKey);
    wjsDebug('template', 'create landing page', { templateKey });
    try {
      let companyName = '';
      try {
        const profile = await apiService.getBusinessProfile();
        companyName = profile?.data?.business?.companyName
          || profile?.data?.companyName
          || '';
      } catch {
        // optional
      }

      const content = buildCompanyContentFromTemplate(templateKey, { companyName });
      wjsDebug('template', 'built content', {
        templateKey,
        contentKey: content.templateKey,
        folder: content.theme?.folder,
        sections: content.pages?.[0]?.sections?.length,
      });

      if (content.templateKey !== templateKey) {
        window.alert(`Lỗi nội bộ: templateKey không khớp (${templateKey} → ${content.templateKey})`);
        return;
      }

      const res = await apiService.createBusinessLandingPage({ templateKey, content });
      if (res?.success && res.data?.landingPage) {
        const lp = res.data.landingPage;
        if (lp.templateKey !== templateKey) {
          window.alert(
            `Server lưu template "${lp.templateKey}" thay vì "${templateKey}". `
            + 'Hãy restart backend (pnpm dev) rồi thử lại.',
          );
          return;
        }
        const url = `${window.location.origin}/business/saiyo/pages/${lp.id}/build`;
        window.open(url, '_blank', 'noopener,noreferrer');
        onCreated?.(lp);
        onClose();
      } else {
        alert(res?.message || 'Tạo thất bại');
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || res?.message || 'Tạo thất bại');
    } finally {
      setCreatingKey(null);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[min(100vw,420px)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Chọn template</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Trang giới thiệu doanh nghiệp — mở trình chỉnh sửa tab mới</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {availableTemplates.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-8">
              Chưa có template nào được đăng ký.
            </div>
          ) : availableTemplates.map((t) => {
            const busy = creatingKey === t.key;
            return (
              <button
                key={t.key}
                type="button"
                disabled={!!creatingKey}
                onClick={() => handlePick(t.key)}
                className="w-full text-left border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-60"
              >
                <div
                  className="h-24 relative overflow-hidden"
                  style={{ background: `${t.previewColor}18` }}
                >
                  <img
                    src={t.previewImage || `/template/${t.folder}/images/mainimg1.jpg`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  {busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs font-bold text-slate-800">{t.name}</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">{t.key}</div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{t.description}</div>
                  {isHtmlTemplate(t.key) && (
                    <div className="flex items-center gap-1 mt-2 text-[9px] text-emerald-700 font-semibold">
                      <FileText className="w-3 h-3" />
                      {getTemplatePages(t.key).length} trang HTML gốc
                    </div>
                  )}
                  <div className="text-[9px] text-blue-600 font-semibold mt-2">Chọn template →</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
