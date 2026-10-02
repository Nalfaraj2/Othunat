import { supabase } from '../lib/supabaseClient'
import type { MedicalPermission, MonthlyBalance, Permission, PermissionType } from '../types/database'

const ATTACHMENTS_BUCKET = 'attachments'
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export class PermissionsServiceError extends Error {}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new PermissionsServiceError(error.message)
  return data as T
}

export async function listPermissions(): Promise<Permission[]> {
  const res = await supabase
    .from('permissions')
    .select('*')
    .order('permission_date', { ascending: false })
  return unwrap(res) ?? []
}

export async function createPermission(params: {
  permissionType: PermissionType
  permissionDate: string // YYYY-MM-DD
  entryTime: string // HH:MM
  exitTime?: string // HH:MM, required for end_of_day
}): Promise<Permission> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new PermissionsServiceError('يجب تسجيل الدخول أولًا')

  // duration_minutes is sent as 0 and always recomputed server-side by permissions_before_write_trg —
  // the client's value is never trusted.
  const res = await supabase
    .from('permissions')
    .insert({
      user_id: userData.user.id,
      permission_type: params.permissionType,
      permission_date: params.permissionDate,
      entry_time: params.entryTime,
      exit_time: params.exitTime ?? null,
      duration_minutes: 0,
    })
    .select('*')
    .single()

  return unwrap(res)
}

export async function cancelPermission(id: string): Promise<void> {
  const res = await supabase.from('permissions').update({ status: 'cancelled' }).eq('id', id).select('id').single()
  unwrap(res)
}

export async function deletePermission(id: string): Promise<void> {
  const { error } = await supabase.from('permissions').delete().eq('id', id)
  if (error) throw new PermissionsServiceError(error.message)
}

export async function getMonthlyBalance(year: number, month: number): Promise<MonthlyBalance | null> {
  const { data, error } = await supabase
    .from('monthly_balances')
    .select('*')
    .eq('balance_year', year)
    .eq('balance_month', month)
    .maybeSingle()

  if (error) throw new PermissionsServiceError(error.message)
  return data
}

export async function listMedicalPermissions(): Promise<MedicalPermission[]> {
  const res = await supabase
    .from('medical_permissions')
    .select('*')
    .order('permission_date', { ascending: false })
  return unwrap(res) ?? []
}

/** Uploads a photo (e.g. a fingerprint sign-in screenshot) and returns its storage path. */
export async function uploadPhoto(file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new PermissionsServiceError('يجب تسجيل الدخول أولًا')

  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new PermissionsServiceError('حجم الملف أكبر من 10 ميغابايت')
  }

  // Storage object keys must be plain ASCII (Arabic names / spaces are rejected), so never reuse
  // the original file name — only its safe extension.
  const ext = file.name.includes('.')
    ? (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
    : ''
  const path = `${userData.user.id}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`
  const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, { contentType: file.type || undefined })
  if (error) throw new PermissionsServiceError(error.message)
  return path
}

export async function attachPhotoToPermission(permissionId: string, storagePath: string): Promise<void> {
  const { error } = await supabase.from('attachments').insert({ permission_id: permissionId, storage_path: storagePath })
  if (error) throw new PermissionsServiceError(error.message)
}

export async function getPhotoSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrl(storagePath, 3600)
  if (error) throw new PermissionsServiceError(error.message)
  return data.signedUrl
}

export async function listAttachments(permissionId: string): Promise<{ id: string; storage_path: string }[]> {
  const res = await supabase.from('attachments').select('id, storage_path').eq('permission_id', permissionId)
  return unwrap(res) ?? []
}

export async function createMedicalPermission(params: {
  permissionDate: string
  notes?: string
  storagePath?: string
}): Promise<MedicalPermission> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new PermissionsServiceError('يجب تسجيل الدخول أولًا')

  const res = await supabase
    .from('medical_permissions')
    .insert({
      user_id: userData.user.id,
      permission_date: params.permissionDate,
      notes: params.notes ?? null,
      storage_path: params.storagePath ?? null,
    })
    .select('*')
    .single()

  return unwrap(res)
}
