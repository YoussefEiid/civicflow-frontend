import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Timer,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OtpInput } from '../../components/auth/OtpInput';
import { authService } from '../../services/authService';
import { ApiError } from '../../services/apiClient';

type View = 'email' | 'otp' | 'verified';

interface BannerState {
  type: 'error' | 'success';
  message: string;
  hint?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const OtpVerifyPage: React.FC = () => {
  const navigate = useNavigate();

  const [view, setView] = useState<View>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [banner, setBanner] = useState<BannerState | null>(null);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // --- Countdown timer: ticks every second until it hits zero ---
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(Math.max(0, Math.ceil(seconds)));
  }, []);

  const showBanner = useCallback((b: BannerState | null) => {
    setBanner(b);
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim();

    if (!EMAIL_REGEX.test(targetEmail)) {
      showBanner({ type: 'error', message: 'يرجى إدخال بريد إلكتروني صالح', hint: 'مثال: name@example.com' });
      return;
    }

    setSending(true);
    showBanner(null);
    try {
      const res = await authService.sendOtp(targetEmail);
      setOtp('');
      startCooldown(res.cooldownSeconds || 60);
      showBanner({
        type: 'success',
        message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
        hint: `الرمز صالح لمدة ${res.expiresInMinutes || 10} دقائق`
      });
      setView('otp');
    } catch (err: any) {
      showBanner({ type: 'error', message: err?.message || 'تعذر إرسال رمز التحقق، يرجى المحاولة لاحقاً' });
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;

    setVerifying(true);
    showBanner(null);
    try {
      await authService.verifyOtp(email.trim(), code);
      showBanner({
        type: 'success',
        message: 'تم التحقق من بريدك الإلكتروني بنجاح',
        hint: 'تم تفعيل الحساب وتجهيز جلسة آمنة، يمكنك المتابعة إلى لوحة التحكم'
      });
      setView('verified');
    } catch (err: any) {
      const message = err?.message || 'رمز التحقق غير صحيح';
      let hint: string | undefined;

      if (err instanceof ApiError) {
        if (err.code === 'OTP_EXPIRED') {
          hint = 'انتهت صلاحية الرمز، يرجى طلب رمز جديد';
        } else if (err.code === 'OTP_COOLDOWN') {
          hint = 'يرجى انتظار انتهاء فترة إعادة الإرسال';
          if (typeof err.details?.retryAfterSeconds === 'number') {
            startCooldown(err.details.retryAfterSeconds);
          }
        } else if (err.code === 'OTP_LOCKED') {
          hint = 'تم تأمين التحقق مؤقتاً بسبب المحاولات المتكررة';
          if (typeof err.details?.retryAfterSeconds === 'number') {
            startCooldown(err.details.retryAfterSeconds);
          }
        } else if (err.code === 'INVALID_OTP' && typeof err.details?.attemptsRemaining === 'number') {
          hint = `لديك ${err.details.attemptsRemaining} محاولة متبقية قبل تأمين التحقق`;
        }
      }

      showBanner({ type: 'error', message, hint });
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email.trim()) return;

    setResending(true);
    showBanner(null);
    try {
      const res = await authService.resendOtp(email.trim());
      setOtp('');
      startCooldown(res.cooldownSeconds || 60);
      showBanner({
        type: 'success',
        message: 'تم إعادة إرسال رمز تحقق جديد إلى بريدك الإلكتروني',
        hint: `الرمز صالح لمدة ${res.expiresInMinutes || 10} دقائق`
      });
    } catch (err: any) {
      const message = err?.message || 'تعذر إعادة إرسال الرمز';
      showBanner({ type: 'error', message });

      if (err instanceof ApiError && err.code === 'OTP_COOLDOWN' && typeof err.details?.retryAfterSeconds === 'number') {
        startCooldown(err.details.retryAfterSeconds);
      }
    } finally {
      setResending(false);
    }
  };

  const goBackToEmail = () => {
    setView('email');
    setOtp('');
    showBanner(null);
  };

  return (
    <div dir="rtl">
      <div className="mb-6 text-center">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
            view === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
          }`}
        >
          {view === 'verified' ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {view === 'email' && 'تأكيد البريد الإلكتروني'}
          {view === 'otp' && 'أدخل رمز التحقق'}
          {view === 'verified' && 'تم التحقق بنجاح'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {view === 'email' && 'أدخل بريدك الإلكتروني وسنرسل إليك رمز تحقق مكوّن من 6 أرقام'}
          {view === 'otp' && (
            <>
              تم إرسال الرمز إلى: <span className="font-bold text-slate-700">{email}</span> — أدخل الأرقام الستة
            </>
          )}
          {view === 'verified' && 'تم تأكيد حسابك وتجهيز جلسة آمنة لك'}
        </p>
      </div>

      {/* Dynamic feedback banner */}
      {banner && (
        <div
          className={`mb-4 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
          role="alert"
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">{banner.message}</p>
            {banner.hint && <p className={`mt-0.5 ${banner.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>{banner.hint}</p>}
          </div>
        </div>
      )}

      {view === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
            icon={<Mail className="w-4 h-4" />}
          />

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 text-slate-600 text-[11px]">
            <Timer className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>ستصلك رسالة تحتوي رمزاً سرياً صالحاً لمدة 10 دقائق، مع خاصية إعادة الإرسال بعد دقيقة.</span>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={sending} icon={<Mail className="w-4 h-4" />}>
              إرسال رمز التحقق (OTP)
            </Button>
          </div>
        </form>
      )}

      {view === 'otp' && (
        <div className="space-y-5">
          <OtpInput
            length={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleVerify}
            isLoading={verifying}
            disabled={verifying}
            error={banner?.type === 'error'}
            autoFocus
            label="رمز التحقق المكوّن من 6 أرقام"
          />

          <div className="pt-1">
            <Button
              type="button"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={verifying}
              disabled={otp.length !== 6}
              onClick={() => handleVerify(otp)}
            >
              تأكيد الرمز
            </Button>
          </div>

          {/* Resend with countdown */}
          <div className="flex items-center justify-between px-1 pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>لم يصلك الرمز؟</span>
            </div>
            {cooldown > 0 ? (
              <span className="text-[11px] font-bold text-amber-600 inline-flex items-center gap-1.5" dir="ltr">
                <Timer className="w-3.5 h-3.5" />
                أعد الإرسال خلال {cooldown} ثانية
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 inline-flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {resending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
              </button>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={goBackToEmail}
              className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              تغيير البريد الإلكتروني
            </button>
          </div>
        </div>
      )}

      {view === 'verified' && (
        <div className="space-y-5">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-900">تم التحقق من بريدك الإلكتروني بنجاح</p>
            <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
              تم تفعيل حسابك وإصدار جلسة آمنة. يمكنك الآن الوصول إلى منظومة CivicFlow.
            </p>
          </div>
          <Button
            variant="primary"
            className="w-full"
            size="lg"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => {
              window.location.href = '/dashboard';
            }}
          >
            الانتقال إلى لوحة التحكم
          </Button>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" />
          العودة لتسجيل الدخول
        </Link>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
        <GraduationCap className="w-3 h-3" />
        رمز التحقق يُستخدم لمرة واحدة فقط، ولن يطلبه أحد من فريق الدعم
      </div>
    </div>
  );
};

export default OtpVerifyPage;