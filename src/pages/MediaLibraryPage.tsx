import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Image, Trash2, Link, Upload, Search } from 'lucide-react'
import { listMediaFiles, deleteMediaFile, uploadFile, classifyError } from '@/lib/queries'

interface MediaFile {
  name: string
  id: string | null
  size: number
  mimeType: string
  updatedAt: string
  publicUrl: string
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await listMediaFiles()
      setFiles(data as MediaFile[])
    } catch {
      toast.error('Failed to load media files')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadFile('media', `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`, file)
      toast.success('Uploaded')
      await load()
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(name)
    try {
      await deleteMediaFile(name)
      setFiles(prev => prev.filter(f => f.name !== name))
      toast.success('Deleted')
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setDeleting(null)
    }
  }

  async function handleCopy(url: string, name: string) {
    await navigator.clipboard.writeText(url)
    setCopied(name)
    setTimeout(() => setCopied(null), 2000)
    toast.success('URL copied')
  }

  const filtered = search
    ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : files

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid var(--ci-border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ci-navy)' }}>Media Library</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--ci-muted)' }}>{files.length} files</span>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50"
            style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-3 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid var(--ci-border)' }}>
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ci-muted)' }} />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ border: '1px solid var(--ci-border)', background: 'var(--ci-linen)', color: 'var(--ci-navy)' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--ci-border)')}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Image size={40} style={{ color: 'var(--ci-border)' }} />
            <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>
              {search ? 'No files match your search.' : 'No files uploaded yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {filtered.map(file => (
              <div key={file.name} className="group relative rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--ci-border)', background: '#f8f7f4', aspectRatio: '1' }}>
                {/* Thumbnail */}
                {isImage(file.mimeType) ? (
                  <img src={file.publicUrl} alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={32} style={{ color: 'var(--ci-muted)' }} />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2"
                  style={{ background: 'rgba(15,28,69,0.82)' }}>
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => handleCopy(file.publicUrl, file.name)}
                      title="Copy URL"
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                      style={{ background: copied === file.name ? '#f4bf00' : 'rgba(255,255,255,0.15)', color: copied === file.name ? 'var(--ci-navy)' : '#fff' }}>
                      <Link size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(file.name)}
                      disabled={deleting === file.name}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{fmtSize(file.size)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}