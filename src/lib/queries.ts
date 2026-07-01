import { supabase } from './supabase'
import type { Status, UserRole, Site, UserWithAccess, Invitation } from './types'

type Table = string

// ── Error classifier ──────────────────────────────────────────────────────────
// Maps specific DB check-constraint names to plain-English messages. Add a line
// here whenever you add a CHECK constraint an editor could realistically trip.
const CONSTRAINT_MESSAGES: Record<string, string> = {
  articles_excerpt_check: 'Excerpt is too long — please keep it under 300 characters.',
}

// Supabase/PostgREST errors are thrown as plain objects, not Error instances,
// so pull the message/code/details out of whatever shape we're handed.
function errParts(err: unknown): { message: string; code: string; details: string } {
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; code?: unknown; details?: unknown }
    return {
      message: typeof e.message === 'string' ? e.message : '',
      code: typeof e.code === 'string' ? e.code : '',
      details: typeof e.details === 'string' ? e.details : '',
    }
  }
  if (typeof err === 'string') return { message: err, code: '', details: '' }
  return { message: '', code: '', details: '' }
}

// Turn any thrown error into a clear, non-technical message safe to show an editor.
export function classifyError(err: unknown): string {
  const { message: m, code, details } = errParts(err)
  const lower = m.toLowerCase()

  // Connectivity
  if (m.includes('Failed to fetch') || m.includes('NetworkError') || lower.includes('network error'))
    return 'Network error — check your connection and try again.'
  if (m.includes('Failed to send a request to the Edge Function'))
    return 'Could not reach the server — please try again in a moment.'
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'The request timed out — please try again.'

  // Auth / session
  if (m.includes('JWT') || lower.includes('invalid api key'))
    return 'Your session has expired — refresh the page and sign in again.'
  if (lower.includes('invalid login credentials'))
    return 'Incorrect email or password.'
  if (lower.includes('email not confirmed'))
    return 'This account hasn’t been activated yet.'
  if (lower.includes('already registered') || lower.includes('already been registered') || lower.includes('email_exists'))
    return 'An account with that email already exists.'
  if (lower.includes('should be at least') && lower.includes('password'))
    return m // Supabase's own readable "Password should be at least N characters."
  if (lower.includes('different from the old') || lower.includes('same_password'))
    return 'Your new password must be different from your current one.'
  if (lower.includes('reauthentication') || lower.includes('requires a recent login'))
    return 'For security, sign out and back in, then change your password.'

  // Permissions
  if (lower.includes('row-level security') || lower.includes('permission denied') || code === '42501' || code.startsWith('PGRST'))
    return 'You don’t have permission to do that.'

  // Postgres constraint violations (arrive as plain objects with a numeric code)
  if (code === '23514' || lower.includes('violates check constraint')) {
    for (const [name, msg] of Object.entries(CONSTRAINT_MESSAGES)) {
      if (m.includes(name)) return msg
    }
    return 'One of the fields has a value that isn’t allowed — please review and try again.'
  }
  if (code === '23505' || lower.includes('duplicate key') || lower.includes('unique constraint')) {
    if (lower.includes('slug')) return 'That URL slug is already used — please choose a different one.'
    return 'This already exists — a duplicate isn’t allowed.'
  }
  if (code === '23503' || lower.includes('foreign key'))
    return 'This item is still linked to something else, so it can’t be removed.'
  if (code === '23502' || lower.includes('null value') || lower.includes('not-null')) {
    const col = m.match(/column "([^"]+)"/)?.[1] ?? details.match(/column "([^"]+)"/)?.[1]
    return col ? `Please fill in the required field: ${col.replace(/_/g, ' ')}.` : 'Please fill in all required fields.'
  }
  if (code === '22001' || lower.includes('value too long'))
    return 'One of the fields is too long — please shorten it.'

  // Readable, non-technical messages pass through; anything SQL-ish gets a safe generic.
  const looksTechnical = /relation|constraint|column|syntax|violates|postgres|\bsql\b|pgrst/i.test(m)
  if (m && !looksTechnical && m.length < 160) return m
  return 'Something went wrong — please try again. If it keeps happening, let the studio know.'
}

