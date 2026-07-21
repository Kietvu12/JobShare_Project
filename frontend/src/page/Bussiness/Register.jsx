import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2, User, KeyRound, ClipboardCheck,
  ChevronLeft, ChevronRight, Check, Eye, EyeOff, Upload, X,
} from 'lucide-react'
import apiService from '../../services/api'
import { JobCategoryDualPickerField, formatJobCategorySelection } from '../../component/Shared/JobCategoryDualPickerModal'

const STEPS = [
  { key: 1, label: 'Thông tin doanh nghiệp', icon: Building2 },
  { key: 2, label: 'Người liên hệ', icon: User },
  { key: 3, label: 'Tài khoản', icon: KeyRound },
  { key: 4, label: 'Xác nhận', icon: ClipboardCheck },
]

const COMPANY_SIZES = [
  { vi: '1–10 nhân sự', en: '1–10 employees', jp: '1–10名' },
  { vi: '11–50 nhân sự', en: '11–50 employees', jp: '11–50名' },
  { vi: '51–200 nhân sự', en: '51–200 employees', jp: '51–200名' },
  { vi: '201–500 nhân sự', en: '201–500 employees', jp: '201–500名' },
  { vi: '500+ nhân sự', en: '500+ employees', jp: '500名以上' },
]

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
}

const LANG_TABS = [
  { key: 'vi', label: 'Tiếng Việt', required: true },
  { key: 'en', label: 'English', required: false },
  { key: 'jp', label: '日本語', required: false },
]

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100'
const labelClass = 'mb-1 block text-[10px] font-semibold text-slate-600'
const errorClass = 'mt-1 text-[10px] text-red-600'

