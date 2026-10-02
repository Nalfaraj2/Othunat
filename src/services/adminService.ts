import { supabase } from '../lib/supabaseClient'

export class AdminServiceError extends Error {}

export interface AppSettings {
  standard_start: string
  shift_length_minutes: number
  flex_floor: string
  flex_ceiling: string
  total_monthly_minutes: number
  max_permissions: number
}

export interface AdminSubscriptionRow {
  user_id: string
  status: string
  product_id: string | null
  expires_at: string | null
  full_name: string
  civil_id: string
}

export interface AdminReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  full_name: string
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
  return data?.role === 'admin'
}

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', true).single()
  if (error) throw new AdminServiceError(error.message)
  return data
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
  const { error } = await supabase.from('app_settings').update(settings).eq('id', true)
  if (error) throw new AdminServiceError(error.message)
}

export async function listAllSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id, status, product_id, expires_at, profiles!inner(full_name, civil_id)')
    .order('updated_at', { ascending: false })

  if (error) throw new AdminServiceError(error.message)
  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      user_id: row.user_id,
      status: row.status,
      product_id: row.product_id,
      expires_at: row.expires_at,
      full_name: profile?.full_name ?? '—',
      civil_id: profile?.civil_id ?? '—',
    }
  })
}

export async function listAllReviews(): Promise<AdminReviewRow[]> {
  const { data, error } = await supabase
    .from('app_reviews')
    .select('id, rating, comment, created_at, profiles!inner(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw new AdminServiceError(error.message)
  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      full_name: profile?.full_name ?? '—',
    }
  })
}
