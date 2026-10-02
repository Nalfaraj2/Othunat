import { supabase } from '../lib/supabaseClient'

export class ReviewServiceError extends Error {}

export async function submitReview(rating: number, comment?: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new ReviewServiceError('يجب تسجيل الدخول أولًا')

  const { error } = await supabase
    .from('app_reviews')
    .insert({ user_id: userData.user.id, rating, comment: comment || null })

  if (error) throw new ReviewServiceError(error.message)
}
