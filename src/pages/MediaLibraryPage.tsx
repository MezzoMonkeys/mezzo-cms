import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Image, Trash2, Link, Upload, Search, Folder, FolderPlus, X, AlertTriangle,
  CheckSquare, Square, Layers, Sparkles, Copy, RefreshCw,
} from 'lucide-react'
import {
  listMediaFiles, deleteMediaFiles, uploadFile, classifyError,
  listMediaAssets, upsertMediaAsset, deleteMediaAssets, getMediaReferences, getArticleMediaReferences,
  type MediaAssetMeta,
} from '@/lib/queries'

interface MediaFile {
  name: string
  id: string | null
  size: number
  mimeType: string
  updatedAt: string
  publicUrl: string
}

interface Usage { label: string; route: string | null }

// Merged view model: storage file + metadata + where it's used + duplicate flag.
interface Asset extends MediaFile {
  path: string
  folder: string
  title: string
  alt: string
  used: boolean
  usage: Usage[]
  isDup: boolean
}

const UNSORTED = 'Unsorted'
const MAX_DIM = 2400
const WEBP_QUALITY = 0.82

// media_references() reports the table a file is used in → friendly label.
const SOURCE_LABELS: Record<string, string> = {
  home_page: 'Home page', about_us_page: 'About page', our_work_page: 'Our Work page',
  pricing_page: 'Pricing page', insights_page: 'Insights page', contact_us_page: 'Contact page',
  service_cards: 'Service cards (Home)', client_showcase: 'Client showcase (Home)',
  client_logos: 'Client logos (Work)', portfolio_items: 'Portfolio (Work)',
  team_members: 'Team (About)', faq_items: 'FAQ (About)', enquiry_options: 'Enquiry options (Contact)',
  pricing_cards: 'Pricing', pricing_categories: 'Pricing',
  work_images: 'Work gallery', site_settings: 'Site settings', footer_links: 'Footer',
}

// Where each table is edited, so a usage chip can jump straight there.
// work_images is intentionally absent — it spans Home/About/Our Work.
const SOURCE_ROUTES: Record<string, string> = {
  home_page: '/home', about_us_page: '/about', our_work_page: '/work',
  pricing_page: '/pricing', insights_page: '/insights', contact_us_page: '/contact',
  service_cards: '/home', client_showcase: '/home',
  client_logos: '/work', portfolio_items: '/work',
  team_members: '/about', faq_items: '/about', enquiry_options: '/contact',
  pricing_cards: '/pricing', pricing_categories: '/pricing',
  site_settings: '/settings', footer_links: '/settings',
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}

function fileWarning(f: MediaFile): string | null {
  if (!isImage(f.mimeType)) return null
  const modern = ['image/webp', 'image/avif', 'image/svg+xml'].includes(f.mimeType)
  if (f.size > 400 * 1024) return `Large image (${fmtSize(f.size)}) — compress${modern ? '' : ' or convert to WebP'}`
  if (!modern && f.size > 200 * 1024) return `${fmtSize(f.size)} — consider WebP for faster loads`
  return null
}

// Strip the "<timestamp>-" upload prefix to compare original filenames.
function baseName(name: string) {
  return name.replace(/^\d+-/, '').toLowerCase()
}

// Re-encode images to WebP (and cap dimensions) before upload. Non-images,
// SVG and GIF pass through untouched. Falls back to the original on any error.
async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/webp', WEBP_QUALITY))
    if (!blob) return file
    if (blob.size >= file.size && scale === 1) return file // no gain, keep original
    const base = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
}

