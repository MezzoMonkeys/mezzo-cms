import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Upload, X, ImageIcon } from 'lucide-react'
import { uploadFile, classifyError } from '@/lib/queries'
import { FieldWrap } from './fields'

interface Props {
  label: string
  value: string | null
  altValue: string
  onChange: (url: string) => void
  onAltChange: (alt: string) => void
  required?: boolean
  focalX?: number | null
  focalY?: number | null
  onFocalChange?: (x: number, y: number) => void
  onUploadingChange?: (uploading: boolean) => void
  cropViews?: { label: string; ratio: number }[]
  allowVideo?: boolean
}

function isVideoUrl(url: string | null): boolean {
  return !!url && /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url)
}

const DEFAULT_CROP_VIEWS = [
  { label: '16:9', ratio: 9 / 16 },
  { label: '1:1', ratio: 1 },
  { label: '9:16', ratio: 16 / 9 },
]

function fileSizeBadge(bytes: number) {
  const kb = bytes / 1024
  const label = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
  if (kb <= 200) return { label, color: '#16a34a', bg: '#dcfce7', text: 'Good size' }
  if (kb <= 800) return { label, color: '#d97706', bg: '#fef3c7', text: 'Consider optimising' }
  return { label, color: '#dc2626', bg: '#fee2e2', text: 'Too large — compress before uploading' }
}

