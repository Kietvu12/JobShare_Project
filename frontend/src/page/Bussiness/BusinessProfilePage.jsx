import React, { useMemo, useState } from 'react';
import { Building2, ExternalLink, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import useBusinessUser from '../../hooks/useBusinessUser';
import apiService from '../../services/api';
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout';

const CARD = 'rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4';

const I18N = {
  vi: {
    title: 'Thông tin doanh nghiệp',
    subtitle: 'Thông tin công ty và người liên hệ trên tài khoản JobShare Business.',
    companySection: 'Doanh nghiệp',
    contactSection: 'Người liên hệ',
    loginSection: 'Đăng nhập & bảo mật',
    editHint: 'Để cập nhật thông tin công ty hoặc liên hệ, vui lòng liên hệ Work Station qua Tin nhắn hoặc yêu cầu dịch vụ.',
    companyName: 'Tên doanh nghiệp',
    taxCode: 'Mã số thuế',
    companySize: 'Quy mô',
    website: 'Website',
    address: 'Địa chỉ',
    city: 'Thành phố',
    country: 'Quốc gia',
    businessLicense: 'Giấy phép kinh doanh',
    viewFile: 'Xem file',
    contactName: 'Họ và tên',
    contactTitle: 'Chức vụ',
    contactEmail: 'Email liên hệ',
    contactPhone: 'Số điện thoại',
    loginEmail: 'Email đăng nhập',
    currentPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Nhập lại mật khẩu mới',
    changePassword: 'Đổi mật khẩu',
    saving: 'Đang lưu...',
    passwordSuccess: 'Đã đổi mật khẩu.',
    passwordError: 'Không thể đổi mật khẩu. Kiểm tra mật khẩu hiện tại.',
    passwordMismatch: 'Mật khẩu mới không khớp.',
    passwordMin: 'Mật khẩu mới phải có ít nhất 8 ký tự.',
    loading: 'Đang tải...',
  },
  en: {
    title: 'Business account',
    subtitle: 'Company and primary contact details for your JobShare Business account.',
    companySection: 'Company',
    contactSection: 'Primary contact',
    loginSection: 'Sign-in & security',
    editHint: 'To update company or contact details, please contact Work Station via Messages or a service request.',
    companyName: 'Company name',
    taxCode: 'Tax ID',
    companySize: 'Company size',
    website: 'Website',
    address: 'Address',
    city: 'City',
    country: 'Country',
    businessLicense: 'Business license',
    viewFile: 'View file',
    contactName: 'Full name',
    contactTitle: 'Job title',
    contactEmail: 'Contact email',
    contactPhone: 'Phone',
    loginEmail: 'Login email',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    changePassword: 'Change password',
    saving: 'Saving...',
    passwordSuccess: 'Password updated.',
    passwordError: 'Could not change password. Check your current password.',
    passwordMismatch: 'New passwords do not match.',
    passwordMin: 'New password must be at least 8 characters.',
    loading: 'Loading...',
  },
  ja: {
    title: '企業アカウント情報',
    subtitle: 'JobShare Business アカウントの企業・担当者情報です。',
    companySection: '企業情報',
    contactSection: '担当者',
    loginSection: 'ログインとセキュリティ',
    editHint: '企業情報や担当者情報の変更は、メッセージまたはサービス依頼から Work Station までご連絡ください。',
    companyName: '企業名',
    taxCode: '税番号',
    companySize: '規模',
    website: 'Webサイト',
    address: '住所',
    city: '市区町村',
    country: '国',
    businessLicense: '事業許可証',
    viewFile: 'ファイルを見る',
    contactName: '氏名',
    contactTitle: '役職',
    contactEmail: '連絡先メール',
    contactPhone: '電話番号',
    loginEmail: 'ログインメール',
    currentPassword: '現在のパスワード',
    newPassword: '新しいパスワード',
    confirmPassword: '新しいパスワード（確認）',
    changePassword: 'パスワードを変更',
    saving: '保存中...',
    passwordSuccess: 'パスワードを更新しました。',
    passwordError: 'パスワードを変更できませんでした。現在のパスワードを確認してください。',
    passwordMismatch: '新しいパスワードが一致しません。',
    passwordMin: '新しいパスワードは8文字以上必要です。',
    loading: '読み込み中...',
  },
};

function pickLocalized(user, base, language) {
  if (!user) return '';
  const vi = user[base];
  if (language === 'en') return user[`${base}En`] || vi || '';
  if (language === 'ja') return user[`${base}Jp`] || vi || '';
  return vi || '';
}

function InfoRow({ label, value, children }) {
  if (!value && !children) return null;
  return (
    <div className="border-b border-slate-100 py-2 last:border-0 last:pb-0">
      <dt className="text-[10px] font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-[11px] font-semibold text-slate-900 [overflow-wrap:anywhere]">
        {children || value}
      </dd>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className={CARD}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[#0077B6]" strokeWidth={2.25} />
        <h2 className="text-xs font-bold text-slate-900">{title}</h2>
      </div>
      <dl>{children}</dl>
    </section>
  );
}

export default function BusinessProfilePage() {
  const { language } = useLanguage();
  const t = I18N[language] || I18N.vi;
  const { user, contactName, contactTitle, companyName, email } = useBusinessUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const companyFields = useMemo(() => {
    const u = user || {};
    return {
      companyName: pickLocalized(u, 'companyName', language) || u.companyName || '',
      companySize: pickLocalized(u, 'companySize', language) || u.companySize || '',
      address: pickLocalized(u, 'address', language) || u.address || '',
      city: pickLocalized(u, 'city', language) || u.city || '',
      country: pickLocalized(u, 'country', language) || u.country || '',
      taxCode: u.taxCode || '',
      website: u.website || '',
      licenseUrl: u.businessLicenseUrl || '',
    };
  }, [user, language]);

  const contactFields = useMemo(() => ({
    contactName: contactName || pickLocalized(user, 'contactName', language),
    contactTitle: contactTitle || pickLocalized(user, 'contactTitle', language),
    contactEmail: user?.contactEmail || '',
    contactPhone: user?.contactPhone || '',
    loginEmail: email || user?.email || '',
  }), [user, language, contactName, contactTitle, email]);

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');
    if (newPassword.length < 8) {
      setPwError(t.passwordMin);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t.passwordMismatch);
      return;
    }
    setPwLoading(true);
    try {
      const res = await apiService.changePasswordBusiness(currentPassword, newPassword);
      if (!res?.success) throw new Error(res?.message || t.passwordError);
      setPwMessage(t.passwordSuccess);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err?.message || t.passwordError);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <BusinessQuickActionsPageLayout>
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-col gap-3 pb-4">
        <header>
          <h1 className="text-sm font-bold text-[#0077B6] sm:text-base">{t.title}</h1>
          <p className="mt-1 text-[10px] leading-snug text-slate-500 sm:text-[11px]">{t.subtitle}</p>
        </header>

        {!user ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.loading}
          </div>
        ) : (
          <>
            <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-[10px] leading-snug text-amber-900 sm:text-[11px]">
              {t.editHint}
            </p>

            <Section icon={Building2} title={t.companySection}>
              <InfoRow label={t.companyName} value={companyFields.companyName || companyName} />
              <InfoRow label={t.taxCode} value={companyFields.taxCode} />
              <InfoRow label={t.companySize} value={companyFields.companySize} />
              <InfoRow label={t.website} value={companyFields.website} />
              <InfoRow label={t.address} value={companyFields.address} />
              <InfoRow label={t.city} value={companyFields.city} />
              <InfoRow label={t.country} value={companyFields.country} />
              {companyFields.licenseUrl ? (
                <InfoRow label={t.businessLicense}>
                  <a
                    href={companyFields.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#0077B6] hover:underline"
                  >
                    {t.viewFile}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </InfoRow>
              ) : null}
            </Section>

            <Section icon={User} title={t.contactSection}>
              <InfoRow label={t.contactName} value={contactFields.contactName} />
              <InfoRow label={t.contactTitle} value={contactFields.contactTitle} />
              <InfoRow label={t.contactEmail} value={contactFields.contactEmail} />
              <InfoRow label={t.contactPhone} value={contactFields.contactPhone} />
              <InfoRow label={t.loginEmail} value={contactFields.loginEmail} />
            </Section>

            <section className={CARD}>
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-[#0077B6]" strokeWidth={2.25} />
                <h2 className="text-xs font-bold text-slate-900">{t.loginSection}</h2>
              </div>
              <form onSubmit={onChangePassword} className="space-y-2.5">
                <label className="block">
                  <span className="text-[10px] font-medium text-slate-500">{t.currentPassword}</span>
                  <div className="relative mt-0.5">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 pr-9 text-[11px] text-slate-800 outline-none focus:border-[#0077B6]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </label>
                <label className="block">
                  <span className="text-[10px] font-medium text-slate-500">{t.newPassword}</span>
                  <div className="relative mt-0.5">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 pr-9 text-[11px] text-slate-800 outline-none focus:border-[#0077B6]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </label>
                <label className="block">
                  <span className="text-[10px] font-medium text-slate-500">{t.confirmPassword}</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="mt-0.5 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-800 outline-none focus:border-[#0077B6]/40"
                  />
                </label>
                {pwError ? <p className="text-[10px] text-red-600">{pwError}</p> : null}
                {pwMessage ? <p className="text-[10px] text-emerald-600">{pwMessage}</p> : null}
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0077B6] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#006399] disabled:opacity-50"
                >
                  {pwLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {pwLoading ? t.saving : t.changePassword}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </BusinessQuickActionsPageLayout>
  );
}
