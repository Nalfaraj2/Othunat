import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoStacked from '../assets/logo/idhonat-stacked-navy-on-white.svg'
import { IdhButton } from '../brand/Button'
import { AuthServiceError, signUp } from '../services/authService'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [civilId, setCivilId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signUp({ civilId, fullName, email, password })
      navigate('/')
    } catch (err) {
      setError(err instanceof AuthServiceError ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = { borderRadius: 'var(--idh-r-md)', borderColor: 'var(--idh-silver)' }
  const labelStyle = { color: 'var(--idh-ink-2)' }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--idh-mist)' }} dir="rtl">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 space-y-4"
        style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}
      >
        <div className="flex flex-col items-center gap-2 mb-1">
          <img src={logoStacked} alt="إذونات" className="h-20" />
          <h1 className="text-lg font-bold">إنشاء حساب جديد</h1>
        </div>

        <label className="block">
          <span className="text-sm font-bold" style={labelStyle}>
            الرقم المدني (12 رقمًا)
          </span>
          <input
            className="mt-1 w-full p-3 border outline-none"
            style={inputStyle}
            inputMode="numeric"
            pattern="\d{12}"
            maxLength={12}
            required
            value={civilId}
            onChange={(e) => setCivilId(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold" style={labelStyle}>
            الاسم الكامل
          </span>
          <input
            className="mt-1 w-full p-3 border outline-none"
            style={inputStyle}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold" style={labelStyle}>
            البريد الإلكتروني (لاسترجاع كلمة المرور فقط)
          </span>
          <input
            type="email"
            className="mt-1 w-full p-3 border outline-none"
            style={inputStyle}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold" style={labelStyle}>
            كلمة المرور
          </span>
          <input
            type="password"
            className="mt-1 w-full p-3 border outline-none"
            style={inputStyle}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="text-sm font-bold" style={{ color: 'var(--idh-rejected)' }}>
            {error}
          </p>
        )}

        <IdhButton type="submit" variant="primary" size="lg" block loading={submitting}>
          إنشاء الحساب
        </IdhButton>

        <p className="text-sm text-center" style={labelStyle}>
          عندك حساب؟{' '}
          <Link to="/login" className="font-bold" style={{ color: 'var(--idh-navy-900)' }}>
            تسجيل الدخول
          </Link>
        </p>

        <p className="text-xs text-center" style={labelStyle}>
          بإنشاء الحساب أنتِ توافقين على{' '}
          <Link to="/terms" className="font-bold" style={{ color: 'var(--idh-navy-500)' }}>
            الشروط والأحكام
          </Link>{' '}
          و{' '}
          <Link to="/privacy" className="font-bold" style={{ color: 'var(--idh-navy-500)' }}>
            سياسة الخصوصية
          </Link>
        </p>
      </form>
    </div>
  )
}