// ── Current user ID helper ────────────────────────────────────────────────────
async function currentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ── Page CRUD ─────────────────────────────────────────────────────────────────
export async function getSingletonPage(table: Table) {
  const { data, error } = await supabase.from(table).select('*').limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSingletonPage(table: Table, data: Record<string, unknown>) {
  const uid = await currentUserId()
  const payload = { ...data }
  if (!payload.id) delete payload.id
  if (!payload.created_at) delete payload.created_at
  payload.updated_at = new Date().toISOString()
  if (uid) payload.updated_by = uid
  const { data: result, error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return result
}

export async function getChildItems(table: Table) {
  const { data, error } = await supabase.from(table).select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getWorkImages(page: 'home' | 'about' | 'our-work') {
  const { data, error } = await supabase
    .from('work_images')
    .select('*')
    .eq('page', page)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function upsertChildItem(table: Table, data: Record<string, unknown>) {
  const { data: result, error } = await supabase.from(table).upsert(data).select().single()
  if (error) throw error
  return result
}

// Batch upsert — reports partial failures instead of silently swallowing them
export async function upsertChildItems(
  table: Table,
  items: Record<string, unknown>[],
): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(items.map(item => upsertChildItem(table, item)))
  const errors: string[] = []
  let failed = 0
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      failed++
      errors.push(`Item ${i + 1}: ${classifyError(r.reason)}`)
    }
  })
  return { succeeded: results.length - failed, failed, errors }
}