export default function ImageUpload({
  label, value, altValue, onChange, onAltChange, required,
  focalX, focalY, onFocalChange, onUploadingChange, cropViews, allowVideo,
}: Props) {
  const CROP_VIEWS = cropViews ?? DEFAULT_CROP_VIEWS
  const valueIsVideo = isVideoUrl(value)
  const [uploading, setUploading] = useState(false)
  const [altError, setAltError] = useState(false)
  const [isDraggingFocal, setIsDraggingFocal] = useState(false)
  const [fileBytes, setFileBytes] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastValueRef = useRef<string | null>(null)

  const fx = focalX ?? 0.5
  const fy = focalY ?? 0.5
  const showPicker = !!onFocalChange && !!value && !valueIsVideo

  // Fetch size for existing images (on mount or when value changes externally)
  useEffect(() => {
    if (!value || value === lastValueRef.current) return
    lastValueRef.current = value
    setFileBytes(null)
    fetch(value, { method: 'HEAD' })
      .then(r => {
        const len = r.headers.get('content-length')
        if (len) setFileBytes(parseInt(len, 10))
      })
      .catch(() => {})
  }, [value])

  async function handleFile(file: File) {
    setUploading(true)
    onUploadingChange?.(true)
    setFileBytes(file.size)
    try {
      const path = `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`
      const url = await uploadFile('media', path, file)
      lastValueRef.current = url
      onChange(url)
      if (onFocalChange) onFocalChange(0.5, 0.5)
    } catch (err) {
      console.error('Upload failed', err)
      setFileBytes(null)
      toast.error(`Image upload failed — ${classifyError(err)}`)
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    const ok = file?.type.startsWith('image/') || (allowVideo && file?.type.startsWith('video/'))
    if (ok) handleFile(file)
  }

  function getFocal(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDraggingFocal(true)
    const { x, y } = getFocal(e)
    onFocalChange!(x, y)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingFocal) return
    const { x, y } = getFocal(e)
    onFocalChange!(x, y)
  }

  const sizeBadge = fileBytes !== null ? fileSizeBadge(fileBytes) : null

  return (
    <div className="flex flex-col gap-3">
      <FieldWrap label={label}>
        {value ? (
          <div className="flex flex-col gap-2">
            {/* Image with focal point picker overlay */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                border: '1px solid var(--ci-border)',
                cursor: showPicker ? 'crosshair' : 'default',
                userSelect: 'none',
              }}
              onPointerDown={showPicker ? handlePointerDown : undefined}
              onPointerMove={showPicker ? handlePointerMove : undefined}
              onPointerUp={showPicker ? () => setIsDraggingFocal(false) : undefined}
            >
              {valueIsVideo ? (
                <video
                  src={value}
                  muted loop playsInline controls
                  className="w-full"
                  style={{ maxHeight: '220px', display: 'block', background: '#000' }}
                />
              ) : (
                <img
                  src={value}
                  alt={altValue || 'Preview'}
                  className="w-full object-cover"
                  style={{ maxHeight: '220px', display: 'block', pointerEvents: 'none' }}
                />
              )}
              {showPicker && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Crosshair lines */}
                  <div style={{
                    position: 'absolute', left: `${fx * 100}%`, top: 0, bottom: 0,
                    width: 1, background: 'rgba(255,255,255,0.55)', transform: 'translateX(-50%)',
                  }} />
                  <div style={{
                    position: 'absolute', top: `${fy * 100}%`, left: 0, right: 0,
                    height: 1, background: 'rgba(255,255,255,0.55)', transform: 'translateY(-50%)',
                  }} />
                  {/* Focal dot */}
                  <div style={{
                    position: 'absolute',
                    left: `${fx * 100}%`, top: `${fy * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#f4bf00', border: '2px solid #fff',
                    boxShadow: '0 1px 5px rgba(0,0,0,0.45)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 6, left: 8, fontSize: 10,
                    color: '#fff', background: 'rgba(0,0,0,0.45)',
                    borderRadius: 3, padding: '2px 6px', letterSpacing: '0.02em',
                  }}>
                    Drag to set focal point
                  </div>
                </div>
              )}
              <button
                type="button"
                onPointerDown={e => e.stopPropagation()}
                onClick={() => { onChange(''); setFileBytes(null) }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', zIndex: 2 }}
              >
                <X size={14} />
              </button>
            </div>

            {/* File size badge (image only — the kb thresholds don't apply to video) */}
            {sizeBadge && !valueIsVideo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                  background: sizeBadge.bg, color: sizeBadge.color,
                }}>
                  {sizeBadge.label}
                </span>
                <span style={{ fontSize: 11, color: sizeBadge.color }}>{sizeBadge.text}</span>
              </div>
            )}

            {/* Crop previews */}
            {showPicker && (
              <div>
                <p style={{
                  fontSize: 10, color: '#9b9b9b', marginBottom: 6, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  Crop previews
                </p>
                <div style={{
                  display: 'grid',
                  // Column widths ∝ 1/ratio so every preview renders at the same height
                  gridTemplateColumns: CROP_VIEWS.map(v => `${(1 / v.ratio).toFixed(3)}fr`).join(' '),
                  gap: 6,
                  maxWidth: CROP_VIEWS.length === 1 ? 200 : '100%',
                }}>
                  {CROP_VIEWS.map(({ label: l, ratio }) => (
                    <div key={l}>
                      <div style={{
                        position: 'relative', width: '100%',
                        paddingBottom: `${ratio * 100}%`,
                        overflow: 'hidden', borderRadius: 4,
                        border: '1px solid var(--ci-border)',
                      }}>
                        <img
                          src={value}
                          alt=""
                          style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            objectPosition: `${fx * 100}% ${fy * 100}%`,
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                      <p style={{ fontSize: 10, color: '#9b9b9b', textAlign: 'center', marginTop: 3 }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg cursor-pointer transition-colors"
            style={{
              border: '2px dashed var(--ci-border)',
              padding: '24px',
              minHeight: '120px',
            }}
            onDragOver={e => {
              e.preventDefault()
              e.currentTarget.style.borderColor = '#f4bf00'
            }}
            onDragLeave={e => (e.currentTarget.style.borderColor = 'var(--ci-border)')}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }}
              />
            ) : (
              <>
                <ImageIcon size={24} style={{ color: 'var(--ci-muted)' }} />
                <span className="text-sm" style={{ color: 'var(--ci-muted)' }}>
                  {allowVideo ? 'Drop image or video, or click to upload' : 'Drop image or click to upload'}
                </span>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={allowVideo ? 'image/*,video/*' : 'image/*'}
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        {!value && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors self-start"
            style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)', background: '#ffffff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--ci-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
          >
            <Upload size={14} />
            Choose file
          </button>
        )}
      </FieldWrap>

      {/* Alt text */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
          Alt Text <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <p className="text-xs" style={{ color: 'var(--ci-muted)' }}>
          Describe the image for screen readers and SEO
        </p>
        <input
          type="text"
          value={altValue}
          onChange={e => {
            onAltChange(e.target.value)
            if (e.target.value) setAltError(false)
          }}
          onBlur={() => {
            if (required && !altValue.trim()) setAltError(true)
          }}
          placeholder="e.g. Team photo at Mezzo head office"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            border: `1px solid ${altError ? '#ef4444' : 'var(--ci-border)'}`,
            background: '#ffffff',
            color: 'var(--ci-navy)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
        />
        {altError && (
          <p className="text-xs" style={{ color: '#ef4444' }}>
            Alt text is required for accessibility and SEO
          </p>
        )}
      </div>
    </div>
  )
}
