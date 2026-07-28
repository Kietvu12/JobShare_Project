import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, User, KeyRound, ClipboardCheck,
  ChevronLeft, ChevronRight, Check, Eye, EyeOff, Upload, X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import apiService from '../../services/api';
import { JobCategoryDualPickerField, formatJobCategorySelection } from '../../component/Shared/JobCategoryDualPickerModal';

const STEPS = [
  { key: 1, label: 'Thông tin doanh nghiệp', icon: Building2 },
  { key: 2, label: 'Người liên hệ', icon: User },
  { key: 3, label: 'Tài khoản', icon: KeyRound },
  { key: 4, label: 'Xác nhận', icon: ClipboardCheck },
];

const COMPANY_SIZES = [
  { vi: '1–10 nhân sự', en: '1–10 employees', jp: '1–10名' },
  { vi: '11–50 nhân sự', en: '11–50 employees', jp: '11–50名' },
  { vi: '51–200 nhân sự', en: '51–200 employees', jp: '51–200名' },
  { vi: '201–500 nhân sự', en: '201–500 employees', jp: '201–500名' },
  { vi: '500+ nhân sự', en: '500+ employees', jp: '500名以上' },
];

const EMPTY_FORM = {
  companyName: '',
  companyNameEn: '',
  companyNameJp: '',
  taxCode: '',
  jobCategoryIds: [],
  companySize: '',
  companySizeEn: '',
  companySizeJp: '',
  website: '',
  address: '',
  addressEn: '',
  addressJp: '',
  city: '',
  cityEn: '',
  cityJp: '',
  country: 'Việt Nam',
  countryEn: 'Vietnam',
  countryJp: 'ベトナム',
  contactName: '',
  contactNameEn: '',
  contactNameJp: '',
  contactTitle: '',
  contactTitleEn: '',
  contactTitleJp: '',
  contactEmail: '',
  contactPhone: '',
  loginEmail: '',
  password: '',
  passwordConfirm: '',
  acceptTerms: false,
};

const LANG_TABS = [
  { key: 'vi', label: 'Tiếng Việt', required: true },
  { key: 'en', label: 'English', required: false },
  { key: 'jp', label: '日本語', required: false },
];

const LANGUAGE_OPTIONS = ['vi', 'en', 'ja'];

const HEADER_I18N = {
  vi: { login: 'Đăng nhập', register: 'Đăng ký' },
  en: { login: 'Log in', register: 'Sign up' },
  ja: { login: 'ログイン', register: '登録' },
};

const PAGE_I18N = {
  vi: {
    heroTitle: 'Đăng ký doanh nghiệp',
    heroSub: 'Hoàn thành 4 bước để bắt đầu sử dụng JobShare Business.',
    haveAccount: 'Đã có tài khoản?',
    login: 'Đăng nhập',
    successTitle: 'Đăng ký thành công!',
    successBody: 'Chúng tôi đã gửi email xác thực. Vui lòng xác thực email — sau khi xác thực xong bạn có thể đăng nhập ngay.',
    successLogin: 'Đến trang đăng nhập',
    back: 'Quay lại',
    next: 'Tiếp tục',
    submit: 'Hoàn tất đăng ký',
    submitting: 'Đang gửi...',
  },
  en: {
    heroTitle: 'Business Registration',
    heroSub: 'Complete 4 steps to start using JobShare Business.',
    haveAccount: 'Already have an account?',
    login: 'Log in',
    successTitle: 'Registration successful!',
    successBody: 'We sent a verification email. Please verify your email — you can log in once verification is complete.',
    successLogin: 'Go to login',
    back: 'Back',
    next: 'Continue',
    submit: 'Complete registration',
    submitting: 'Submitting...',
  },
  ja: {
    heroTitle: '企業登録',
    heroSub: '4ステップで JobShare Business を始めましょう。',
    haveAccount: 'すでにアカウントをお持ちですか？',
    login: 'ログイン',
    successTitle: '登録が完了しました！',
    successBody: '確認メールを送信しました。メール認証後、ログインできます。',
    successLogin: 'ログインページへ',
    back: '戻る',
    next: '次へ',
    submit: '登録を完了',
    submitting: '送信中...',
  },
};