export async function deleteChildItem(table: Table, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

// ── Articles ──────────────────────────────────────────────────────────────────
export async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, article_title, slug, status, publish_date, category, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getArticle(id: string) {
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createArticle(data: Record<string, unknown>) {
  const uid = await currentUserId()
  const { id, created_at, updated_at, ...rest } = data
  void id; void created_at; void updated_at
  const payload: Record<string, unknown> = {
    ...rest,
    updated_at: new Date().toISOString(),
    ...(uid ? { created_by: uid, updated_by: uid } : {}),
  }
  const { data: result, error } = await supabase.from('articles').insert(payload).select().single()
  if (error) throw error
  return result
}

export async function updateArticle(id: string, data: Record<string, unknown>) {
  const uid = await currentUserId()
  const { data: result, error } = await supabase
    .from('articles')
    .update({ ...data, updated_at: new Date().toISOString(), ...(uid ? { updated_by: uid } : {}) })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return result
}

export async function deleteArticle(id: string) {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}

export async function duplicateArticle(id: string) {
  const original = await getArticle(id)
  return createArticle({
    ...original,
    article_title: `Copy of ${original.article_title}`,
    slug: `copy-of-${original.slug}`,
    status: 'draft',
    published_at: null,
    scheduled_at: null,
  })
}

export async function publishRecord(table: Table, id: string, status: Status) {
  const uid = await currentUserId()
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    ...(uid ? { updated_by: uid } : {}),
  }
  if (status === 'published') updates.published_at = new Date().toISOString()
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── Storage ───────────────────────────────────────────────────────────────────
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

// ── Media library ─────────────────────────────────────────────────────────────
export async function listMediaFiles() {
  const { data, error } = await supabase.storage
    .from('media')
    .list('uploads', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) throw error
  return (data ?? []).map(f => ({
    name: f.name,
    id: f.id,
    size: f.metadata?.size ?? 0,
    mimeType: f.metadata?.mimetype ?? '',
    updatedAt: f.updated_at ?? '',
    publicUrl: supabase.storage.from('media').getPublicUrl(`uploads/${f.name}`).data.publicUrl,
  }))
}

export async function deleteMediaFile(name: string) {
  const { error } = await supabase.storage.from('media').remove([`uploads/${name}`])
  if (error) throw error
}

export async function deleteMediaFiles(names: string[]) {
  if (names.length === 0) return
  const { error } = await supabase.storage.from('media').remove(names.map(n => `uploads/${n}`))
  if (error) throw error
}

// ── Media metadata: virtual folders, title, alt (path = "uploads/<file>") ───────
export interface MediaAssetMeta { path: string; folder: string | null; title: string | null; alt: string | null }
export interface MediaReference { path: string; source_table: string }

export async function listMediaAssets(): Promise<MediaAssetMeta[]> {
  const { data, error } = await supabase.from('media_assets').select('path, folder, title, alt')
  if (error) throw error
  return (data ?? []) as MediaAssetMeta[]
}

export async function upsertMediaAsset(
  path: string,
  patch: { folder?: string | null; title?: string | null; alt?: string | null },
) {
  const { error } = await supabase
    .from('media_assets')
    .upsert({ path, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'path' })
  if (error) throw error
}

export async function deleteMediaAssets(paths: string[]) {
  if (paths.length === 0) return
  const { error } = await supabase.from('media_assets').delete().in('path', paths)
  if (error) throw error
}

// Every "uploads/…" path referenced anywhere in content, with its source table.
export async function getMediaReferences(): Promise<MediaReference[]> {
  const { data, error } = await supabase.rpc('media_references')
  if (error) throw error
  return (data ?? []) as MediaReference[]
}

// ── Contact submissions ───────────────────────────────────────────────────────
export async function getContactSubmissions() {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateSubmissionStatus(
  id: string,
  status: 'new' | 'read' | 'replied' | 'archived',
) {
  const updates: Record<string, unknown> = { status }
  if (status === 'read') updates.read_at = new Date().toISOString()
  if (status === 'replied') updates.replied_at = new Date().toISOString()
  const { error } = await supabase.from('contact_submissions').update(updates).eq('id', id)
  if (error) throw error
}

// ── Sites ─────────────────────────────────────────────────────────────────────
export async function getSites(): Promise<Site[]> {
  const { data, error } = await supabase.from('sites').select('*').order('name')
  if (error) throw error
  return data ?? []
}

// ── User management (admin only) ──────────────────────────────────────────────
export async function getUsers(): Promise<UserWithAccess[]> {
  const [{ data: profiles, error: pErr }, { data: accesses, error: aErr }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('user_site_access').select('user_id, site_id'),
  ])
  if (pErr) throw pErr
  if (aErr) throw aErr
  return (profiles ?? []).map(p => ({
    ...p,
    site_ids: (accesses ?? []).filter(a => a.user_id === p.id).map(a => a.site_id),
  }))
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw error
}

export async function updateUserStatus(userId: string, status: 'active' | 'disabled') {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
  if (error) throw error
}

export async function setUserSiteAccess(userId: string, siteIds: string[]) {
  const { error: delErr } = await supabase.from('user_site_access').delete().eq('user_id', userId)
  if (delErr) throw delErr
  if (siteIds.length === 0) return
  const { error: insErr } = await supabase
    .from('user_site_access')
    .insert(siteIds.map(site_id => ({ user_id: userId, site_id })))
  if (insErr) throw insErr
}

// ── Invitations ───────────────────────────────────────────────────────────────
export async function getPendingInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createInvitation(
  email: string,
  role: UserRole,
  siteIds: string[],
  invitedBy: string,
): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({ email, role, site_ids: siteIds, invited_by: invitedBy })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function revokeInvitation(id: string) {
  const { error } = await supabase.from('invitations').delete().eq('id', id)
  if (error) throw error
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function acceptInvitation(
  token: string,
  userId: string,
  fullName: string,
  role: UserRole,
  siteIds: string[],
) {
  await supabase.from('profiles').upsert({ id: userId, full_name: fullName, role, status: 'active' })
  await setUserSiteAccess(userId, siteIds)
  await supabase.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('token', token)
}

// ── Send invite (calls Edge Function) ────────────────────────────────────────
export async function sendInvite(email: string, role: UserRole, siteIds: string[]): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { data, error } = await supabase.functions.invoke('send-invite', {
    body: {
      email,
      role,
      siteIds,
      redirectTo: `${window.location.origin}/accept-invite`,
    },
  })

  if (error) {
    // FunctionsHttpError — extract JSON body for the precise server-side message
    const ctx = (error as unknown as { context?: Response }).context
    if (ctx instanceof Response) {
      try {
        const body = await ctx.clone().json()
        throw new Error(body?.error ?? error.message)
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr !== error) throw parseErr
      }
    }
    throw error
  }

  if (data?.error) throw new Error(data.error)
}

// ── Profile self-service ──────────────────────────────────────────────────────
export async function updateProfile(userId: string, updates: { full_name?: string }) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
