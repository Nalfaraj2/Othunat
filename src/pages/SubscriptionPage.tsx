import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { IdhButton } from '../brand/Button'
import {
  getMySubscription,
  getYearlyOffering,
  isNativePlatform,
  purchaseYearlyPackage,
  restorePurchases,
  SubscriptionServiceError,
} from '../services/subscriptionService'
import type { PurchasesOffering } from '@revenuecat/purchases-capacitor'

const labelStyle = { color: 'var(--idh-ink-2)' }

export default function SubscriptionPage() {
  const [status, setStatus] = useState<{ status: string; expiresAt: string | null } | null>(null)
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getMySubscription().then(setStatus).catch(() => {})
    if (isNativePlatform()) {
      getYearlyOffering().then(setOffering).catch(() => {})
    }
  }, [])

  async function handlePurchase() {
    if (!offering) return
    setError(null)
    setBusy(true)
    try {
      await purchaseYearlyPackage(offering)
      setStatus(await getMySubscription())
    } catch (err) {
      setError(err instanceof SubscriptionServiceError ? err.message : 'تعذّرت عملية الشراء')
    } finally {
      setBusy(false)
    }
  }

  async function handleRestore() {
    setError(null)
    setBusy(true)
    try {
      await restorePurchases()
      setStatus(await getMySubscription())
    } catch (err) {
      setError(err instanceof SubscriptionServiceError ? err.message : 'تعذّرت استعادة المشتريات')
    } finally {
      setBusy(false)
    }
  }

  const isActive = status?.status === 'active'
  const yearlyPackage = offering?.annual ?? offering?.availablePackages[0]

  return (
    <AppShell>
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
          الاشتراك
        </h1>

        <div
          className="p-5 text-white space-y-2"
          style={{ background: 'var(--idh-navy-900)', borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-2)' }}
        >
          <div className="text-sm opacity-80">الحالة الحالية</div>
          <div className="text-2xl font-extrabold">
            {isActive ? 'اشتراك نشط ✓' : 'غير مشترك'}
          </div>
          {status?.expiresAt && (
            <div className="text-xs opacity-70">ينتهي في {new Date(status.expiresAt).toLocaleDateString('ar')}</div>
          )}
        </div>

        {!isNativePlatform() && (
          <div className="bg-white p-4 text-sm" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)', ...labelStyle }}>
            الاشتراك متاح فقط من داخل تطبيق الجوال (آيفون أو أندرويد)، وليس من نسخة الويب.
          </div>
        )}

        {isNativePlatform() && (
          <div className="bg-white p-4 space-y-4" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}>
            <div>
              <div className="font-bold">اشتراك سنوي</div>
              <div className="text-sm" style={labelStyle}>
                {yearlyPackage ? yearlyPackage.product.priceString : '...جارٍ التحميل'} / سنة
              </div>
            </div>

            {error && (
              <p className="text-sm font-bold" style={{ color: 'var(--idh-rejected)' }}>
                {error}
              </p>
            )}

            <IdhButton variant="primary" block loading={busy} disabled={!yearlyPackage} onClick={handlePurchase}>
              اشتراك الآن
            </IdhButton>
            <IdhButton variant="ghost" block loading={busy} onClick={handleRestore}>
              استعادة المشتريات
            </IdhButton>

            <p className="text-xs text-center" style={labelStyle}>
              بالاشتراك أنتِ توافقين على{' '}
              <Link to="/terms" className="font-bold" style={{ color: 'var(--idh-navy-500)' }}>
                الشروط والأحكام
              </Link>{' '}
              و{' '}
              <Link to="/privacy" className="font-bold" style={{ color: 'var(--idh-navy-500)' }}>
                سياسة الخصوصية
              </Link>
              . يتجدد الاشتراك تلقائيًا سنويًا ما لم تُلغيه من إعدادات حساب المتجر قبل التجديد.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