const C = {
  red: '#c61414',
  redLt: '#fdf2f2',
  gray: '#4a4a4a',
  blue: '#1c8ae7',
  green: '#00bf63',
  white: '#ffffff',
  border: '#dddddd',
};

const css = {
  root: {
    fontFamily: "'Barlow', sans-serif",
    background: C.white,
    minHeight: '100vh',
  },
  hero: {
    background: C.white,
    padding: '48px 40px 56px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 28, fontWeight: 700, color: C.gray, marginBottom: 8,
  },
  heroSub: {
    fontSize: 15, color: '#6b7280', maxWidth: 520, margin: '0 auto', lineHeight: 1.5,
  },
  wrapper: {
    maxWidth: 760, margin: '-28px auto 60px', padding: '0 20px',
  },
  card: {
    background: C.white, borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,.09)', padding: '40px 48px',
  },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, letterSpacing: '1.2px',
    textTransform: 'uppercase', color: C.red,
    borderLeft: `3px solid ${C.red}`, paddingLeft: 10, marginBottom: 20,
  },
  field: { marginBottom: 16 },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.gray,
  },
  req: { color: C.red, marginLeft: 3 },
  input: {
    width: '100%', padding: '11px 14px',
    fontFamily: "'Barlow', sans-serif", fontSize: 14, color: C.gray,
    background: '#fafafa', border: `1.5px solid ${C.border}`,
    borderRadius: 10, outline: 'none', boxSizing: 'border-box',
    transition: 'border .2s, box-shadow .2s',
  },
  inputFocus: {
    borderColor: C.red,
    boxShadow: '0 0 0 3px rgba(198,20,20,.1)',
    background: C.white,
  },
  inputError: { borderColor: C.red },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  errText: { fontSize: 12, color: C.red, marginTop: 4 },
  btnPrimary: (disabled) => ({
    background: disabled ? '#ccc' : C.red,
    color: C.white, fontFamily: "'Barlow', sans-serif",
    fontSize: 14, fontWeight: 700, padding: '10px 24px',
    border: 'none', borderRadius: 50, cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '.3px',
    boxShadow: disabled ? 'none' : '0 4px 16px rgba(198,20,20,.35)',
    transition: 'background .2s, box-shadow .2s',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  }),
  btnSecondary: (disabled) => ({
    background: C.white,
    color: C.gray, fontFamily: "'Barlow', sans-serif",
    fontSize: 14, fontWeight: 600, padding: '10px 20px',
    border: `1.5px solid ${C.border}`, borderRadius: 50,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  }),
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
    zIndex: 100, display: 'grid', placeItems: 'center',
  },
  successBox: {
    background: C.white, borderRadius: 20, padding: '48px 56px',
    textAlign: 'center', maxWidth: 420,
    boxShadow: '0 12px 40px rgba(0,0,0,.2)',
  },
  checkCircle: {
    width: 72, height: 72, background: C.green, borderRadius: '50%',
    display: 'grid', placeItems: 'center', margin: '0 auto 20px',
  },
  agreeLink: { color: C.blue, textDecoration: 'underline' },
  uploadZone: (hasFile) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width: '100%', minHeight: 140, boxSizing: 'border-box',
    border: `2px dashed ${hasFile ? C.red : C.border}`,
    borderRadius: 14, padding: 24, textAlign: 'center', cursor: 'pointer',
    background: hasFile ? C.redLt : 'transparent',
    transition: 'border .2s, background .2s',
  }),
  infoBox: {
    padding: '12px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.5,
    background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af',
    gridColumn: '1 / -1',
  },
  navRow: {
    marginTop: 28, paddingTop: 24, borderTop: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
};

