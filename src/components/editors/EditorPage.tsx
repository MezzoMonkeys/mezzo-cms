import { useState, useEffect, useCallback, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { getSingletonPage, upsertSingletonPage } from '@/lib/queries'
import type { PageRecord, Status } from '@/lib/types'
import ContentHeader from '@/components/layout/ContentHeader'
import TabBar from './TabBar'
import SeoTab from './SeoTab'
import AeoTab from './AeoTab'
import GeoTab from './GeoTab'

const SITE_URL = 'https://mezzo-html-mezzomonkeys-projects.vercel.app'

const TABS = [
  { id: 'content', label: 'Content' },
  { id: 'seo', label: 'SEO' },
  { id: 'aeo', label: 'AEO' },
  { id: 'geo', label: 'GEO' },
]

interface Props<T extends PageRecord> {
  table: string
  title: string
  defaultData: T
  previewPath: string
  children: (data: T, onChange: (patch: Partial<T>) => void) => ReactNode
}

export default function EditorPage<T extends PageRecord>({
  table,
  title,
  defaultData,
  previewPath,
  children,
}: Props<T>) {
  const [data, setData] = useState<T>(defaultData)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content')

  useEffect(() => {
    getSingletonPage(table)
      .then(row => { if (row) setData(row as T) })
      .catch(() => toast.error('Failed to load page data'))
      .finally(() => setLoading(false))
  }, [table])

  const patch = useCallback((p: Partial<T>) => {
    setData(prev => ({ ...prev, ...p }))
  }, [])

  async function save(status: Status) {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { ...data, status }
      if (status === 'published') payload.published_at = new Date().toISOString()
      const result = await upsertSingletonPage(table, payload)
      setData(result as T)
      return true
    } catch (err) {
      toast.error('Save failed')
      console.error(err)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    const ok = await save('draft')
    if (ok) toast.success('Saved')
  }

  async function handleSaveAndPreview() {
    const ok = await save('draft')
    if (ok) {
      toast.success('Saved — opening preview')
      window.open(`${SITE_URL}${previewPath}`, '_blank')
    }
  }

  async function handleSaveAndPublish() {
    const ok = await save('published')
    if (ok) toast.success('Published')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ContentHeader
        title={title}
        status={data.status}
        saving={saving}
        onSave={handleSave}
        onSaveAndPreview={handleSaveAndPreview}
        onSaveAndPublish={handleSaveAndPublish}
      />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {activeTab === 'content' && children(data, patch)}
          {activeTab === 'seo' && <SeoTab data={data} onChange={patch} />}
          {activeTab === 'aeo' && <AeoTab data={data} onChange={patch} />}
          {activeTab === 'geo' && <GeoTab data={data} onChange={patch} />}
        </div>
      </div>
    </div>
  )
}
