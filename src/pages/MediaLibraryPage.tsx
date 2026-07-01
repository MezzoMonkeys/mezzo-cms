import { useState, useEffect, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  Image, Trash2, Link, Upload, Search, Folder, FolderPlus, X, AlertTriangle,
  CheckSquare, Square, Layers, Sparkles,
} from 'lucide-react'
import {
  listMediaFiles, deleteMediaFiles, uploadFile, classifyError,
  listMediaAssets, upsertMediaAsset, deleteMediaAssets, getMediaReferences,
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

// Merged view model: a storage file + its metadata + where it's referenced.
interface Asset extends MediaFile {
  path: string
  folder: string
  title: string
  alt: string
  usedIn: string[]
}

const UNSORTED = 'Unsorted'

// Friendly names for the tables media_references() reports.
const SOURCE_LABELS: Record<string, string> = {
  home_page: 'Home page',
  about_us_page: 'About page',
  our_work_page: 'Our Work page',
  pricing_page: 'Pricing page',
  insights_page: 'Insights page',
  contact_us_page: 'Contact page',
  articles: 'Articles',
  service_cards: 'Service cards',
  portfolio_items: 'Portfolio',
  client_logos: 'Client logos',
  client_showcase: 'Client showcase',
  work_images: 'Work gallery',
  team_members: 'Team',
  site_settings: 'Site settings',
  footer_links: 'Footer',
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}

// Advisory warning for heavy or un-optimised images.
function fileWarning(f: MediaFile): string | null {
  if (!isImage(f.mimeType)) return null
  const modern = ['image/webp', 'image/avif', 'image/svg+xml'].includes(f.mimeType)
  if (f.size > 400 * 1024) return `Large image (${fmtSize(f.size)}) — compress${modern ? '' : ' or convert to WebP'}`
  if (!modern && f.size > 200 * 1024) return `${fmtSize(f.size)} — consider WebP for faster loads`
  return null
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<string>('all') // 'all' | 'unused' | 'Unsorted' | <folder>
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<Asset | null>(null)
  const [moveOpen, setMoveOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [files, meta, refs] = await Promise.all([
        listMediaFiles() as Promise<MediaFile[]>,
        listMediaAssets(),
        getMediaReferences(),
      ])
      const metaByPath = new Map(meta.map(m => [m.path, m]))
      const refsByPath = new Map<string, Set<string>>()
      for (const r of refs) {
        const set = refsByPath.get(r.path) ?? new Set<string>()
        set.add(SOURCE_LABELS[r.source_table] ?? r.source_table)
        refsByPath.set(r.path, set)
      }
      const merged: Asset[] = files.map(f => {
        const path = `uploads/${f.name}`
        const m = metaByPath.get(path) as MediaAssetMeta | undefined
        return {
          ...f,
          path,
          folder: m?.folder?.trim() || UNSORTED,
          title: m?.title ?? '',
          alt: m?.alt ?? '',
          usedIn: Array.from(refsByPath.get(path) ?? []).sort(),
        }
      })
      setAssets(merged)
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setLoading(false)
    }
  }

  const folders = useMemo(() => {
    const set = new Set<string>()
    assets.forEach(a => set.add(a.folder))
    const named = Array.from(set).filter(f => f !== UNSORTED).sort((a, b) => a.localeCompare(b))
    return named
  }, [assets])

  const counts = useMemo(() => {
    const c = { all: assets.length, unused: 0, [UNSORTED]: 0 } as Record<string, number>
    assets.forEach(a => {
      if (a.usedIn.length === 0) c.unused++
      c[a.folder] = (c[a.folder] ?? 0) + 1
    })
    return c
  }, [assets])

  const visible = useMemo(() => {
    let list = assets
    if (view === 'unused') list = list.filter(a => a.usedIn.length === 0)
    else if (view !== 'all') list = list.filter(a => a.folder === view)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q))
    }
    return list
  }, [assets, view, search])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const folder = view !== 'all' && view !== 'unused' ? view : UNSORTED
      for (const file of files) {
        const path = `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
        await uploadFile('media', path, file)
        if (folder !== UNSORTED) await upsertMediaAsset(path, { folder })
      }
      toast.success(files.length > 1 ? `${files.length} files uploaded` : 'Uploaded')
      await load()
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
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
    const used = assets.filter(a => names.includes(a.name) && a.usedIn.length > 0)
    const warn = used.length
      ? `\n\n⚠ ${used.length} of these ${used.length > 1 ? 'are' : 'is'} still used on the site and will break where referenced.`
      : ''
    if (confirm(`Delete ${names.length} file${names.length > 1 ? 's' : ''}? This cannot be undone.${warn}`)) {
      handleDelete(names)
    }
  }

  function deleteUnused() {
    const names = assets.filter(a => a.usedIn.length === 0).map(a => a.name)
    if (names.length === 0) { toast.success('Nothing unused — all clean!'); return }
    if (confirm(`Delete all ${names.length} unused file${names.length > 1 ? 's' : ''}? This cannot be undone.`)) {
      handleDelete(names)
    }
  }

  async function moveTo(folder: string, names: string[]) {
    const target = folder.trim() || UNSORTED
    try {
      await Promise.all(names.map(n => upsertMediaAsset(`uploads/${n}`, { folder: target === UNSORTED ? null : target })))
      setAssets(prev => prev.map(a => names.includes(a.name) ? { ...a, folder: target } : a))
      setSelected(new Set())
      setMoveOpen(false)
      if (detail) setDetail({ ...detail, folder: target })
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

  const navItem = (key: string, label: string, icon: React.ReactNode, count?: number) => (
    <button
      onClick={() => { setView(key); setSelected(new Set()) }}
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
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Folder rail */}
        <aside className="w-56 flex-shrink-0 overflow-y-auto p-3 flex flex-col gap-1"
          style={{ background: '#ffffff', borderRight: '1px solid var(--ci-border)' }}>
          {navItem('all', 'All media', <Layers size={15} />, counts.all)}
          {navItem('unused', 'Unused', <Sparkles size={15} />, counts.unused)}
          <div className="mx-1 my-2" style={{ borderTop: '1px solid var(--ci-border)' }} />
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ci-muted)' }}>Folders</p>
          {navItem(UNSORTED, UNSORTED, <Folder size={15} />, counts[UNSORTED] ?? 0)}
          {folders.map(f => navItem(f, f, <Folder size={15} />, counts[f]))}
          <button
            onClick={() => {
              const name = prompt('New folder name')?.trim()
              if (name) { setView(name); toast('Upload or move files here to fill the folder', { icon: '📁' }) }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm mt-1"
            style={{ color: 'var(--ci-muted)' }}>
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
                <button onClick={() => setMoveOpen(true)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg"
                  style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)' }}>
                  Move to…
                </button>
                <button onClick={() => confirmDelete(Array.from(selected))}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg"
                  style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  Delete
                </button>
                <button onClick={() => setSelected(new Set())} className="text-sm" style={{ color: 'var(--ci-muted)' }}>Clear</button>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }} />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Image size={40} style={{ color: 'var(--ci-border)' }} />
                <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>
                  {search ? 'No files match your search.' : 'Nothing here yet.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {visible.map(file => {
                  const warn = fileWarning(file)
                  const isSel = selected.has(file.name)
                  const unused = file.usedIn.length === 0
                  return (
                    <div key={file.name} onClick={() => setDetail(file)}
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

                      {/* Select checkbox */}
                      <button onClick={e => { e.stopPropagation(); toggleSelect(file.name) }}
                        className="absolute top-2 left-2 z-10 rounded"
                        style={{ color: isSel ? '#f4bf00' : '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
                        {isSel ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      {/* Status badges */}
                      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                        {unused && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(185,28,28,0.9)', color: '#fff' }}>UNUSED</span>
                        )}
                        {warn && (
                          <span title={warn} className="w-5 h-5 flex items-center justify-center rounded"
                            style={{ background: 'rgba(180,83,9,0.9)', color: '#fff' }}>
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </div>

                      {/* Hover info */}
                      <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                        style={{ background: 'linear-gradient(transparent, rgba(15,28,69,0.9))' }}>
                        <p className="text-xs font-medium text-white truncate" title={file.name}>{file.title || file.name}</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {fmtSize(file.size)}{unused ? '' : ` · used in ${file.usedIn.length}`}
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
          onCopy={() => copyUrl(detail.publicUrl, detail.name)}
          onSave={saveDetail}
          onDelete={() => confirmDelete([detail.name])}
          onClose={() => setDetail(null)}
        />
      )}

      {moveOpen && (
        <MoveModal
          count={selected.size}
          folders={folders}
          onMove={folder => moveTo(folder, Array.from(selected))}
          onClose={() => setMoveOpen(false)}
        />
      )}
    </div>
  )
}

// ── Detail / edit modal ─────────────────────────────────────────────────────────
function DetailModal({ asset, folders, copied, onCopy, onSave, onDelete, onClose }: {
  asset: Asset
  folders: string[]
  copied: boolean
  onCopy: () => void
  onSave: (a: Asset, patch: { title: string; alt: string; folder: string }) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(asset.title)
  const [alt, setAlt] = useState(asset.alt)
  const [folder, setFolder] = useState(asset.folder)

  const folderOptions = Array.from(new Set([UNSORTED, ...folders, folder])).filter(f => f !== '__new__')

  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col md:flex-row" style={{ maxHeight: '80vh' }}>
        {/* Preview */}
        <div className="md:w-80 flex-shrink-0 flex items-center justify-center p-4" style={{ background: '#f1efe8' }}>
          {isImage(asset.mimeType)
            ? <img src={asset.publicUrl} alt={asset.alt || asset.name} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
            : <Image size={64} style={{ color: 'var(--ci-muted)' }} />}
        </div>

        {/* Details */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ minWidth: 320 }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="text-sm font-medium break-all" style={{ color: 'var(--ci-navy)' }}>{asset.name}</p>
            <button onClick={onClose} style={{ color: 'var(--ci-muted)' }}><X size={18} /></button>
          </div>

          <p className="text-xs mb-4" style={{ color: 'var(--ci-muted)' }}>{fmtSize(asset.size)} · {asset.mimeType || 'file'}</p>

          {fileWarning(asset) && (
            <div className="flex items-start gap-2 text-xs mb-4 p-2 rounded-lg" style={{ background: '#fffbeb', color: '#92400e' }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{fileWarning(asset)}</span>
            </div>
          )}

          {/* Where used */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--ci-muted)' }}>Where it's used</p>
            {asset.usedIn.length === 0 ? (
              <p className="text-sm" style={{ color: '#b91c1c' }}>Not used anywhere — safe to delete.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {asset.usedIn.map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--ci-hover)', color: 'var(--ci-navy)' }}>{s}</span>
                ))}
              </div>
            )}
          </div>

          <Field label="Title (internal)">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Meissen brass mixer"
              style={inputStyle} />
          </Field>
          <Field label="Default alt text">
            <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Describes the image for SEO & accessibility"
              style={inputStyle} />
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

          <div className="flex items-center gap-2 mt-6">
            <button onClick={() => onSave(asset, { title, alt, folder: folder === '__new__' ? UNSORTED : folder })}
              className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>
              Save
            </button>
            <button onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--ci-border)', color: copied ? '#166534' : 'var(--ci-navy)' }}>
              <Link size={14} /> {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg ml-auto"
              style={{ color: '#b91c1c' }}>
              <Trash2 size={14} /> Delete
            </button>
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
          className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg w-full" style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>
          Move
        </button>
      </div>
    </Overlay>
  )
}

// ── Shared bits ─────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,28,69,0.45)' }}>
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