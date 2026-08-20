import React, { useMemo, useState } from 'react';
import { Copy, Check, Link2 } from 'lucide-react';
import {
  UTM_PLATFORMS,
  buildUtmUrlForPlatform,
} from '../../utils/utmTracking';

const BASE_PATH_OPTIONS = [
  { value: '/register', label: 'Đăng ký CTV (/register)' },
  { value: '/', label: 'Trang chủ (/)' },
  { value: '/login', label: 'Đăng nhập (/login)' },
  { value: '/landing/collaborator', label: 'Landing CTV (/landing/collaborator)' },
  { value: '/landing/candidate', label: 'Landing ứng viên (/landing/candidate)' },
];

export default function UtmLinkBuilderPage() {
  const [basePath, setBasePath] = useState('/register');
  const [customBase, setCustomBase] = useState('');
  const [campaign, setCampaign] = useState('ctv_registration');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const effectiveBase = (customBase.trim() || basePath).trim();

  const generatedLinks = useMemo(() => {
    const extra = { utmCampaign: campaign.trim() || 'ctv_registration', utmContent: content.trim() || undefined, utmTerm: term.trim() || undefined };
    return UTM_PLATFORMS.map((platform) => ({
      platform,
      url: buildUtmUrlForPlatform(effectiveBase, platform.key, extra),
    }));
  }, [effectiveBase, campaign, content, term]);

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Link2 className="h-7 w-7 text-red-600" />
          Tạo link UTM theo nền tảng
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-3xl">
          <strong>Tự động:</strong> User bấm link JobShare từ Facebook, TikTok, LinkedIn… (không cần ?utm_) —
          hệ thống đọc <code className="text-xs bg-gray-100 px-1 rounded">Referer</code>, lưu session và gắn UTM lên mọi route trong phiên đó.
          Trang này chỉ dùng khi bạn muốn <strong>ép campaign/content</strong> cụ thể (utm_campaign, utm_content) cho link marketing.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">URL đích</label>
            <select
              value={basePath}
              onChange={(e) => setBasePath(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {BASE_PATH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hoặc URL / path tùy chỉnh</label>
            <input
              type="text"
              value={customBase}
              onChange={(e) => setCustomBase(e.target.value)}
              placeholder="https://jobshare.com/register hoặc /register"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">utm_campaign</label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">utm_content (tuỳ chọn)</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="banner_q1, post_123..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">utm_term (tuỳ chọn)</label>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="keyword..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          URL gốc đang dùng: <span className="font-mono text-gray-800">{effectiveBase}</span>
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
          Link theo nền tảng ({generatedLinks.length})
        </div>
        <div className="divide-y divide-gray-100">
          {generatedLinks.map(({ platform, url }) => (
            <div key={platform.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">{platform.label}</div>
                <div className="mt-0.5 break-all font-mono text-xs text-gray-600">{url}</div>
                <div className="mt-1 text-[11px] text-gray-400">
                  utm_source={platform.utmSource} · utm_medium={platform.utmMedium}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyText(url, platform.key)}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {copiedKey === platform.key ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey === platform.key ? 'Đã copy' : 'Copy link'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
