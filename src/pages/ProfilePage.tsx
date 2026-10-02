import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { IdhButton } from '../brand/Button'
import { AuthServiceError, changePassword, deleteMyAccount, signOut } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/database'

const inputStyle = { borderRadius: 'var(--idh-r-md)', borderColor: 'var(--idh-silver)' }
const labelStyle = { color: 'var(--idh-ink-2)' }

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteArmed, setDeleteArmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleDeleteClick() {
    if (!deleteArmed) {
      setDeleteArmed(true)
      disarmTimer.current = setTimeout(() => setDeleteArmed(false), 4000)
      return
    }
    if (disarmTimer.current) clearTimeout(disarmTimer.current)
    setDeleteError(null)
    setDeleting(true)
    deleteMyAccount()
      .then(() => navigate('/login', { replace: true }))
      .catch((err) => {
        setDeleteError(err instanceof AuthServiceError ? err.message : 'تعذّر حذف الحساب، حاولي مرة أخرى')
        setDeleteArmed(false)
        setDeleting(false)
      })
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      setProfile(p)
    })
  }, [])

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof AuthServiceError ? err.message : 'حدث خطأ غير متوقع' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
          حسابي
        </h1>

        <div className="bg-white p-4 space-y-2" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}>
          <div className="flex justify-between text-sm">
            <span style={labelStyle}>الاسم</span>
            <span className="font-bold">{profile?.full_name ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={labelStyle}>الرقم المدني</span>
            <span className="font-bold">{profile?.civil_id ?? '—'}</span>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="bg-white p-4 space-y-3" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}>
          <h2 className="font-bold text-sm">تغيير كلمة المرور</h2>
          <label className="block">
            <span className="text-sm font-bold" style={labelStyle}>كلمة المرور الحالية</span>
            <input
              type="password"
              required
              className="mt-1 w-full p-3 border outline-none"
              style={inputStyle}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold" style={labelStyle}>كلمة المرور الجديدة</span>
            <input
              type="password"
              required
              minLength={8}
              className="mt-1 w-full p-3 border outline-none"
              style={inputStyle}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>

          {message && (
            <p className="text-sm font-bold" style={{ color: message.type === 'error' ? 'var(--idh-rejected)' : 'var(--idh-approved)' }}>
              {message.text}
            </p>
          )}

          <IdhButton type="submit" variant="secondary" block loading={submitting}>
            تحديث كلمة المرور
          </IdhButton>
        </form>

        <IdhButton variant="secondary" block onClick={() => navigate('/subscription')}>
          الاشتراك
        </IdhButton>

        {profile?.role === 'admin' && (
          <IdhButton variant="secondary" block onClick={() => navigate('/admin')}>
            لوحة الأدمن
          </IdhButton>
        )}

        <IdhButton variant="reject" block onClick={() => signOut().then(() => window.location.assign('/login'))}>
          تسجيل الخروج
        </IdhButton>

        <div className="bg-white p-4 space-y-3" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--idh-rejected)' }}>
            منطقة الخطر
          </h2>
          <p className="text-xs" style={labelStyle}>
            حذف الحساب نهائي ويمسح جميع بياناتك (الأذونات، السجل، الملفات المرفقة) ولا يمكن التراجع عنه.
          </p>
          {deleteError && (
            <p className="text-sm font-bold" style={{ color: 'var(--idh-rejected)' }}>
              {deleteError}
            </p>
          )}
          <IdhButton
            variant="reject"
            block
            loading={deleting}
            onClick={handleDeleteClick}
            style={deleteArmed ? { background: 'var(--idh-rejected)', color: '#fff' } : undefined}
          >
            {deleteArmed ? 'اضغطي مرة ثانية للتأكيد النهائي' : 'حذف الحساب نهائيًا'}
          </IdhButton>
        </div>

        <Link to="/about" className="block text-center text-sm font-bold" style={{ color: 'var(--idh-navy-500)' }}>
          عن التطبيق
        </Link>
        <Link to="/privacy" className="block text-center text-sm font-bold" style={{ color: 'var(--idh-navy-500)' }}>
          سياسة الخصوصية والشروط والأحكام
        </Link>
      </div>
    </AppShell>
  )
}