function FInput({ style, error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      style={{
        ...css.input,
        ...(focused ? css.inputFocus : {}),
        ...(error ? css.inputError : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  );
}

function FSelect({ style, error, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      style={{
        ...css.input,
        ...(focused ? css.inputFocus : {}),
        ...(error ? css.inputError : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    >
      {children}
    </select>
  );
}

const LangTabBar = ({ active, onChange, viHasError }) => (
  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 4, borderRadius: 10, border: `1px solid ${C.border}`, background: '#f9fafb', padding: 4 }}>
    {LANG_TABS.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onChange(tab.key)}
        style={{
          flex: 1, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontWeight: 600,
          border: 'none', cursor: 'pointer', position: 'relative',
          background: active === tab.key ? C.white : 'transparent',
          color: active === tab.key ? C.red : '#6b7280',
          boxShadow: active === tab.key ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
        }}
      >
        {tab.label}
        {tab.required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
        {tab.key === 'vi' && viHasError && (
          <span style={{ position: 'absolute', right: 6, top: 6, width: 6, height: 6, borderRadius: '50%', background: C.red }} />
        )}
      </button>
    ))}
  </div>
);

const Stepper = ({ currentStep }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const done = currentStep > step.key;
        const active = currentStep === step.key;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', border: `2px solid ${done || active ? C.red : C.border}`,
                  background: done ? C.red : active ? C.redLt : C.white,
                  color: done ? C.white : active ? C.red : '#9ca3af',
                }}
              >
                {done ? <Check style={{ width: 14, height: 14 }} /> : <Icon style={{ width: 14, height: 14 }} />}
              </div>
              <span
                style={{
                  display: 'none', textAlign: 'center', fontSize: 10, fontWeight: 600, lineHeight: 1.3,
                  color: active || done ? C.red : '#9ca3af',
                }}
                className="sm:block"
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                style={{
                  height: 2, flex: 1, borderRadius: 2, marginBottom: 20,
                  background: currentStep > step.key ? C.red : C.border,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
    <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.red }} className="sm:hidden">
      Bước {currentStep}/4: {STEPS[currentStep - 1].label}
    </div>
  </div>
);

