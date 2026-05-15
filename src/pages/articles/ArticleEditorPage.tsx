import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { getArticle, createArticle, updateArticle } from '@/lib/queries'
import ContentHeader from '@/components/layout/ContentHeader'
import TabBar from '@/components/editors/TabBar'
import SeoTab from '@/components/editors/SeoTab'
import AeoTab from '@/components/editors/AeoTab'
import GeoTab from '@/components/editors/GeoTab'
import { TextField, TextareaField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import BlockEditor from '@/components/editors/BlockEditor'
import type { Article, Status } from '@/lib/types'

const TABS = [
  { id: 'content', label: 'Content' },
  { id: 'seo', label: 'SEO' },
  { id: 'aeo', label: 'AEO' },
  { id: 'geo', label: 'GEO' },
]

const DEFAULT: Article = {
  id: '', status: 'draft', published_at: null, scheduled_at: null,
  created_by: null, updated_by: null, created_at: '', updated_at: '',
  seo_title: null, seo_description: null, og_image: null, og_image_alt: '',
  canonical_url: null, no_index: false, no_follow: false,
  aeo_primary_question: null, aeo_direct_answer: null, aeo_faq_blocks: [], aeo_speakable_content: null,
  geo_topic_clusters: [], geo_entity_mentions: [], geo_ai_summary: null, geo_llms_txt_flag: true,
  article_title: '', slug: '', publish_date: null,
  featured_image_url: null, featured_image_alt: '',
  excerpt: null, content_blocks: [], category: null,
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [data, setData] = useState<Article>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [activeTab, setActiveTab] = useState('content')
  const [slugManual, setSlugManual] = useState(false)

  useEffect(() => {
    if (!isNew && id) {
      getArticle(id)
        .then(row => { if (row) setData(row as Article) })
        .catch(() => toast.error('Failed to load article'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const patch = useCallback((p: Partial<Article>) => {
    setData(prev => {
      const next = { ...prev, ...p }
      if ('article_title' in p && !slugManual) {
        next.slug = slugify(p.article_title ?? '')
      }
      return next
    })
  }, [slugManual])

  async function save(status?: Status) {
    if (!data.article_title.trim()) {
      toast.error('Article title is required')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
      }
      if (status) {
        payload.status = status
        if (status === 'published') payload.published_at = new Date().toISOString()
      }

      if (isNew) {
        payload.created_at = new Date().toISOString()
        const result = await createArticle(payload)
        toast.success('Article created')
        navigate(`/articles/${(result as Article).id}`, { replace: true })
      } else {
        const result = await updateArticle(data.id, payload)
        setData(result as Article)
        toast.success(status === 'published' ? 'Published' : 'Saved')
      }
    } catch (err) {
      toast.error('Save failed')
      console.error(err)
    } finally {
      setSaving(false)
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
      <ContentHeader
        title={isNew ? 'New Article' : (data.article_title || 'Untitled')}
        status={data.status}
        saving={saving}
        onSave={() => save('draft')}
        onSaveAndPreview={async () => {
          await save('draft')
          if (data.slug) window.open(`https://mezzo-html-mezzomonkeys-projects.vercel.app/insights/${data.slug}`, '_blank')
        }}
        onSaveAndPublish={() => save('published')}
      />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <button onClick={() => navigate('/articles')}
            className="flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: '#6b6b6b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#111111')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b6b')}>
            <ArrowLeft size={14} /> Back to articles
          </button>

          {activeTab === 'content' && (
            <div className="flex flex-col gap-8">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
                  style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
                  Article Details
                </h3>
                <div className="flex flex-col gap-5">
                  <TextField label="Article Title" required
                    value={data.article_title}
                    onChange={e => patch({ article_title: e.target.value })} />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: '#2b2b2b' }}>Slug</label>
                    <div className="flex gap-2">
                      <input type="text" value={data.slug}
                        onChange={e => { setSlugManual(true); patch({ slug: slugify(e.target.value) }) }}
                        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none font-mono"
                        style={{ border: '1px solid #e8e8e8', background: '#f7f7f7', color: '#2b2b2b' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#e8e8e8')} />
                      {slugManual && (
                        <button onClick={() => { setSlugManual(false); patch({ slug: slugify(data.article_title) }) }}
                          className="text-xs px-3 rounded-lg"
                          style={{ border: '1px solid #e8e8e8', color: '#6b6b6b', background: '#ffffff' }}>
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <TextField label="Publish Date" type="date"
                      value={data.publish_date ?? ''}
                      onChange={e => patch({ publish_date: e.target.value })} />
                    <TextField label="Category"
                      hint="e.g. Brand Strategy, Digital Marketing"
                      value={data.category ?? ''}
                      onChange={e => patch({ category: e.target.value })} />
                  </div>

                  <TextareaField label="Excerpt" rows={3}
                    hint="Short summary shown on the insights listing page"
                    value={data.excerpt ?? ''}
                    onChange={e => patch({ excerpt: e.target.value })} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
                  style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
                  Featured Image
                </h3>
                <ImageUpload label="Featured Image"
                  value={data.featured_image_url} altValue={data.featured_image_alt}
                  onChange={url => patch({ featured_image_url: url })}
                  onAltChange={alt => patch({ featured_image_alt: alt })} required />
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
                  style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
                  Article Content
                </h3>
                <BlockEditor value={data.content_blocks}
                  onChange={blocks => patch({ content_blocks: blocks })} />
              </section>
            </div>
          )}

          {activeTab === 'seo' && <SeoTab data={data} onChange={patch} />}
          {activeTab === 'aeo' && <AeoTab data={data} onChange={patch} />}
          {activeTab === 'geo' && <GeoTab data={data} onChange={patch} />}
        </div>
      </div>
    </div>
  )
}
