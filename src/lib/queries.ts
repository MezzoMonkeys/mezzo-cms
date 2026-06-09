import { supabase } from './supabase'
import type { Status, UserRole, Site, UserWithAccess, Invitation } from './types'

type Table = string

// ── Error classifier ──────────────────────────────────────────────────────────
export function classifyError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message
    if (m.includes('Failed to fetch') || m.includes('NetworkError')) return 'Network error — check your connection'
    if (m.includes('JWT') || m.includes('invalid api key')) return 'Session expired — please refresh'
    if (m.includes('row-level security') || m.includes('permission denied')) return "You don't have permission to do that"
    if (m.includes('23505') || m.toLowerCase().includes('unique')) return 'Duplicate entry — this already exists'
    if (m.includes('23503') || m.toLowerCase().includes('foreign key')) return 'Cannot delete — other items depend on this'
    if (m.includes('timeout')) return 'Request timed out — try again'
    return m
  }
  return 'An unexpected error occurred'
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

export async function getWorkImages(page: 'home' | 'about') {
  const { data, error } = await supabase
    .from('work_images')
    .select('*')
    .eq('page', page)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function upsertChildItem(table: Table, data: Record<string, unknown>) {
  const uid = await currentUserId()
  const payload = { ...data }
  if (uid) {
    payload.updated_by = uid
    if (!payload.id) payload.created_by = uid
  }
  const { data: result, error } = await supabase.from(table).upsert(payload).select().single()
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
  if (error) throw error
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
