import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Check, AlertCircle, Loader2 } from 'lucide-react'
import apiService from '../../services/api'

const BusinessVerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = (searchParams.get('token') || '').trim()
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('Đang xác thực email...')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!token) {
        if (mounted) {
          setState('error')
          setMessage('Không tìm thấy token xác thực.')
        }
        return
      }
      try {
        const res = await apiService.verifyBusinessEmail(token)
        if (!mounted) return
        setState('success')
        setMessage(
          res?.data?.result === 'already_verified'
            ? 'Email đã được xác thực trước đó. Bạn có thể đăng nhập ngay.'
            : (res.message || 'Xác thực email thành công. Bạn có thể đăng nhập ngay.')
        )
      } catch (err) {
        if (!mounted) return
        setState('error')
        setMessage(err.message || 'Không thể xác thực email.')
      }
    }
    run()
    return () => { mounted = false }
  }, [token])

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50 to-blue-50 px-4 py-8">
      <Helmet>
        <title>Xác thực email | JobShare Business</title>
      </Helmet>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          {state === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
          {state === 'success' && <Check className="h-6 w-6" />}
          {state === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
        </div>
        <div className="mb-2 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700">
          <Building2 className="h-3.5 w-3.5" />
          JobShare Business
        </div>
        <h1 className="text-base font-bold text-slate-900">
          {state === 'loading' ? 'Đang xác thực...' : state === 'success' ? 'Xác thực thành công' : 'Xác thực thất bại'}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{message}</p>
        {state !== 'loading' && (
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => navigate('/business/login')}
              className="w-full rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Đến trang đăng nhập
            </button>
            {state === 'error' && (
              <Link to="/business/register" className="block text-[10px] font-semibold text-violet-700 hover:text-violet-800">
                Đăng ký lại
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessVerifyEmail
