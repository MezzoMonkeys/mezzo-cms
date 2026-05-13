import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, FileText } from 'lucide-react'
import { getArticles, deleteArticle } from '@/lib/queries'
import type { Status } from '@/lib/types'

interface ArticleSummary {
  id: string
  article_title: string
  slug: string
  status: Status
  publish_date: string | null
  category: string | null
  created_at: string
}

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#6b6b6b', bg: '#f0f0f0' },
  published: { label: 'Published', color: '#166534', bg: '#dcfce7' },
  scheduled: { label: 'Scheduled', color: '#1e40af', bg: '#dbeafe' },
}

type Filter = Status | 'all'

export default function ArticlesListPage() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<ArticleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    getArticles()
      .then(data => setArticles(data as ArticleSummary[]))
      .catch(() => toast.error('Failed to load articles'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await deleteArticle(id)
      setArticles(prev => prev.filter(a => a.id !== id))
      toast.success('Article deleted')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = filter === 'all' ? articles : articles.filter(a => a.status === filter)

  const counts = {
    all: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    scheduled: articles.filter(a => a.status === 'scheduled').length,
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8' }}>
        <h1 className="text-lg font-semibold" style={{ color: '#111111' }}>Articles</h1>
        <button onClick={() => navigate('/articles/new')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg"
          style={{ background: '#f4bf00', color: '#111111' }}>
          <Plus size={15} /> New Article
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 px-8"
        style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8' }}>
        {(['all', 'published', 'draft', 'scheduled'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="relative px-4 py-3 text-sm font-medium capitalize transition-colors"
            style={{ color: filter === f ? '#111111' : '#6b6b6b', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            {f} <span className="ml-1 text-xs" style={{ color: '#6b6b6b' }}>({counts[f]})</span>
            {filter === f && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: '#f4bf00' }} />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <FileText size={40} style={{ color: '#e8e8e8' }} />
            <p className="text-sm" style={{ color: '#6b6b6b' }}>
              {filter === 'all' ? 'No articles yet.' : `No ${filter} articles.`}
            </p>
            {filter === 'all' && (
              <button onClick={() => navigate('/articles/new')}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
                style={{ background: '#111111', color: '#f7f7f7' }}>
                <Plus size={14} /> Write your first article
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                {['Title', 'Category', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-8 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#6b6b6b', background: '#fafafa' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(article => {
                const s = statusConfig[article.status]
                return (
                  <tr key={article.id}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid #f0f0f0' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => navigate(`/articles/${article.id}`)}>
                    <td className="px-8 py-4">
                      <span className="text-sm font-medium" style={{ color: '#111111' }}>
                        {article.article_title}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm" style={{ color: '#6b6b6b' }}>
                        {article.category ?? '—'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: s.color, background: s.bg }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm" style={{ color: '#6b6b6b' }}>
                        {article.publish_date ?? new Date(article.created_at).toLocaleDateString('en-AU')}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2 justify-end" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/articles/${article.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: '#6b6b6b' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f7'; e.currentTarget.style.color = '#111111' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6b6b' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(article.id, article.article_title)}
                          disabled={deleting === article.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: '#6b6b6b' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6b6b' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