export default function MediaLibraryPage() {
  const navigate = useNavigate()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<Asset | null>(null)
  const [moveOpen, setMoveOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [dropActive, setDropActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [files, meta, refs, artRefs] = await Promise.all([
        listMediaFiles() as Promise<MediaFile[]>,
        listMediaAssets(),
        getMediaReferences(),
        getArticleMediaReferences(),
      ])
      const metaByPath = new Map(meta.map(m => [m.path, m]))
      const tablesByPath = new Map<string, Set<string>>()
      for (const r of refs) {
        const s = tablesByPath.get(r.path) ?? new Set<string>()
        s.add(r.source_table)
        tablesByPath.set(r.path, s)
      }
      const articlesByPath = new Map<string, { id: string; title: string }[]>()
      for (const r of artRefs) {
        const list = articlesByPath.get(r.path) ?? []
        list.push({ id: r.article_id, title: r.article_title || 'Untitled article' })
        articlesByPath.set(r.path, list)
      }

      // Duplicate keys: same original filename + same byte size.
      const dupCount = new Map<string, number>()
      files.forEach(f => {
        const k = `${f.size}:${baseName(f.name)}`
        dupCount.set(k, (dupCount.get(k) ?? 0) + 1)
      })

      const merged: Asset[] = files.map(f => {
        const path = `uploads/${f.name}`
        const m = metaByPath.get(path) as MediaAssetMeta | undefined
        const tables = tablesByPath.get(path) ?? new Set<string>()
        const usage: Usage[] = []
        const seen = new Set<string>()
        Array.from(tables).filter(t => t !== 'articles').forEach(t => {
          const label = SOURCE_LABELS[t] ?? t
          if (seen.has(label)) return
          seen.add(label)
          usage.push({ label, route: SOURCE_ROUTES[t] ?? null })
        })
        ;(articlesByPath.get(path) ?? []).forEach(a => usage.push({ label: a.title, route: `/articles/${a.id}` }))
        return {
          ...f,
          path,
          folder: m?.folder?.trim() || UNSORTED,
          title: m?.title ?? '',
          alt: m?.alt ?? '',
          used: tables.size > 0,
          usage,
          isDup: (dupCount.get(`${f.size}:${baseName(f.name)}`) ?? 0) > 1,
        }
      })
      setAssets(merged)
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setLoading(false)
    }
  }

  const folders = useMemo(
    () => Array.from(new Set(assets.map(a => a.folder))).filter(f => f !== UNSORTED).sort((a, b) => a.localeCompare(b)),
    [assets],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: assets.length, unused: 0, duplicates: 0, [UNSORTED]: 0 }
    assets.forEach(a => {
      if (!a.used) c.unused++
      if (a.isDup) c.duplicates++
      c[a.folder] = (c[a.folder] ?? 0) + 1
    })
    return c
  }, [assets])

  const currentFolder = view !== 'all' && view !== 'unused' && view !== 'duplicates' ? view : UNSORTED

  const visible = useMemo(() => {
    let list = assets
    if (view === 'unused') list = list.filter(a => !a.used)
    else if (view === 'duplicates') list = list.filter(a => a.isDup)
    else if (view !== 'all') list = list.filter(a => a.folder === view)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q))
    }
    return list
  }, [assets, view, search])

  async function uploadFiles(fileList: File[], folder: string) {
    if (fileList.length === 0) return
    setUploading(true)
    try {
      for (const raw of fileList) {
        const file = await optimizeImage(raw)
        const path = `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
        await uploadFile('media', path, file)
        if (folder && folder !== UNSORTED) await upsertMediaAsset(path, { folder })
      }
      toast.success(fileList.length > 1 ? `${fileList.length} files uploaded` : 'Uploaded')
      await load()
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function replaceFile(asset: Asset, file: File) {
    setUploading(true)
    try {
      const optimized = await optimizeImage(file)
      await uploadFile('media', asset.path, optimized) // same path → URL unchanged
      toast.success('Replaced — same URL, may take a moment to refresh from cache')
      setDetail(null)
      await load()
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(names: string[]) {
    try {
      await deleteMediaFiles(names)
      await deleteMediaAssets(names.map(n => `uploads/${n}`))
      setAssets(prev => prev.filter(a => !names.includes(a.name)))
      setSelected(new Set())
      setDetail(null)
      toast.success(names.length > 1 ? `${names.length} files deleted` : 'Deleted')
    } catch (err) {
      toast.error(classifyError(err))
    }
  }

  function confirmDelete(names: string[]) {
    const used = assets.filter(a => names.includes(a.name) && a.used)
    const warn = used.length
      ? `\n\n⚠ ${used.length} of these ${used.length > 1 ? 'are' : 'is'} still used on the site and will break where referenced.`
      : ''
    if (confirm(`Delete ${names.length} file${names.length > 1 ? 's' : ''}? This cannot be undone.${warn}`)) handleDelete(names)
  }

  function deleteUnused() {
    const names = assets.filter(a => !a.used).map(a => a.name)
    if (names.length === 0) { toast.success('Nothing unused — all clean!'); return }
    if (confirm(`Delete all ${names.length} unused file${names.length > 1 ? 's' : ''}? This cannot be undone.`)) handleDelete(names)
  }

  async function moveTo(folder: string, names: string[]) {
    const target = folder.trim() || UNSORTED
    try {
      await Promise.all(names.map(n => upsertMediaAsset(`uploads/${n}`, { folder: target === UNSORTED ? null : target })))
      setAssets(prev => prev.map(a => names.includes(a.name) ? { ...a, folder: target } : a))
      setSelected(new Set())
      setMoveOpen(false)
      if (detail && names.includes(detail.name)) setDetail({ ...detail, folder: target })
      toast.success(`Moved to ${target}`)
    } catch (err) {
      toast.error(classifyError(err))
    }
  }

  async function saveDetail(a: Asset, patch: { title: string; alt: string; folder: string }) {
    try {
      await upsertMediaAsset(a.path, {
        title: patch.title || null,
        alt: patch.alt || null,
        folder: patch.folder === UNSORTED ? null : patch.folder,
      })
      setAssets(prev => prev.map(x => x.name === a.name ? { ...x, ...patch } : x))
      setDetail(null)
      toast.success('Saved')
    } catch (err) {
      toast.error(classifyError(err))
    }
  }

  async function copyUrl(url: string, name: string) {
    await navigator.clipboard.writeText(url)
    setCopied(name)
    setTimeout(() => setCopied(null), 2000)
    toast.success('URL copied')
  }

  function toggleSelect(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function jump(route: string) {
    setDetail(null)
    navigate(route)
  }

  function onFolderDrop(folderKey: string, e: React.DragEvent) {
    e.preventDefault()
    const name = e.dataTransfer.getData('text/plain')
    if (!name) return
    const names = selected.has(name) ? Array.from(selected) : [name]
    moveTo(folderKey, names)
  }

  const navItem = (key: string, label: string, icon: React.ReactNode, count: number | undefined, droppable = false) => (
    <button
      key={key}
      onClick={() => { setView(key); setSelected(new Set()) }}
      onDragOver={droppable ? e => e.preventDefault() : undefined}
      onDrop={droppable ? e => onFolderDrop(key, e) : undefined}
      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        background: view === key ? 'var(--ci-hover)' : 'transparent',
        color: 'var(--ci-navy)',
        fontWeight: view === key ? 600 : 400,
      }}
    >
      <span className="flex items-center gap-2 truncate">{icon}<span className="truncate">{label}</span></span>
      {count !== undefined && <span className="text-xs" style={{ color: 'var(--ci-muted)' }}>{count}</span>}
    </button>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid var(--ci-border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ci-navy)' }}>Media Library</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--ci-muted)' }}>
            {assets.length} files · {counts.unused} unused
          </span>
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50"
            style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>
            <Upload size={14} />
            {uploading ? 'Working…' : 'Upload'}
          </button>
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={e => { uploadFiles(Array.from(e.target.files ?? []), currentFolder) }} />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Folder rail */}
        <aside className="w-56 flex-shrink-0 overflow-y-auto p-3 flex flex-col gap-1"
          style={{ background: '#ffffff', borderRight: '1px solid var(--ci-border)' }}>
          {navItem('all', 'All media', <Layers size={15} />, counts.all)}
          {navItem('unused', 'Unused', <Sparkles size={15} />, counts.unused)}
          {counts.duplicates > 0 && navItem('duplicates', 'Duplicates', <Copy size={15} />, counts.duplicates)}
          <div className="mx-1 my-2" style={{ borderTop: '1px solid var(--ci-border)' }} />
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ci-muted)' }}>
            Folders <span className="normal-case font-normal">· drag files here</span>
          </p>
          {navItem(UNSORTED, UNSORTED, <Folder size={15} />, counts[UNSORTED] ?? 0, true)}
          {folders.map(f => navItem(f, f, <Folder size={15} />, counts[f], true))}
          <button
            onClick={() => {
              const name = prompt('New folder name')?.trim()
              if (name) { setView(name); toast('Upload or drag files here to fill the folder', { icon: '📁' }) }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm mt-1" style={{ color: 'var(--ci-muted)' }}>
            <FolderPlus size={15} /> New folder
          </button>

          {counts.unused > 0 && (
            <button onClick={deleteUnused}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm mt-auto"
              style={{ color: '#b91c1c', border: '1px solid #fecaca', background: '#fef2f2' }}>
              <Trash2 size={14} /> Delete {counts.unused} unused
            </button>
          )}
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="px-8 py-3 flex items-center justify-between gap-4 flex-shrink-0"
            style={{ background: '#ffffff', borderBottom: '1px solid var(--ci-border)' }}>
            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ci-muted)' }} />
              <input type="text" placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                style={{ border: '1px solid var(--ci-border)', background: 'var(--ci-linen)', color: 'var(--ci-navy)' }} />
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--ci-muted)' }}>{selected.size} selected</span>
                <button onClick={() => setMoveOpen(true)} className="px-3 py-1.5 text-sm font-medium rounded-lg"
                  style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)' }}>Move to…</button>
                <button onClick={() => confirmDelete(Array.from(selected))} className="px-3 py-1.5 text-sm font-medium rounded-lg"
                  style={{ background: '#fee2e2', color: '#b91c1c' }}>Delete</button>
                <button onClick={() => setSelected(new Set())} className="text-sm" style={{ color: 'var(--ci-muted)' }}>Clear</button>
              </div>
            )}
          </div>

          {/* Grid (drop zone) */}
          <div
            className="flex-1 overflow-y-auto p-8 relative"
            onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropActive(true) } }}
            onDragLeave={e => { if (e.currentTarget === e.target) setDropActive(false) }}
            onDrop={e => {
              setDropActive(false)
              const dropped = Array.from(e.dataTransfer.files ?? [])
              if (dropped.length) { e.preventDefault(); uploadFiles(dropped, currentFolder) }
            }}
          >
            {dropActive && (
              <div className="absolute inset-4 z-20 rounded-2xl flex items-center justify-center pointer-events-none"
                style={{ border: '2px dashed #f4bf00', background: 'rgba(244,191,0,0.08)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--ci-navy)' }}>
                  Drop to upload into {currentFolder}
                </p>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }} />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Image size={40} style={{ color: 'var(--ci-border)' }} />
                <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>
                  {search ? 'No files match your search.' : 'Nothing here yet — upload or drag files in.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {visible.map(file => {
                  const warn = fileWarning(file)
                  const isSel = selected.has(file.name)
                  return (
                    <div key={file.name}
                      draggable
                      onDragStart={e => { e.dataTransfer.setData('text/plain', file.name); e.dataTransfer.effectAllowed = 'move' }}
                      onClick={() => setDetail(file)}
                      className="group relative rounded-xl overflow-hidden cursor-pointer"
                      style={{ border: isSel ? '2px solid #f4bf00' : '1px solid var(--ci-border)', background: '#f8f7f4', aspectRatio: '1' }}>
                      {isImage(file.mimeType) ? (
                        <img src={file.publicUrl} alt={file.title || file.name}
                          className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image size={32} style={{ color: 'var(--ci-muted)' }} />
                        </div>
                      )}

                      <button onClick={e => { e.stopPropagation(); toggleSelect(file.name) }}
                        className="absolute top-2 left-2 z-10 rounded"
                        style={{ color: isSel ? '#f4bf00' : '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
                        {isSel ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                        {!file.used && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(185,28,28,0.9)', color: '#fff' }}>UNUSED</span>
                        )}
                        {file.isDup && (
                          <span title="Possible duplicate (same name & size)" className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(30,64,175,0.9)', color: '#fff' }}>DUPLICATE</span>
                        )}
                        {warn && (
                          <span title={warn} className="w-5 h-5 flex items-center justify-center rounded"
                            style={{ background: 'rgba(180,83,9,0.9)', color: '#fff' }}>
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                        style={{ background: 'linear-gradient(transparent, rgba(15,28,69,0.9))' }}>
                        <p className="text-xs font-medium text-white truncate" title={file.name}>{file.title || file.name}</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {fmtSize(file.size)}{file.used ? ` · used in ${file.usage.length}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {detail && (
        <DetailModal
          key={detail.name}
          asset={detail}
          folders={folders}
          copied={copied === detail.name}
          busy={uploading}
          onCopy={() => copyUrl(detail.publicUrl, detail.name)}
          onSave={saveDetail}
          onReplace={file => replaceFile(detail, file)}
          onDelete={() => confirmDelete([detail.name])}
          onJump={jump}
          onClose={() => setDetail(null)}
        />
      )}

      {moveOpen && (
        <MoveModal count={selected.size} folders={folders}
          onMove={folder => moveTo(folder, Array.from(selected))} onClose={() => setMoveOpen(false)} />
      )}
    </div>
  )
}

// ── Detail / edit modal ─────────────────────────────────────────────────────────
function DetailModal({ asset, folders, copied, busy, onCopy, onSave, onReplace, onDelete, onJump, onClose }: {
  asset: Asset
  folders: string[]
  copied: boolean
  busy: boolean
  onCopy: () => void
  onSave: (a: Asset, patch: { title: string; alt: string; folder: string }) => void
  onReplace: (file: File) => void
  onDelete: () => void
  onJump: (route: string) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(asset.title)
  const [alt, setAlt] = useState(asset.alt)
  const [folder, setFolder] = useState(asset.folder)
  const replaceRef = useRef<HTMLInputElement>(null)

  const folderOptions = Array.from(new Set([UNSORTED, ...folders, folder])).filter(f => f !== '__new__')

  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col md:flex-row" style={{ maxHeight: '80vh' }}>
        <div className="md:w-80 flex-shrink-0 flex items-center justify-center p-4" style={{ background: '#f1efe8' }}>
          {isImage(asset.mimeType)
            ? <img src={asset.publicUrl} alt={asset.alt || asset.name} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
            : <Image size={64} style={{ color: 'var(--ci-muted)' }} />}
        </div>

        <div className="flex-1 p-6 overflow-y-auto" style={{ minWidth: 320 }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="text-sm font-medium break-all" style={{ color: 'var(--ci-navy)' }}>{asset.name}</p>
            <button onClick={onClose} style={{ color: 'var(--ci-muted)' }}><X size={18} /></button>
          </div>

          <p className="text-xs mb-4" style={{ color: 'var(--ci-muted)' }}>{fmtSize(asset.size)} · {asset.mimeType || 'file'}</p>

          {fileWarning(asset) && (
            <div className="flex items-start gap-2 text-xs mb-4 p-2 rounded-lg" style={{ background: '#fffbeb', color: '#92400e' }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /><span>{fileWarning(asset)}</span>
            </div>
          )}

          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--ci-muted)' }}>Where it's used</p>
            {asset.usage.length === 0 ? (
              <p className="text-sm" style={{ color: '#b91c1c' }}>Not used anywhere — safe to delete.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {asset.usage.map((u, i) => u.route ? (
                  <button key={i} onClick={() => onJump(u.route!)}
                    className="text-xs px-2 py-0.5 rounded-full transition-colors"
                    style={{ background: 'var(--ci-hover)', color: 'var(--ci-navy)', textDecoration: 'underline' }}
                    title={`Open ${u.label}`}>{u.label}</button>
                ) : (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--ci-hover)', color: 'var(--ci-navy)' }}>{u.label}</span>
                ))}
              </div>
            )}
          </div>

          <Field label="Title (internal)">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Meissen brass mixer" style={inputStyle} />
          </Field>
          <Field label="Default alt text">
            <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Describes the image for SEO & accessibility" style={inputStyle} />
          </Field>
          <Field label="Folder">
            <select value={folder} onChange={e => setFolder(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {folderOptions.map(f => <option key={f} value={f}>{f}</option>)}
              <option value="__new__">+ New folder…</option>
            </select>
          </Field>
          {folder === '__new__' && (
            <input autoFocus placeholder="New folder name" style={inputStyle}
              onKeyDown={e => { if (e.key === 'Enter') setFolder((e.target as HTMLInputElement).value.trim() || UNSORTED) }}
              onBlur={e => setFolder(e.target.value.trim() || UNSORTED)} />
          )}

          <div className="flex items-center gap-2 mt-6 flex-wrap">
            <button onClick={() => onSave(asset, { title, alt, folder: folder === '__new__' ? UNSORTED : folder })}
              className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>Save</button>
            <button onClick={onCopy} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--ci-border)', color: copied ? '#166534' : 'var(--ci-navy)' }}>
              <Link size={14} /> {copied ? 'Copied' : 'Copy URL'}
            </button>
            {isImage(asset.mimeType) && (
              <>
                <button onClick={() => replaceRef.current?.click()} disabled={busy}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg disabled:opacity-50"
                  style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)' }}>
                  <RefreshCw size={14} /> Replace
                </button>
                <input ref={replaceRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onReplace(f); e.currentTarget.value = '' }} />
              </>
            )}
            <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg ml-auto"
              style={{ color: '#b91c1c' }}><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

// ── Move-to-folder modal (bulk) ─────────────────────────────────────────────────
function MoveModal({ count, folders, onMove, onClose }: {
  count: number
  folders: string[]
  onMove: (folder: string) => void
  onClose: () => void
}) {
  const [folder, setFolder] = useState(folders[0] ?? UNSORTED)
  const [custom, setCustom] = useState('')
  return (
    <Overlay onClose={onClose}>
      <div className="p-6" style={{ minWidth: 340 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ci-navy)' }}>Move {count} file{count > 1 ? 's' : ''} to…</h2>
          <button onClick={onClose} style={{ color: 'var(--ci-muted)' }}><X size={18} /></button>
        </div>
        <Field label="Existing folder">
          <select value={folder} onChange={e => setFolder(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value={UNSORTED}>{UNSORTED}</option>
            {folders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="…or new folder">
          <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Type a new folder name" style={inputStyle} />
        </Field>
        <button onClick={() => onMove(custom.trim() || folder)}
          className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg w-full" style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>Move</button>
      </div>
    </Overlay>
  )
}

// ── Shared bits ─────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,28,69,0.45)' }}>
      <div onClick={e => e.stopPropagation()} className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <label className="text-xs font-medium" style={{ color: 'var(--ci-navy)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--ci-border)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--ci-navy)',
  outline: 'none',
  width: '100%',
}