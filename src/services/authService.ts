import { supabase } from '../lib/supabaseClient'

export class AuthServiceError extends Error {}

async function resolveEmail(civilId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_email_by_civil_id', { p_civil_id: civilId })
  if (error) throw new AuthServiceError(error.message)
  if (!data) throw new AuthServiceError('لا يوجد حساب مسجّل بهذا الرقم المدني')
  return data as string
}

export async function signUp(params: {
  civilId: string
  fullName: string
  email: string
  password: string
}) {
  const { civilId, fullName, email, password } = params

  if (!/^\d{12}$/.test(civilId)) {
    throw new AuthServiceError('الرقم المدني يجب أن يتكون من ١٢ رقمًا')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { civil_id: civilId, full_name: fullName },
    },
  })

  if (error) throw new AuthServiceError(error.message)
  return data
}

export async function signInWithCivilId(civilId: string, password: string) {
  const email = await resolveEmail(civilId)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new AuthServiceError('الرقم المدني أو كلمة المرور غير صحيحة')
  return data
}

export async function requestPasswordReset(civilId: string, redirectTo?: string) {
  const email = await resolveEmail(civilId)
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw new AuthServiceError(error.message)
}

export async function changePassword(params: { currentPassword: string; newPassword: string }) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user?.email) {
    throw new AuthServiceError('يجب تسجيل الدخول أولًا')
  }

  // Re-authenticate with the current password before allowing the change.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: params.currentPassword,
  })
  if (reauthError) throw new AuthServiceError('كلمة المرور الحالية غير صحيحة')

  const { error } = await supabase.auth.updateUser({ password: params.newPassword })
  if (error) throw new AuthServiceError(error.message)
}

/** The signed-in user's full name, or null if there's no session / profile. */
export async function getMyFullName(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null
  const { data } = await supabase.from('profiles').select('full_name').eq('id', userData.user.id).maybeSingle()
  return data?.full_name ?? null
}

/** Permanently deletes the current user's account and all their data (cascades in the DB). */
export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw new AuthServiceError(error.message)
  await supabase.auth.signOut()
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new AuthServiceError(error.message)
}
