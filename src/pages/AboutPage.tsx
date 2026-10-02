import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { IdhButton } from '../brand/Button'
import logoStacked from '../assets/logo/idhonat-stacked-navy-on-white.svg'
import { ReviewServiceError, submitReview } from '../services/reviewService'

const labelStyle = { color: 'var(--idh-ink-2)' }

export default function AboutPage() {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function handleSubmitReview() {
    if (rating === 0) return
    setSubmitting(true)
    setMessage(null)
    try {
      await submitReview(rating, comment)
      setMessage({ type: 'success', text: 'شكرًا لتقييمك! 🌟' })
      setComment('')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ReviewServiceError ? err.message : 'تعذّر إرسال التقييم' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center text-center gap-4 pt-8">
        <img src={logoStacked} alt="إذونات" className="h-28" />
        <p className="text-sm" style={labelStyle}>
          نظام حساب وإدارة أذونات الموظفين
          <br />
          خاص بمنسوبي وزارة التربية بدولة الكويت
        </p>
        <p className="text-sm font-bold" style={{ color: 'var(--idh-navy-900)' }}>
          تم إعداد وتطوير هذا البرنامج بواسطة المعلمة نورا العبدالله
        </p>
        <p className="text-xs" style={labelStyle}>
          الإصدار 0.1.0
        </p>

        <div className="w-full bg-white p-4 space-y-3 text-right" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}>
          <h2 className="font-bold text-sm">قيّمي التطبيق</h2>
          <div className="flex justify-center gap-1 text-3xl" style={{ color: 'var(--idh-navy-900)' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} نجوم`}
                onClick={() => setRating(n)}
                style={{ opacity: n <= rating ? 1 : 0.25 }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            placeholder="تعليق اختياري..."
            className="w-full p-3 border outline-none text-sm"
            style={{ borderRadius: 'var(--idh-r-md)', borderColor: 'var(--idh-silver)' }}
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {message && (
            <p className="text-sm font-bold text-center" style={{ color: message.type === 'error' ? 'var(--idh-rejected)' : 'var(--idh-approved)' }}>
              {message.text}
            </p>
          )}
          <IdhButton variant="primary" block disabled={rating === 0} loading={submitting} onClick={handleSubmitReview}>
            إرسال التقييم
          </IdhButton>
        </div>
      </div>
    </AppShell>
  )
}
