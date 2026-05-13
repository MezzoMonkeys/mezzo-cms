import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { getSingletonPage, upsertSingletonPage, getChildItems, upsertChildItem, deleteChildItem } from '@/lib/queries'
import { TextField, TextareaField, SelectField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import type { SiteSettings, FooterLink } from '@/lib/types'

const DEFAULT_SETTINGS: SiteSettings = {
  id: '', copyright_text: null, footer_description: null,
  instagram_url: null, linkedin_url: null, facebook_url: null,
  instagram_icon: null, linkedin_icon: null, facebook_icon: null,
  updated_by: null, updated_at: '',
}

export default function SiteSettingsEditor() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [links, setLinks] = useState<FooterLink[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSingletonPage('site_settings'),
      getChildItems('footer_links'),
    ])
      .then(([s, l]) => {
        if (s) setSettings(s as SiteSettings)
        setLinks(l as FooterLink[])
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const patch = useCallback((p: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...p }))
  }, [])

  async function save() {
    setSaving(true)
    try {
      await upsertSingletonPage('site_settings', settings as Record<string, unknown>)
      await Promise.all(links.map(link => upsertChildItem('footer_links', link as Record<string, unknown>)))
      toast.success('Settings saved')
    } catch (err) {
      toast.error('Save failed')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function addLink() {
    setLinks(prev => [...prev, {
      id: crypto.randomUUID(),
      name: '', url: '', target: '_self', sort_order: prev.length,
    }])
  }

  function updateLink(i: number, patch: Partial<FooterLink>) {
    setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }

  async function removeLink(link: FooterLink, i: number) {
    setLinks(prev => prev.filter((_, idx) => idx !== i))
    if (link.id) {
      await deleteChildItem('footer_links', link.id).catch(() => null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8' }}>
        <h1 className="text-lg font-semibold" style={{ color: '#111111' }}>Site Settings</h1>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50"
          style={{ background: '#f4bf00', color: '#111111' }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Footer
            </h3>
            <div className="flex flex-col gap-5">
              <TextField label="Copyright Text"
                value={settings.copyright_text ?? ''}
                onChange={e => patch({ copyright_text: e.target.value })} />
              <TextareaField label="Footer Description" rows={3}
                value={settings.footer_description ?? ''}
                onChange={e => patch({ footer_description: e.target.value })} />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid #e8e8e8' }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
                Footer Navigation Links
              </h3>
              <button onClick={addLink}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: '#111111', color: '#f7f7f7' }}>
                <Plus size={12} /> Add Link
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {links.map((link, i) => (
                <div key={link.id} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ border: '1px solid #e8e8e8', background: '#ffffff' }}>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <TextField label="Link Text" value={link.name}
                      onChange={e => updateLink(i, { name: e.target.value })} />
                    <TextField label="URL" value={link.url}
                      onChange={e => updateLink(i, { url: e.target.value })} />
                    <SelectField label="Opens in" value={link.target}
                      onChange={v => updateLink(i, { target: v as '_self' | '_blank' })}
                      options={[{ value: '_self', label: 'Same tab' }, { value: '_blank', label: 'New tab' }]} />
                  </div>
                  <button onClick={() => removeLink(link, i)} className="mt-6 w-7 h-7 flex items-center justify-center rounded-lg"
                    style={{ color: '#6b6b6b' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6b6b' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {links.length === 0 && <p className="text-sm" style={{ color: '#6b6b6b' }}>No footer links yet.</p>}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Social Media
            </h3>
            <div className="flex flex-col gap-6">
              {([
                ['instagram', 'Instagram'],
                ['linkedin', 'LinkedIn'],
                ['facebook', 'Facebook'],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-3">
                  <p className="text-sm font-medium" style={{ color: '#2b2b2b' }}>{label}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ImageUpload
                      label={`${label} Icon`}
                      value={(settings as Record<string, string | null>)[`${key}_icon`]}
                      altValue=""
                      onChange={url => patch({ [`${key}_icon`]: url } as Partial<SiteSettings>)}
                      onAltChange={() => null}
                    />
                    <TextField label={`${label} URL`} type="url"
                      value={(settings as Record<string, string | null>)[`${key}_url`] ?? ''}
                      onChange={e => patch({ [`${key}_url`]: e.target.value } as Partial<SiteSettings>)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
