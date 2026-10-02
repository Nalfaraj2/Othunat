import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoStacked from '../assets/logo/idhonat-stacked-navy-on-white.svg'
import { IdhButton } from '../brand/Button'
import { PasswordInput } from '../components/PasswordInput'
import { getRememberMe, getRememberedCivilId, setRememberedCivilId, setRememberMe } from '../lib/supabaseClient'
import { AuthServiceError, signInWithCivilId } from '../services/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const [civilId, setCivilId] = useState(getRememberedCivilId)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(getRememberMe)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Must be set before sign-in so the session is written to the right storage.
      setRememberMe(remember)
      await signInWithCivilId(civilId, password)
      setRememberedCivilId(remember ? civilId : null)
      navigate('/')
    } catch (err) {
      setError(err instanceof AuthServiceError ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = { borderRadius: 'var(--idh-r-md)', borderColor: 'var(--idh-silver)' }

  return (
    <div className="min-h-dvh flex items-center justify-center px-page pt-page pb-page" style={{ background: 'var(--idh-mist)' }} dir="rtl">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 space-y-5"
        style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <img src={logoStacked} alt="إذونات" className="h-24" />
          <p className="text-sm" style={{ color: 'var(--idh-ink-2)' }}>
            نظام حساب وإدارة أذونات الموظفين
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-bold" style={{ color: 'var(--idh-ink-2)' }}>
            الرقم المدني
          </span>
          <input
            name="civil_id"
            className="mt-1 w-full p-3 border outline-none"
            style={inputStyle}
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            required
            value={civilId}
            onChange={(e) => setCivilId(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold" style={{ color: 'var(--idh-ink-2)' }}>
            كلمة المرور
          </span>
          <PasswordInput
            name="password"
            className="mt-1 w-full p-3 border outline-none"
            style={inputStyle}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--idh-ink-2)' }}>
          <input
            type="checkbox"
            className="w-4 h-4"
            style={{ accentColor: 'var(--idh-navy-900)' }}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          تذكرني
        </label>

        {error && (
          <p className="text-sm font-bold" style={{ color: 'var(--idh-rejected)' }}>
            {error}
          </p>
        )}

        <IdhButton type="submit" variant="primary" size="lg" block loading={submitting}>
          دخول
        </IdhButton>

        <p className="text-sm text-center" style={{ color: 'var(--idh-ink-2)' }}>
          ما عندك حساب؟{' '}
          <Link to="/register" className="font-bold" style={{ color: 'var(--idh-navy-900)' }}>
            إنشاء حساب
          </Link>
        </p>
      </form>
    </div>
  )
}
