import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { IdhButton } from '../brand/Button'
import { AppShell } from '../components/AppShell'
import { FilePicker } from '../components/FilePicker'
import {
  attachPhotoToPermission,
  createMedicalPermission,
  createPermission,
  PermissionsServiceError,
  uploadPhoto,
} from '../services/permissionsService'

type FormType = 'morning' | 'end_of_day' | 'medical'

const TYPE_LABELS: Record<FormType, string> = {
  morning: 'إذن صباحي',
  end_of_day: 'إذن آخر الدوام',
  medical: 'إذن طبي',
}

const today = new Date().toISOString().slice(0, 10)
const inputStyle = { borderRadius: 'var(--idh-r-md)', borderColor: 'var(--idh-silver)' }
const labelStyle = { color: 'var(--idh-ink-2)' }

export default function NewPermissionPage() {
  const navigate = useNavigate()
  const [type, setType] = useState<FormType>('morning')
  const [date, setDate] = useState(today)
  const [entryTime, setEntryTime] = useState('')
  const [exitTime, setExitTime] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleCancel() {
    // Go back to wherever the user came from; fall back to home if this page was opened directly.
    if (window.history.length > 1) navigate(-1)
    else navigate('/', { replace: true })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (type === 'medical') {
        const storagePath = photo ? await uploadPhoto(photo) : undefined
        await createMedicalPermission({ permissionDate: date, notes: notes || undefined, storagePath })
      } else {
        const permission = await createPermission({
          permissionType: type,
          permissionDate: date,
          entryTime,
          exitTime: type === 'end_of_day' ? exitTime : undefined,
        })
        if (photo) {
          const storagePath = await uploadPhoto(photo)
          await attachPhotoToPermission(permission.id, storagePath)
        }
      }
      navigate('/permissions')
    } catch (err) {
      setError(err instanceof PermissionsServiceError ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="space-y-5">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
          إضافة إذن
        </h1>

        <div className="idh-seg w-full">
          {(Object.keys(TYPE_LABELS) as FormType[]).map((t) => (
            <button
              type="button"
              key={t}
              className="flex-1"
              aria-pressed={type === t}
              onClick={() => setType(t)}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="bg-white p-4 space-y-4" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}>
          <label className="block">
            <span className="text-sm font-bold" style={labelStyle}>التاريخ</span>
            <input
              type="date"
              required
              className="mt-1 w-full p-3 border outline-none"
              style={inputStyle}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          {type !== 'medical' && (
            <label className="block">
              <span className="text-sm font-bold" style={labelStyle}>وقت توقيع الدخول</span>
              <input
                type="time"
                required
                className="mt-1 w-full p-3 border outline-none"
                style={inputStyle}
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
              />
            </label>
          )}

          {type === 'end_of_day' && (
            <label className="block">
              <span className="text-sm font-bold" style={labelStyle}>وقت توقيع الخروج</span>
              <input
                type="time"
                required
                className="mt-1 w-full p-3 border outline-none"
                style={inputStyle}
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
              />
            </label>
          )}

          {type === 'medical' && (
            <label className="block">
              <span className="text-sm font-bold" style={labelStyle}>ملاحظات (اختياري)</span>
              <textarea
                className="mt-1 w-full p-3 border outline-none"
                style={inputStyle}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          )}

          <div>
            <span className="text-sm font-bold block mb-1" style={labelStyle}>
              مرفق إثبات (اختياري) {type !== 'medical' && '— صورة البصمة'}
            </span>
            <FilePicker file={photo} onChange={setPhoto} />
          </div>
        </div>

        {error && (
          <p className="text-sm font-bold" style={{ color: 'var(--idh-rejected)' }}>
            {error}
          </p>
        )}

        <div className="space-y-3">
          <IdhButton type="submit" variant="primary" size="lg" block loading={submitting}>
            حفظ الإذن
          </IdhButton>
          <IdhButton type="button" variant="secondary" size="lg" block disabled={submitting} onClick={handleCancel}>
            إلغاء
          </IdhButton>
        </div>
      </form>
    </AppShell>
  )
}