const ReviewRow = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #f3f4f6', padding: '8px 0' }}>
    <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
    <span style={{ maxWidth: '60%', textAlign: 'right', fontSize: 12, fontWeight: 600, color: C.gray }}>{value || '—'}</span>
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const ht = HEADER_I18N[language] || HEADER_I18N.vi;
  const pt = PAGE_I18N[language] || PAGE_I18N.vi;

  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [categoryTree, setCategoryTree] = useState([]);
  const [langTab, setLangTab] = useState('vi');

  const handleCategoryTreeLoaded = useCallback((tree) => {
    setCategoryTree(tree);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (token && userType === 'business') {
      navigate('/business', { replace: true });
    }
  }, [navigate]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSubmitError('');
  };

  const toggleCategoryIds = (ids) => {
    setForm((prev) => ({ ...prev, jobCategoryIds: ids }));
    setErrors((prev) => ({ ...prev, jobCategoryIds: '' }));
    setSubmitError('');
  };

  const onCompanySizeChange = (value, lang = 'vi') => {
    const item = COMPANY_SIZES.find((s) => s[lang] === value || s.vi === value);
    if (lang === 'vi') {
      setForm((prev) => ({
        ...prev,
        companySize: value,
        companySizeEn: item?.en || prev.companySizeEn,
        companySizeJp: item?.jp || prev.companySizeJp,
      }));
    } else if (lang === 'en') {
      update('companySizeEn', value);
    } else {
      update('companySizeJp', value);
    }
  };

  const viStep1HasError = !!(errors.companyName || errors.address);
  const viStep2HasError = !!(errors.contactName || errors.contactTitle);

  const onLicensePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, businessLicense: 'Chỉ chấp nhận file PDF' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, businessLicense: 'File tối đa 10MB' }));
      return;
    }
    setLicenseFile(file);
    setErrors((prev) => ({ ...prev, businessLicense: '' }));
  };

  const validateStep = (currentStep) => {
    const nextErrors = {};

    if (currentStep === 1) {
      if (!form.companyName.trim()) nextErrors.companyName = 'Vui lòng nhập tên doanh nghiệp';
      if (!form.taxCode.trim()) nextErrors.taxCode = 'Vui lòng nhập mã số thuế';
      if (!form.jobCategoryIds.length) nextErrors.jobCategoryIds = 'Vui lòng chọn ít nhất một lĩnh vực kinh doanh';
      if (!form.address.trim()) nextErrors.address = 'Vui lòng nhập địa chỉ';
    }

    if (currentStep === 2) {
      if (!form.contactName.trim()) nextErrors.contactName = 'Vui lòng nhập họ tên';
      if (!form.contactTitle.trim()) nextErrors.contactTitle = 'Vui lòng nhập chức vụ';
      if (!form.contactEmail.trim()) nextErrors.contactEmail = 'Vui lòng nhập email';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
        nextErrors.contactEmail = 'Email không hợp lệ';
      }
      if (!form.contactPhone.trim()) nextErrors.contactPhone = 'Vui lòng nhập số điện thoại';
    }

    if (currentStep === 3) {
      if (!form.loginEmail.trim()) nextErrors.loginEmail = 'Vui lòng nhập email đăng nhập';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.loginEmail.trim())) {
        nextErrors.loginEmail = 'Email không hợp lệ';
      }
      if (!form.password) nextErrors.password = 'Vui lòng nhập mật khẩu';
      else if (form.password.length < 8) nextErrors.password = 'Mật khẩu tối thiểu 8 ký tự';
      if (form.password !== form.passwordConfirm) nextErrors.passwordConfirm = 'Mật khẩu nhập lại không khớp';
    }

    if (currentStep === 4 && !form.acceptTerms) {
      nextErrors.acceptTerms = 'Vui lòng đồng ý điều khoản sử dụng';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      if (step === 1 || step === 2) setLangTab('vi');
      return;
    }
    setLangTab('vi');
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setLangTab('vi');
    setStep((s) => Math.max(1, s - 1));
  };

  const selectedCategoryLabels = useMemo(
    () => formatJobCategorySelection(categoryTree, [], form.jobCategoryIds, 'vi'),
    [categoryTree, form.jobCategoryIds],
  );

  const buildPayload = () => ({
    companyName: form.companyName.trim(),
    companyNameEn: form.companyNameEn.trim() || null,
    companyNameJp: form.companyNameJp.trim() || null,
    taxCode: form.taxCode.trim(),
    jobCategoryIds: form.jobCategoryIds,
    companySize: form.companySize || null,
    companySizeEn: form.companySizeEn || null,
    companySizeJp: form.companySizeJp || null,
    website: form.website.trim() || null,
    address: form.address.trim(),
    addressEn: form.addressEn.trim() || null,
    addressJp: form.addressJp.trim() || null,
    city: form.city.trim() || null,
    cityEn: form.cityEn.trim() || null,
    cityJp: form.cityJp.trim() || null,
    country: form.country.trim() || 'Việt Nam',
    countryEn: form.countryEn.trim() || null,
    countryJp: form.countryJp.trim() || null,
    contactName: form.contactName.trim(),
    contactNameEn: form.contactNameEn.trim() || null,
    contactNameJp: form.contactNameJp.trim() || null,
    contactTitle: form.contactTitle.trim(),
    contactTitleEn: form.contactTitleEn.trim() || null,
    contactTitleJp: form.contactTitleJp.trim() || null,
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.contactPhone.trim(),
    loginEmail: form.loginEmail.trim(),
    password: form.password,
    acceptTerms: true,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setLoading(true);
    setSubmitError('');
    try {
      const payload = buildPayload();
      let body = payload;
      if (licenseFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value == null || value === '') return;
          if (key === 'jobCategoryIds') fd.append(key, JSON.stringify(value));
          else fd.append(key, String(value));
        });
        fd.append('businessLicenseFile', licenseFile);
        body = fd;
      }
      const response = await apiService.registerBusiness(body);
      if (response.success) {
        setRegisteredEmail(form.loginEmail.trim());
        setSubmitted(true);
      } else {
        setSubmitError(response.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setSubmitError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const reviewSections = useMemo(() => ([
    {
      title: 'Doanh nghiệp',
      rows: [
        ['Tên công ty (VI)', form.companyName],
        ['Tên công ty (EN)', form.companyNameEn || '—'],
        ['Tên công ty (JP)', form.companyNameJp || '—'],
        ['Mã số thuế', form.taxCode],
        ['Lĩnh vực KD', selectedCategoryLabels],
        ['Quy mô (VI / EN / JP)', [form.companySize, form.companySizeEn, form.companySizeJp].filter(Boolean).join(' · ') || '—'],
        ['Website', form.website || '—'],
        ['Địa chỉ (VI)', `${form.address}${form.city ? `, ${form.city}` : ''}, ${form.country}`],
        ['Địa chỉ (EN)', form.addressEn ? `${form.addressEn}${form.cityEn ? `, ${form.cityEn}` : ''}${form.countryEn ? `, ${form.countryEn}` : ''}` : '—'],
        ['Địa chỉ (JP)', form.addressJp ? `${form.addressJp}${form.cityJp ? `, ${form.cityJp}` : ''}${form.countryJp ? `, ${form.countryJp}` : ''}` : '—'],
      ],
    },
    {
      title: 'Người liên hệ',
      rows: [
        ['Họ tên (VI / EN / JP)', [form.contactName, form.contactNameEn, form.contactNameJp].filter(Boolean).join(' · ')],
        ['Chức vụ (VI / EN / JP)', [form.contactTitle, form.contactTitleEn, form.contactTitleJp].filter(Boolean).join(' · ')],
        ['Email', form.contactEmail],
        ['Điện thoại', form.contactPhone],
      ],
    },
    {
      title: 'Tài khoản',
      rows: [['Email đăng nhập', form.loginEmail]],
    },
  ]), [form, selectedCategoryLabels]);

  return (
    <div style={css.root}>
      <Helmet>
        <title>Đăng ký doanh nghiệp | JobShare Business</title>
        <meta name="description" content="Đăng ký tài khoản doanh nghiệp trên JobShare Business để quản lý JD, tiến cử ứng viên và dịch vụ tuyển dụng." />
      </Helmet>

      <link
        href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex-shrink-0">
              <img src="/logo.png" alt="Job Share" className="h-6 w-auto md:h-7" />
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
              <div className="flex items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isActive = language === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => changeLanguage(lang)}
                      className={`h-7 min-w-9 rounded-md px-2 text-[10px] font-bold uppercase transition-colors ${
                        isActive
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-700 hover:bg-neutral-200/80'
                      }`}
                      aria-label={`Chuyển sang ngôn ngữ ${lang}`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
              <Link
                to="/business/login"
                className="inline-flex h-8 min-w-[96px] items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-[11px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                {ht.login}
              </Link>
              <Link
                to="/business/register"
                className="inline-flex h-8 min-w-[96px] items-center justify-center rounded-lg bg-neutral-900 px-3 text-[11px] font-semibold !text-white transition-colors hover:bg-neutral-800"
              >
                {ht.register}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div style={css.hero}>
        <h1 style={css.heroTitle}>{pt.heroTitle}</h1>
        <p style={css.heroSub}>{pt.heroSub}</p>
      </div>

      <div style={css.wrapper}>
        <div style={css.card}>
          <form onSubmit={onSubmit} noValidate>
            <Stepper currentStep={step} />

            {submitError && (
              <div style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', padding: '10px 14px', fontSize: 13, color: C.red }} role="alert">
                {submitError}
              </div>
            )}

            {step === 1 && (
              <>
                <div style={css.sectionTitle}>{STEPS[0].label}</div>
                <div style={{ ...css.grid2, marginBottom: 8 }}>
                  <LangTabBar active={langTab} onChange={setLangTab} viHasError={viStep1HasError} />

                  {langTab === 'vi' && (
                    <>
                      <div style={{ gridColumn: '1 / -1', ...css.field }}>
                        <label style={css.label} htmlFor="companyName">Tên doanh nghiệp <span style={css.req}>*</span></label>
                        <FInput id="companyName" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Công ty TNHH ABC" error={!!errors.companyName} />
                        {errors.companyName && <p style={css.errText}>{errors.companyName}</p>}
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="companySizeVi">Quy mô doanh nghiệp</label>
                        <FSelect id="companySizeVi" value={form.companySize} onChange={(e) => onCompanySizeChange(e.target.value, 'vi')}>
                          <option value="">Chọn quy mô</option>
                          {COMPANY_SIZES.map((item) => <option key={item.vi} value={item.vi}>{item.vi}</option>)}
                        </FSelect>
                      </div>
                      <div style={css.field} />
                      <div style={{ gridColumn: '1 / -1', ...css.field }}>
                        <label style={css.label} htmlFor="address">Địa chỉ trụ sở <span style={css.req}>*</span></label>
                        <FInput id="address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Số nhà, đường, quận/huyện" error={!!errors.address} />
                        {errors.address && <p style={css.errText}>{errors.address}</p>}
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="city">Tỉnh / Thành phố</label>
                        <FInput id="city" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Hà Nội" />
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="country">Quốc gia</label>
                        <FInput id="country" value={form.country} onChange={(e) => update('country', e.target.value)} />
                      </div>
                    </>
                  )}

                  {langTab === 'en' && (
                    <>
                      <div style={{ gridColumn: '1 / -1', ...css.field }}>
                        <label style={css.label} htmlFor="companyNameEn">Company name</label>
                        <FInput id="companyNameEn" value={form.companyNameEn} onChange={(e) => update('companyNameEn', e.target.value)} placeholder="ABC Co., Ltd." />
                      </div>
                      <div style={{ gridColumn: '1 / -1', ...css.field }}>
                        <label style={css.label} htmlFor="companySizeEn">Company size</label>
                        <FSelect id="companySizeEn" value={form.companySizeEn} onChange={(e) => onCompanySizeChange(e.target.value, 'en')}>
                          <option value="">Select size</option>
                          {COMPANY_SIZES.map((item) => <option key={item.en} value={item.en}>{item.en}</option>)}
                        </FSelect>
                      </div>
                      <div style={{ gridColumn: '1 / -1', ...css.field }}>
                        <label style={css.label} htmlFor="addressEn">Head office address</label>
                        <FInput id="addressEn" value={form.addressEn} onChange={(e) => update('addressEn', e.target.value)} placeholder="Street, district" />
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="cityEn">City / Province</label>
                        <FInput id="cityEn" value={form.cityEn} onChange={(e) => update('cityEn', e.target.value)} placeholder="Hanoi" />
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="countryEn">Country</label>
                        <FInput id="countryEn" value={form.countryEn} onChange={(e) => update('countryEn', e.target.value)} placeholder="Vietnam" />
                      </div>
                    </>
                  )}

                  {langTab === 'jp' && (
                    <>
                      <div style={{ gridColumn: '1 / -1', ...css.field }}>
                        <label style={css.label} htmlFor="companyNameJp">会社名</label>
                        <FInput id="companyNameJp" value={form.companyNameJp} onChange={(e) => update('companyNameJp', e.target.value)} placeholder="株式会社ABC" />
                      </div>
                      <div style={{ gridColumn: '1 / -1', ...css.field }}>
                        <label style={css.label} htmlFor="companySizeJp">会社規模</label>
                        <FSelect id="companySizeJp" value={form.companySizeJp} onChange={(e) => onCompanySizeChange(e.target.value, 'jp')}>
                          <option value="">規模を選択</option>
                          {COMPANY_SIZES.map((item) => <option key={item.jp} value={item.jp}>{item.jp}</option>)}
                        </FSelect>
                      </div>
                      <div style={{ gridColumn: '1 / -1', ...css.field }}>
                        <label style={css.label} htmlFor="addressJp">本社所在地</label>
                        <FInput id="addressJp" value={form.addressJp} onChange={(e) => update('addressJp', e.target.value)} placeholder="番地、区" />
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="cityJp">都道府県 / 都市</label>
                        <FInput id="cityJp" value={form.cityJp} onChange={(e) => update('cityJp', e.target.value)} placeholder="ハノイ" />
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="countryJp">国</label>
                        <FInput id="countryJp" value={form.countryJp} onChange={(e) => update('countryJp', e.target.value)} placeholder="ベトナム" />
                      </div>
                    </>
                  )}

                  <div style={css.field}>
                    <label style={css.label} htmlFor="taxCode">Mã số thuế <span style={css.req}>*</span></label>
                    <FInput id="taxCode" value={form.taxCode} onChange={(e) => update('taxCode', e.target.value)} placeholder="0123456789" error={!!errors.taxCode} />
                    {errors.taxCode && <p style={css.errText}>{errors.taxCode}</p>}
                  </div>
                  <div style={css.field}>
                    <label style={css.label} htmlFor="website">Website</label>
                    <FInput id="website" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://company.com" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <JobCategoryDualPickerField
                      label="Lĩnh vực kinh doanh"
                      language="vi"
                      value={form.jobCategoryIds}
                      onChange={toggleCategoryIds}
                      onTreeLoaded={handleCategoryTreeLoaded}
                      error={errors.jobCategoryIds}
                      required
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', ...css.field }}>
                    <label style={css.label}>Giấy phép kinh doanh (PDF, tùy chọn)</label>
                    <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={onLicensePick} />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={css.uploadZone(!!licenseFile)}
                    >
                      <Upload style={{ width: 24, height: 24, color: '#9ca3af', marginBottom: 8 }} />
                      {licenseFile ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: C.red }}>
                          {licenseFile.name}
                          <X
                            style={{ width: 14, height: 14, color: '#9ca3af', cursor: 'pointer' }}
                            onClick={(ev) => { ev.stopPropagation(); setLicenseFile(null); }}
                          />
                        </span>
                      ) : (
                        <>
                          <span style={{ fontSize: 14, color: '#6b7280' }}>Nhấn để tải lên hoặc kéo thả file</span>
                          <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>PDF · Tối đa 10MB</span>
                        </>
                      )}
                    </button>
                    {errors.businessLicense && <p style={css.errText}>{errors.businessLicense}</p>}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={css.sectionTitle}>{STEPS[1].label}</div>
                <div style={css.grid2}>
                  <LangTabBar active={langTab} onChange={setLangTab} viHasError={viStep2HasError} />

                  {langTab === 'vi' && (
                    <>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="contactName">Họ và tên <span style={css.req}>*</span></label>
                        <FInput id="contactName" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} placeholder="Nguyễn Văn A" error={!!errors.contactName} />
                        {errors.contactName && <p style={css.errText}>{errors.contactName}</p>}
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="contactTitle">Chức vụ <span style={css.req}>*</span></label>
                        <FInput id="contactTitle" value={form.contactTitle} onChange={(e) => update('contactTitle', e.target.value)} placeholder="HR Manager" error={!!errors.contactTitle} />
                        {errors.contactTitle && <p style={css.errText}>{errors.contactTitle}</p>}
                      </div>
                    </>
                  )}

                  {langTab === 'en' && (
                    <>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="contactNameEn">Full name</label>
                        <FInput id="contactNameEn" value={form.contactNameEn} onChange={(e) => update('contactNameEn', e.target.value)} placeholder="John Doe" />
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="contactTitleEn">Job title</label>
                        <FInput id="contactTitleEn" value={form.contactTitleEn} onChange={(e) => update('contactTitleEn', e.target.value)} placeholder="HR Manager" />
                      </div>
                    </>
                  )}

                  {langTab === 'jp' && (
                    <>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="contactNameJp">氏名</label>
                        <FInput id="contactNameJp" value={form.contactNameJp} onChange={(e) => update('contactNameJp', e.target.value)} placeholder="グエン・ヴァン・A" />
                      </div>
                      <div style={css.field}>
                        <label style={css.label} htmlFor="contactTitleJp">役職</label>
                        <FInput id="contactTitleJp" value={form.contactTitleJp} onChange={(e) => update('contactTitleJp', e.target.value)} placeholder="人事マネージャー" />
                      </div>
                    </>
                  )}

                  <div style={css.field}>
                    <label style={css.label} htmlFor="contactEmail">Email liên hệ <span style={css.req}>*</span></label>
                    <FInput id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} placeholder="hr@company.com" error={!!errors.contactEmail} />
                    {errors.contactEmail && <p style={css.errText}>{errors.contactEmail}</p>}
                  </div>
                  <div style={css.field}>
                    <label style={css.label} htmlFor="contactPhone">Số điện thoại <span style={css.req}>*</span></label>
                    <FInput id="contactPhone" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} placeholder="0901 234 567" error={!!errors.contactPhone} />
                    {errors.contactPhone && <p style={css.errText}>{errors.contactPhone}</p>}
                  </div>
                  <div style={css.infoBox}>
                    Người liên hệ sẽ là tài khoản quản trị chính, nhận thông báo về JD, tiến cử ứng viên và yêu cầu dịch vụ từ JobShare.
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={css.sectionTitle}>{STEPS[2].label}</div>
                <div style={{ maxWidth: 440, margin: '0 auto' }}>
                  <div style={css.field}>
                    <label style={css.label} htmlFor="loginEmail">Email đăng nhập <span style={css.req}>*</span></label>
                    <FInput id="loginEmail" type="email" value={form.loginEmail} onChange={(e) => update('loginEmail', e.target.value)} placeholder="admin@company.com" error={!!errors.loginEmail} />
                    {errors.loginEmail && <p style={css.errText}>{errors.loginEmail}</p>}
                  </div>
                  <div style={css.field}>
                    <label style={css.label} htmlFor="password">Mật khẩu <span style={css.req}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <FInput id="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Tối thiểu 8 ký tự" error={!!errors.password} style={{ paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                        {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                    {errors.password && <p style={css.errText}>{errors.password}</p>}
                  </div>
                  <div style={css.field}>
                    <label style={css.label} htmlFor="passwordConfirm">Nhập lại mật khẩu <span style={css.req}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <FInput id="passwordConfirm" type={showPw2 ? 'text' : 'password'} value={form.passwordConfirm} onChange={(e) => update('passwordConfirm', e.target.value)} error={!!errors.passwordConfirm} style={{ paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPw2((v) => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                        {showPw2 ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                    {errors.passwordConfirm && <p style={css.errText}>{errors.passwordConfirm}</p>}
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div style={css.sectionTitle}>{STEPS[3].label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviewSections.map((section) => (
                    <div key={section.title} style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: '#fafafa', padding: 14 }}>
                      <h3 style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.red }}>{section.title}</h3>
                      {section.rows.map(([label, value]) => (
                        <ReviewRow key={label} label={label} value={value} />
                      ))}
                    </div>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, padding: 14, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.acceptTerms}
                      onChange={(e) => update('acceptTerms', e.target.checked)}
                      style={{ marginTop: 2, width: 16, height: 16, accentColor: C.red }}
                    />
                    <span style={{ fontSize: 13, lineHeight: 1.6, color: C.gray }}>
                      Tôi đã đọc và đồng ý với{' '}
                      <span style={{ fontWeight: 600, color: C.red }}>Điều khoản sử dụng</span>
                      {' '}và{' '}
                      <span style={{ fontWeight: 600, color: C.red }}>Chính sách bảo mật</span>
                      {' '}của JobShare Business.
                    </span>
                  </label>
                  {errors.acceptTerms && <p style={css.errText}>{errors.acceptTerms}</p>}
                </div>
              </>
            )}

            <div style={css.navRow}>
              <button type="button" onClick={goBack} disabled={step === 1} style={css.btnSecondary(step === 1)}>
                <ChevronLeft style={{ width: 14, height: 14 }} />
                {pt.back}
              </button>

              {step < 4 ? (
                <button type="button" onClick={goNext} style={css.btnPrimary(false)}>
                  {pt.next}
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              ) : (
                <button type="submit" disabled={loading} style={css.btnPrimary(loading)}>
                  {loading ? pt.submitting : pt.submit}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: C.gray, marginTop: 24, marginBottom: 40 }}>
        {pt.haveAccount}{' '}
        <Link to="/business/login" style={css.agreeLink}>{pt.login}</Link>
      </p>

      {submitted && (
        <div style={css.overlay} onClick={() => navigate('/business/login')}>
          <div style={css.successBox} onClick={(e) => e.stopPropagation()}>
            <div style={css.checkCircle}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, color: C.gray, marginBottom: 10 }}>{pt.successTitle}</h2>
            <p style={{ fontSize: 14, color: '#999', lineHeight: 1.6 }}>
              {pt.successBody}
              {registeredEmail && (
                <>
                  {' '}
                  <strong>{registeredEmail}</strong>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => navigate('/business/login')}
              style={{ ...css.btnPrimary(false), marginTop: 20 }}
            >
              {pt.successLogin}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
