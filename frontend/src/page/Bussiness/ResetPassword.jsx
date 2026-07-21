import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import apiService from '../../services/api'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100'
const labelClass = 'mb-1 block text-[10px] font-semibold text-slate-600'

const BusinessResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ.')
      return
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp')
      return
    }
    setLoading(true)
    try {
      const res = await apiService.resetPasswordBusiness(token, password)
      if (res.success) setSuccess(true)
      else setError(res.message || 'Đặt lại mật khẩu thất bại')
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50 to-blue-50 px-4 py-8">
      <Helmet>
        <title>Đặt lại mật khẩu | JobShare Business</title>
      </Helmet>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center justify-center gap-2 text-violet-700">
          <Building2 className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-wide">JobShare Business</span>
        </div>
        <h1 className="text-center text-base font-bold text-slate-900">Đặt lại mật khẩu</h1>

        {success ? (
          <div className="mt-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-xs text-slate-600">Mật khẩu đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.</p>
            <button
              type="button"
              onClick={() => navigate('/business/login')}
              className="mt-5 w-full rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Đăng nhập
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="password">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className={`${inputClass} pl-9 pr-10`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="confirmPassword">Nhập lại mật khẩu</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirmPassword"
                  type={showPw2 ? 'text' : 'password'}
                  className={`${inputClass} pl-9 pr-10`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPw2((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
            </button>
            <Link to="/business/login" className="block text-center text-[10px] font-semibold text-violet-700 hover:text-violet-800">
              Quay lại đăng nhập
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}

export default BusinessResetPassword
