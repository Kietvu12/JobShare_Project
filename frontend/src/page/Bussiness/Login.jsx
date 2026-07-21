import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Mail, Lock, Eye, EyeOff, Building2, ArrowRight } from 'lucide-react'
import apiService from '../../services/api'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100'
const labelClass = 'mb-1 block text-[10px] font-semibold text-slate-600'

const FEATURES = [
  'Quản lý JD và tiến cử ứng viên tập trung',
  'Scout Credit, Scout Performance & dịch vụ WS',
  'Theo dõi billing, request và tin nhắn realtime',
]

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    const remembered = localStorage.getItem('businessRememberEmail')
    if (remembered) {
      setEmail(remembered)
      setRemember(true)
    }
    if (token && userType === 'business') {
      navigate('/business', { replace: true })
    }
  }, [navigate])

  const onLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không hợp lệ')
      return
    }

    setLoading(true)
    try {
      const response = await apiService.loginBusiness({
        email: email.trim(),
        password,
      })

      if (response.success && response.data?.token) {
        if (remember) {
          localStorage.setItem('businessRememberEmail', email.trim())
        } else {
          localStorage.removeItem('businessRememberEmail')
        }
        localStorage.setItem('userType', 'business')
        localStorage.setItem('token', response.data.token)
        if (response.data.business) {
          localStorage.setItem('user', JSON.stringify(response.data.business))
        }
        navigate('/business', { replace: true })
      } else {
        setError(response.message || 'Đăng nhập thất bại')
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const onForgot = async (e) => {
    e.preventDefault()
    setError('')
    if (!forgotEmail.trim()) {
      setError('Vui lòng nhập email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setError('Email không hợp lệ')
      return
    }
    setLoading(true)
    try {
      await apiService.forgotPasswordBusiness(forgotEmail.trim())
      setForgotSent(true)
    } catch (err) {
      setError(err.message || 'Không thể gửi email. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-100 via-violet-50 to-blue-50 px-3 py-6 sm:px-4 sm:py-8">
      <Helmet>
        <title>Đăng nhập doanh nghiệp | JobShare Business</title>
        <meta name="description" content="Đăng nhập JobShare Business để quản lý tuyển dụng, JD, ứng viên và dịch vụ tuyển dụng." />
      </Helmet>

      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/business" className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 hover:text-violet-800">
            <ChevronLeft className="h-3.5 w-3.5" />
            Quay lại
          </Link>
          <img src="/logo.png" alt="JobShare" className="h-8 w-auto" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 md:grid md:min-h-[480px] md:grid-cols-[1fr_1.1fr]">
          <div className="hidden flex-col justify-between border-b border-slate-100 bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white md:flex md:border-b-0 md:border-r md:border-slate-100">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold">
                <Building2 className="h-3.5 w-3.5" />
                JobShare Business
              </div>
              <h1 className="text-lg font-bold leading-snug">Nền tảng tuyển dụng dành cho doanh nghiệp</h1>
              <p className="mt-2 text-[11px] leading-relaxed text-violet-100">
                Quản lý toàn bộ quy trình tuyển dụng — từ JD, scout ứng viên đến billing và phối hợp với WS.
              </p>
            </div>
            <ul className="space-y-2.5">
              {FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[10px] leading-relaxed text-violet-50">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/80" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="px-5 py-6 sm:px-6 sm:py-8">
            {!forgotMode ? (
              <>
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">Đăng nhập</h2>
                  <p className="mt-1 text-[10px] text-slate-500">Truy cập portal doanh nghiệp JobShare</p>
                </div>

                <form onSubmit={onLogin} className="space-y-4">
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700" role="alert">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className={labelClass} htmlFor="email">Email đăng nhập</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        className={`${inputClass} pl-9`}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        placeholder="admin@company.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="password">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        className={`${inputClass} pl-9 pr-10`}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError('') }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                        aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-[10px] text-slate-600">Ghi nhớ email</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setForgotMode(true); setError(''); setForgotSent(false) }}
                      className="text-[10px] font-semibold text-violet-700 hover:text-violet-800"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                  >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    {!loading && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </form>

                <p className="mt-5 text-center text-[10px] text-slate-500">
                  Chưa có tài khoản?{' '}
                  <Link to="/business/register" className="font-semibold text-violet-700 hover:text-violet-800">
                    Đăng ký doanh nghiệp
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">Quên mật khẩu</h2>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Nhập email đăng nhập, chúng tôi sẽ gửi link đặt lại mật khẩu.
                  </p>
                </div>

                {forgotSent ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <p className="text-xs font-semibold text-emerald-800">Email đã được gửi!</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-emerald-700">
                      Kiểm tra hộp thư <strong>{forgotEmail}</strong> và làm theo hướng dẫn để đặt lại mật khẩu.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setForgotMode(false); setForgotSent(false) }}
                      className="mt-4 text-[10px] font-semibold text-violet-700 hover:text-violet-800"
                    >
                      Quay lại đăng nhập
                    </button>
                  </div>
                ) : (
                  <form onSubmit={onForgot} className="space-y-4">
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700" role="alert">
                        {error}
                      </div>
                    )}
                    <div>
                      <label className={labelClass} htmlFor="forgotEmail">Email đăng nhập</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          id="forgotEmail"
                          type="email"
                          className={`${inputClass} pl-9`}
                          value={forgotEmail}
                          onChange={(e) => { setForgotEmail(e.target.value); setError('') }}
                          placeholder="admin@company.com"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                    >
                      {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setForgotMode(false); setError('') }}
                      className="w-full text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Quay lại đăng nhập
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
