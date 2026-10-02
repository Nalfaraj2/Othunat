// إذونات — RevenueCat webhook receiver.
//
// Deploy: supabase functions deploy revenuecat-webhook
// Then set the same value in two places:
//   1. supabase secrets set REVENUECAT_WEBHOOK_SECRET=<a long random string you generate>
//   2. RevenueCat dashboard -> Project -> Integrations -> Webhooks -> Authorization header
//      (RevenueCat sends it back verbatim on every call; we just compare it below)
//
// This is the ONLY writer of the subscriptions table (see 0004_subscriptions.sql) — it uses
// the service role key, which never appears in client code.
//
// Requires appUserID passed to Purchases.configure() on the client to be the Supabase auth
// user's id (see src/services/subscriptionService.ts), so event.app_user_id below maps
// directly to subscriptions.user_id with no lookup table needed.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ACTIVE_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'])
const EXPIRED_EVENTS = new Set(['EXPIRATION'])
const CANCELLED_EVENTS = new Set(['CANCELLATION'])

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (WEBHOOK_SECRET && req.headers.get('Authorization') !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const event = body?.event
  const appUserId: string | undefined = event?.app_user_id
  const eventType: string | undefined = event?.type

  if (!appUserId || !eventType) {
    return new Response('Missing app_user_id or type', { status: 400 })
  }

  let status: 'active' | 'expired' | 'cancelled' | null = null
  if (ACTIVE_EVENTS.has(eventType)) status = 'active'
  else if (EXPIRED_EVENTS.has(eventType)) status = 'expired'
  else if (CANCELLED_EVENTS.has(eventType)) status = 'cancelled'

  if (!status) {
    // Other event types (BILLING_ISSUE, TRANSFER, etc.) are acknowledged but ignored for now.
    return new Response('Ignored', { status: 200 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: appUserId,
    status,
    product_id: event.product_id ?? null,
    expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('subscriptions upsert failed', error)
    return new Response('Internal error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
})