const LangTabBar = ({ active, onChange, viHasError }) => (
  <div className="sm:col-span-2 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
    {LANG_TABS.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onChange(tab.key)}
        className={`relative flex-1 rounded-md px-2 py-2 text-[10px] font-semibold transition ${
          active === tab.key
            ? 'bg-white text-violet-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {tab.label}
        {tab.required && <span className="ml-0.5 text-red-500">*</span>}
        {tab.key === 'vi' && viHasError && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        )}
      </button>
    ))}
  </div>
)

const Stepper = ({ currentStep }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between gap-1">
      {STEPS.map((step, index) => {
        const Icon = step.icon
        const done = currentStep > step.key
        const active = currentStep === step.key
        return (
          <React.Fragment key={step.key}>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  done
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : active
                      ? 'border-violet-600 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span
                className={`hidden text-center text-[9px] font-semibold leading-tight sm:block ${
                  active || done ? 'text-violet-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mb-5 h-0.5 flex-1 rounded-full sm:mb-6 ${
                  currentStep > step.key ? 'bg-violet-500' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
    <div className="mt-2 text-center text-[10px] font-semibold text-violet-700 sm:hidden">
      Bước {currentStep}/4: {STEPS[currentStep - 1].label}
    </div>
  </div>
)

const ReviewRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
    <span className="text-[10px] text-slate-500">{label}</span>
    <span className="max-w-[60%] text-right text-[10px] font-semibold text-slate-800">{value || '—'}</span>
  </div>
)

const Register = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [licenseFile, setLicenseFile] = useState(null)
  const [categoryTree, setCategoryTree] = useState([])
  const [langTab, setLangTab] = useState('vi')

  const handleCategoryTreeLoaded = useCallback((tree) => {
    setCategoryTree(tree)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    if (token && userType === 'business') {
      navigate('/business', { replace: true })
    }
  }, [navigate])

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setSubmitError('')
  }

  const toggleCategoryIds = (ids) => {
    setForm((prev) => ({ ...prev, jobCategoryIds: ids }))
    setErrors((prev) => ({ ...prev, jobCategoryIds: '' }))
    setSubmitError('')
  }

  const onCompanySizeChange = (value, lang = 'vi') => {
    const item = COMPANY_SIZES.find((s) => s[lang] === value || s.vi === value)
    if (lang === 'vi') {
      setForm((prev) => ({
        ...prev,
        companySize: value,
        companySizeEn: item?.en || prev.companySizeEn,
        companySizeJp: item?.jp || prev.companySizeJp,
      }))
    } else if (lang === 'en') {
      update('companySizeEn', value)
    } else {
      update('companySizeJp', value)
    }
  }

  const viStep1HasError = !!(errors.companyName || errors.address)
  const viStep2HasError = !!(errors.contactName || errors.contactTitle)

  const onLicensePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, businessLicense: 'Chỉ chấp nhận file PDF' }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, businessLicense: 'File tối đa 10MB' }))
      return
    }
    setLicenseFile(file)
    setErrors((prev) => ({ ...prev, businessLicense: '' }))
  }

  const validateStep = (currentStep) => {
    const nextErrors = {}

    if (currentStep === 1) {
      if (!form.companyName.trim()) nextErrors.companyName = 'Vui lòng nhập tên doanh nghiệp'
      if (!form.taxCode.trim()) nextErrors.taxCode = 'Vui lòng nhập mã số thuế'
      if (!form.jobCategoryIds.length) nextErrors.jobCategoryIds = 'Vui lòng chọn ít nhất một lĩnh vực kinh doanh'
      if (!form.address.trim()) nextErrors.address = 'Vui lòng nhập địa chỉ'
    }

    if (currentStep === 2) {
      if (!form.contactName.trim()) nextErrors.contactName = 'Vui lòng nhập họ tên'
      if (!form.contactTitle.trim()) nextErrors.contactTitle = 'Vui lòng nhập chức vụ'
      if (!form.contactEmail.trim()) nextErrors.contactEmail = 'Vui lòng nhập email'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
        nextErrors.contactEmail = 'Email không hợp lệ'
      }
      if (!form.contactPhone.trim()) nextErrors.contactPhone = 'Vui lòng nhập số điện thoại'
    }

    if (currentStep === 3) {
      if (!form.loginEmail.trim()) nextErrors.loginEmail = 'Vui lòng nhập email đăng nhập'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.loginEmail.trim())) {
        nextErrors.loginEmail = 'Email không hợp lệ'
      }
      if (!form.password) nextErrors.password = 'Vui lòng nhập mật khẩu'
      else if (form.password.length < 8) nextErrors.password = 'Mật khẩu tối thiểu 8 ký tự'
      if (form.password !== form.passwordConfirm) nextErrors.passwordConfirm = 'Mật khẩu nhập lại không khớp'
    }

    if (currentStep === 4 && !form.acceptTerms) {
      nextErrors.acceptTerms = 'Vui lòng đồng ý điều khoản sử dụng'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) {
      if (step === 1 || step === 2) setLangTab('vi')
      return
    }
    setLangTab('vi')
    setStep((s) => Math.min(4, s + 1))
  }

  const goBack = () => {
    setLangTab('vi')
    setStep((s) => Math.max(1, s - 1))
  }

  const selectedCategoryLabels = useMemo(
    () => formatJobCategorySelection(categoryTree, [], form.jobCategoryIds, 'vi'),
    [categoryTree, form.jobCategoryIds]
  )

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
  })

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(4)) return
    setLoading(true)
    setSubmitError('')
    try {
      const payload = buildPayload()
      let body = payload
      if (licenseFile) {
        const fd = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          if (value == null || value === '') return
          if (key === 'jobCategoryIds') fd.append(key, JSON.stringify(value))
          else fd.append(key, String(value))
        })
        fd.append('businessLicenseFile', licenseFile)
        body = fd
      }
      const response = await apiService.registerBusiness(body)
      if (response.success) {
        setRegisteredEmail(form.loginEmail.trim())
        setSubmitted(true)
      } else {
        setSubmitError(response.message || 'Đăng ký thất bại')
      }
    } catch (err) {
      setSubmitError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

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
  ]), [form, selectedCategoryLabels])

  if (submitted) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50 to-blue-50 px-4 py-8">
        <Helmet>
          <title>Đăng ký thành công | JobShare Business</title>
        </Helmet>
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Đăng ký thành công!</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Chúng tôi đã gửi email xác thực tới <strong>{registeredEmail}</strong>.
            Vui lòng xác thực email — sau khi xác thực xong bạn có thể đăng nhập ngay.
          </p>
          <button
            type="button"
            onClick={() => navigate('/business/login')}
            className="mt-6 w-full rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"
          >
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-100 via-violet-50 to-blue-50 px-3 py-6 sm:px-4 sm:py-8">
      <Helmet>
        <title>Đăng ký doanh nghiệp | JobShare Business</title>
        <meta name="description" content="Đăng ký tài khoản doanh nghiệp trên JobShare Business để quản lý JD, tiến cử ứng viên và dịch vụ tuyển dụng." />
      </Helmet>

      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/business" className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 hover:text-violet-800">
            <ChevronLeft className="h-3.5 w-3.5" />
            Quay lại
          </Link>
          <img src="/logo.png" alt="JobShare" className="h-8 w-auto" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">Đăng ký tài khoản doanh nghiệp</h1>
            <p className="mt-1 text-[10px] text-slate-500">Hoàn thành 4 bước để bắt đầu sử dụng JobShare Business</p>
          </div>

          <form onSubmit={onSubmit} className="px-5 py-5 sm:px-6 sm:py-6">
            <Stepper currentStep={step} />

            {submitError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700" role="alert">
                {submitError}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <LangTabBar active={langTab} onChange={setLangTab} viHasError={viStep1HasError} />

                {langTab === 'vi' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="companyName">Tên doanh nghiệp *</label>
                      <input id="companyName" className={inputClass} value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Công ty TNHH ABC" />
                      {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="companySizeVi">Quy mô doanh nghiệp</label>
                      <select id="companySizeVi" className={inputClass} value={form.companySize} onChange={(e) => onCompanySizeChange(e.target.value, 'vi')}>
                        <option value="">Chọn quy mô</option>
                        {COMPANY_SIZES.map((item) => <option key={item.vi} value={item.vi}>{item.vi}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="address">Địa chỉ trụ sở *</label>
                      <input id="address" className={inputClass} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Số nhà, đường, quận/huyện" />
                      {errors.address && <p className={errorClass}>{errors.address}</p>}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="city">Tỉnh / Thành phố</label>
                      <input id="city" className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Hà Nội" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="country">Quốc gia</label>
                      <input id="country" className={inputClass} value={form.country} onChange={(e) => update('country', e.target.value)} />
                    </div>
                  </>
                )}

                {langTab === 'en' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="companyNameEn">Company name</label>
                      <input id="companyNameEn" className={inputClass} value={form.companyNameEn} onChange={(e) => update('companyNameEn', e.target.value)} placeholder="ABC Co., Ltd." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="companySizeEn">Company size</label>
                      <select id="companySizeEn" className={inputClass} value={form.companySizeEn} onChange={(e) => onCompanySizeChange(e.target.value, 'en')}>
                        <option value="">Select size</option>
                        {COMPANY_SIZES.map((item) => <option key={item.en} value={item.en}>{item.en}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="addressEn">Head office address</label>
                      <input id="addressEn" className={inputClass} value={form.addressEn} onChange={(e) => update('addressEn', e.target.value)} placeholder="Street, district" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="cityEn">City / Province</label>
                      <input id="cityEn" className={inputClass} value={form.cityEn} onChange={(e) => update('cityEn', e.target.value)} placeholder="Hanoi" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="countryEn">Country</label>
                      <input id="countryEn" className={inputClass} value={form.countryEn} onChange={(e) => update('countryEn', e.target.value)} placeholder="Vietnam" />
                    </div>
                  </>
                )}

                {langTab === 'jp' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="companyNameJp">会社名</label>
                      <input id="companyNameJp" className={inputClass} value={form.companyNameJp} onChange={(e) => update('companyNameJp', e.target.value)} placeholder="株式会社ABC" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="companySizeJp">会社規模</label>
                      <select id="companySizeJp" className={inputClass} value={form.companySizeJp} onChange={(e) => onCompanySizeChange(e.target.value, 'jp')}>
                        <option value="">規模を選択</option>
                        {COMPANY_SIZES.map((item) => <option key={item.jp} value={item.jp}>{item.jp}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="addressJp">本社所在地</label>
                      <input id="addressJp" className={inputClass} value={form.addressJp} onChange={(e) => update('addressJp', e.target.value)} placeholder="番地、区" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="cityJp">都道府県 / 都市</label>
                      <input id="cityJp" className={inputClass} value={form.cityJp} onChange={(e) => update('cityJp', e.target.value)} placeholder="ハノイ" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="countryJp">国</label>
                      <input id="countryJp" className={inputClass} value={form.countryJp} onChange={(e) => update('countryJp', e.target.value)} placeholder="ベトナム" />
                    </div>
                  </>
                )}

                <div>
                  <label className={labelClass} htmlFor="taxCode">Mã số thuế *</label>
                  <input id="taxCode" className={inputClass} value={form.taxCode} onChange={(e) => update('taxCode', e.target.value)} placeholder="0123456789" />
                  {errors.taxCode && <p className={errorClass}>{errors.taxCode}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="website">Website</label>
                  <input id="website" className={inputClass} value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://company.com" />
                </div>
                <JobCategoryDualPickerField
                  className="sm:col-span-2"
                  label="Lĩnh vực kinh doanh"
                  language="vi"
                  value={form.jobCategoryIds}
                  onChange={toggleCategoryIds}
                  onTreeLoaded={handleCategoryTreeLoaded}
                  error={errors.jobCategoryIds}
                  required
                />
                <div className="sm:col-span-2">
                  <label className={labelClass}>Giấy phép kinh doanh (PDF, tùy chọn)</label>
                  <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onLicensePick} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:border-violet-400 hover:bg-violet-50/40"
                  >
                    <Upload className="mb-2 h-5 w-5 text-slate-400" />
                    {licenseFile ? (
                      <span className="flex items-center gap-2 text-[10px] font-medium text-violet-700">
                        {licenseFile.name}
                        <X
                          className="h-3.5 w-3.5 text-slate-400 hover:text-red-500"
                          onClick={(ev) => { ev.stopPropagation(); setLicenseFile(null) }}
                        />
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] font-medium text-slate-600">Nhấn để tải lên hoặc kéo thả file</span>
                        <span className="mt-1 text-[9px] text-slate-400">PDF · Tối đa 10MB</span>
                      </>
                    )}
                  </button>
                  {errors.businessLicense && <p className={errorClass}>{errors.businessLicense}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <LangTabBar active={langTab} onChange={setLangTab} viHasError={viStep2HasError} />

                {langTab === 'vi' && (
                  <>
                    <div>
                      <label className={labelClass} htmlFor="contactName">Họ và tên *</label>
                      <input id="contactName" className={inputClass} value={form.contactName} onChange={(e) => update('contactName', e.target.value)} placeholder="Nguyễn Văn A" />
                      {errors.contactName && <p className={errorClass}>{errors.contactName}</p>}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="contactTitle">Chức vụ *</label>
                      <input id="contactTitle" className={inputClass} value={form.contactTitle} onChange={(e) => update('contactTitle', e.target.value)} placeholder="HR Manager" />
                      {errors.contactTitle && <p className={errorClass}>{errors.contactTitle}</p>}
                    </div>
                  </>
                )}

                {langTab === 'en' && (
                  <>
                    <div>
                      <label className={labelClass} htmlFor="contactNameEn">Full name</label>
                      <input id="contactNameEn" className={inputClass} value={form.contactNameEn} onChange={(e) => update('contactNameEn', e.target.value)} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="contactTitleEn">Job title</label>
                      <input id="contactTitleEn" className={inputClass} value={form.contactTitleEn} onChange={(e) => update('contactTitleEn', e.target.value)} placeholder="HR Manager" />
                    </div>
                  </>
                )}

                {langTab === 'jp' && (
                  <>
                    <div>
                      <label className={labelClass} htmlFor="contactNameJp">氏名</label>
                      <input id="contactNameJp" className={inputClass} value={form.contactNameJp} onChange={(e) => update('contactNameJp', e.target.value)} placeholder="グエン・ヴァン・A" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="contactTitleJp">役職</label>
                      <input id="contactTitleJp" className={inputClass} value={form.contactTitleJp} onChange={(e) => update('contactTitleJp', e.target.value)} placeholder="人事マネージャー" />
                    </div>
                  </>
                )}

                <div>
                  <label className={labelClass} htmlFor="contactEmail">Email liên hệ *</label>
                  <input id="contactEmail" type="email" className={inputClass} value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} placeholder="hr@company.com" />
                  {errors.contactEmail && <p className={errorClass}>{errors.contactEmail}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="contactPhone">Số điện thoại *</label>
                  <input id="contactPhone" className={inputClass} value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} placeholder="0901 234 567" />
                  {errors.contactPhone && <p className={errorClass}>{errors.contactPhone}</p>}
                </div>
                <div className="sm:col-span-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] leading-relaxed text-blue-800">
                  Người liên hệ sẽ là tài khoản quản trị chính, nhận thông báo về JD, tiến cử ứng viên và yêu cầu dịch vụ từ JobShare.
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mx-auto grid max-w-md gap-3">
                <div>
                  <label className={labelClass} htmlFor="loginEmail">Email đăng nhập *</label>
                  <input id="loginEmail" type="email" className={inputClass} value={form.loginEmail} onChange={(e) => update('loginEmail', e.target.value)} placeholder="admin@company.com" />
                  {errors.loginEmail && <p className={errorClass}>{errors.loginEmail}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="password">Mật khẩu *</label>
                  <div className="relative">
                    <input id="password" type={showPw ? 'text' : 'password'} className={`${inputClass} pr-10`} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Tối thiểu 8 ký tự" />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className={errorClass}>{errors.password}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="passwordConfirm">Nhập lại mật khẩu *</label>
                  <div className="relative">
                    <input id="passwordConfirm" type={showPw2 ? 'text' : 'password'} className={`${inputClass} pr-10`} value={form.passwordConfirm} onChange={(e) => update('passwordConfirm', e.target.value)} />
                    <button type="button" onClick={() => setShowPw2((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.passwordConfirm && <p className={errorClass}>{errors.passwordConfirm}</p>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                {reviewSections.map((section) => (
                  <div key={section.title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-violet-700">{section.title}</h3>
                    {section.rows.map(([label, value]) => (
                      <ReviewRow key={label} label={label} value={value} />
                    ))}
                  </div>
                ))}
                <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={(e) => update('acceptTerms', e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-[10px] leading-relaxed text-slate-600">
                    Tôi đã đọc và đồng ý với{' '}
                    <span className="font-semibold text-violet-700">Điều khoản sử dụng</span>
                    {' '}và{' '}
                    <span className="font-semibold text-violet-700">Chính sách bảo mật</span>
                    {' '}của JobShare Business.
                  </span>
                </label>
                {errors.acceptTerms && <p className={errorClass}>{errors.acceptTerms}</p>}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Quay lại
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-[10px] font-semibold text-white hover:bg-violet-700"
                >
                  Tiếp tục
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-[10px] font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {loading ? 'Đang gửi...' : 'Hoàn tất đăng ký'}
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-[10px] text-slate-500">
              Đã có tài khoản?{' '}
              <Link to="/business/login" className="font-semibold text-violet-700 hover:text-violet-800">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
