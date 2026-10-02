import { Capacitor } from '@capacitor/core'
import { Purchases, type PurchasesOffering } from '@revenuecat/purchases-capacitor'
import { supabase } from '../lib/supabaseClient'

export class SubscriptionServiceError extends Error {}

// Real subscriptions only exist through the App Store / Google Play, so this whole SDK is
// native-only — RevenueCat has no meaningful web implementation for actual purchases. Every
// exported function below no-ops (or explains itself) when running in a browser tab.
export const isNativePlatform = () => Capacitor.isNativePlatform()

let configured = false

/**
 * Configures RevenueCat with the current Supabase user's id as the RevenueCat appUserID, so the
 * revenuecat-webhook Edge Function can write straight to subscriptions.user_id with no lookup.
 * Call once after login, on native platforms only.
 */
export async function configureSubscriptions() {
  if (!isNativePlatform() || configured) return

  const apiKey = Capacitor.getPlatform() === 'ios'
    ? import.meta.env.VITE_REVENUECAT_IOS_KEY
    : import.meta.env.VITE_REVENUECAT_ANDROID_KEY

  if (!apiKey) {
    console.warn('RevenueCat API key missing — subscriptions disabled until VITE_REVENUECAT_*_KEY is set.')
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  await Purchases.configure({ apiKey, appUserID: userData.user.id })
  configured = true
}

export async function getYearlyOffering(): Promise<PurchasesOffering | null> {
  if (!isNativePlatform()) return null
  const offerings = await Purchases.getOfferings()
  return offerings.current ?? null
}

export async function purchaseYearlyPackage(offering: PurchasesOffering) {
  const pkg = offering.annual ?? offering.availablePackages[0]
  if (!pkg) throw new SubscriptionServiceError('لا يوجد باقة اشتراك متاحة حاليًا')
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return customerInfo
}

export async function restorePurchases() {
  if (!isNativePlatform()) throw new SubscriptionServiceError('استعادة المشتريات متاحة فقط من تطبيق الجوال')
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo
}

export async function getMySubscription(): Promise<{ status: string; expiresAt: string | null } | null> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (error) throw new SubscriptionServiceError(error.message)
  if (!data) return { status: 'inactive', expiresAt: null }
  return { status: data.status, expiresAt: data.expires_at }
}
