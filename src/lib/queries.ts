import { supabase } from './supabase'
import type { Status } from './types'

type Table = string

export async function getSingletonPage(table: Table) {
  const { data, error } = await supabase.from(table).select('*').limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSingletonPage(table: Table, data: Record<string, unknown>) {
  const payload = { ...data }
  if (!payload.id) delete payload.id
  if (!payload.created_at) delete payload.created_at
  if (!payload.updated_at) delete payload.updated_at
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
  const { data: result, error } = await supabase.from(table).upsert(data).select().single()
  if (error) throw error
  return result
}

export async function deleteChildItem(table: Table, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

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
  const { data: result, error } = await supabase.from('articles').insert(data).select().single()
  if (error) throw error
  return result
}

export async function updateArticle(id: string, data: Record<string, unknown>) {
  const { data: result, error } = await supabase
    .from('articles')
    .update({ ...data, updated_at: new Date().toISOString() })
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
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'published') updates.published_at = new Date().toISOString()
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

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
