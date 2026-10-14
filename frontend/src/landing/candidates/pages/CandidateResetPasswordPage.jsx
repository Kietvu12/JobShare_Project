import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Lock } from 'lucide-react';
import CandidateAuthShell from './CandidateAuthShell';
import {
  AUTH_FONT,
  AuthErrorAlert,
  AuthPasswordToggle,
  AuthPrimaryButton,
  AuthSubmitButton,
  authInputWithIcons,
  authLabelClass,
} from './CandidateAuthFormUi';
import { useLanguage } from '../../../context/LanguageContext';
import { resolveCandidatePrefix } from '../../../utils/localeRoutes';
import apiService from '../../../services/api';

const STR = {
  vi: {
    title: 'Đặt lại mật khẩu',
    subtitle: 'Nhập mật khẩu mới cho tài khoản ứng viên của bạn.',
    newPassword: 'Mật khẩu mới',
    newPasswordPlaceholder: 'Tối thiểu 8 ký tự',
    confirmPassword: 'Xác nhận mật khẩu',
    confirmPasswordPlaceholder: 'Nhập lại mật khẩu',
    submit: 'Đặt lại mật khẩu',
    resetting: 'Đang xử lý...',
    backToLogin: 'Quay lại đăng nhập',
    successMsg: 'Mật khẩu đã được đặt lại thành công!',
    passwordMismatch: 'Mật khẩu xác nhận không khớp',
    passwordTooShort: 'Mật khẩu phải có ít nhất 8 ký tự',
    errorGeneric: 'Có lỗi xảy ra. Vui lòng thử lại.',
  },
  en: {
    title: 'Reset Password',
    subtitle: 'Enter a new password for your candidate account.',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'Minimum 8 characters',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter password',
    submit: 'Reset Password',
    resetting: 'Processing...',
    backToLogin: 'Back to sign in',
    successMsg: 'Your password has been reset successfully!',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    errorGeneric: 'Something went wrong. Please try again.',
  },
  ja: {
    title: 'パスワードリセット',
    subtitle: '応募者アカウントの新しいパスワードを入力してください。',
    newPassword: '新しいパスワード',
    newPasswordPlaceholder: '8文字以上',
    confirmPassword: 'パスワード確認',
    confirmPasswordPlaceholder: 'パスワードを再入力',
    submit: 'パスワードをリセット',
    resetting: '処理中...',
    backToLogin: 'ログインに戻る',
    successMsg: 'パスワードが正常にリセットされました！',
    passwordMismatch: 'パスワードが一致しません',
    passwordTooShort: 'パスワードは8文字以上必要です',
    errorGeneric: 'エラーが発生しました。もう一度お試しください。',
  },
};

export default function CandidateResetPasswordPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { language } = useLanguage();
  const t = STR[language] || STR.vi;

  const prefix = useMemo(() => resolveCandidatePrefix(pathname), [pathname]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.resetPasswordApplicant(token, password);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || t.errorGeneric);
      }
    } catch (err) {
      setError(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const leftLinks = (
    <Link
      to={`${prefix}/login`}
      className="block text-black hover:text-red-700 text-sm transition-colors text-center lg:text-left underline"
      style={{ fontFamily: AUTH_FONT }}
    >
      {t.backToLogin}
    </Link>
  );

  return (
    <CandidateAuthShell formTitle={t.title} formSubtitle={t.subtitle} leftLinks={leftLinks}>
      <Helmet>
        <title>{t.title} | Workstation JobShare</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {success ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{t.successMsg}</span>
          </div>
          <AuthPrimaryButton onClick={() => navigate(`${prefix}/login`)}>{t.backToLogin}</AuthPrimaryButton>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <AuthErrorAlert message={error} />

          <div>
            <label htmlFor="cand-reset-pw" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
              {t.newPassword}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="cand-reset-pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder={t.newPasswordPlaceholder}
                required
                className={authInputWithIcons({ leftIcon: true, rightIcon: true })}
                style={{ fontFamily: AUTH_FONT }}
              />
              <AuthPasswordToggle
                show={showPw}
                onToggle={() => setShowPw((v) => !v)}
                inputId="cand-reset-pw"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cand-reset-pw-confirm" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
              {t.confirmPassword}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="cand-reset-pw-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder={t.confirmPasswordPlaceholder}
                required
                className={authInputWithIcons({ leftIcon: true, rightIcon: true })}
                style={{ fontFamily: AUTH_FONT }}
              />
              <AuthPasswordToggle
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                inputId="cand-reset-pw-confirm"
              />
            </div>
          </div>

          <AuthSubmitButton loading={loading} loadingText={t.resetting}>
            {t.submit}
          </AuthSubmitButton>

          <Link
            to={`${prefix}/login`}
            className="block text-center text-sm font-medium text-black hover:text-red-700 underline"
            style={{ fontFamily: AUTH_FONT }}
          >
            {t.backToLogin}
          </Link>
        </form>
      )}
    </CandidateAuthShell>
  );
}
