import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { uploadFile } from '@/lib/queries'
import { FieldWrap } from './fields'

interface Props {
  label: string
  value: string | null
  altValue: string
  onChange: (url: string) => void
  onAltChange: (alt: string) => void
  required?: boolean
}

export default function ImageUpload({ label, value, altValue, onChange, onAltChange, required }: Props) {
  const [uploading, setUploading] = useState(false)
  const [altError, setAltError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const path = `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`
      const url = await uploadFile('media', path, file)
      onChange(url)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <FieldWrap label={label}>
        {value ? (
          <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>
            <img
              src={value}
              alt={altValue || 'Preview'}
              className="w-full object-cover"
              style={{ maxHeight: '200px' }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg cursor-pointer transition-colors"
            style={{
              border: '2px dashed #e8e8e8',
              padding: '24px',
              minHeight: '120px',
            }}
            onDragOver={e => {
              e.preventDefault()
              e.currentTarget.style.borderColor = '#f4bf00'
            }}
            onDragLeave={e => (e.currentTarget.style.borderColor = '#e8e8e8')}
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
                <ImageIcon size={24} style={{ color: '#6b6b6b' }} />
                <span className="text-sm" style={{ color: '#6b6b6b' }}>
                  Drop image or click to upload
                </span>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
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
            style={{ border: '1px solid #e8e8e8', color: '#2b2b2b', background: '#ffffff' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f7f7f7')}
            onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
          >
            <Upload size={14} />
            Choose file
          </button>
        )}
      </FieldWrap>

      {/* Alt text — always required */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: '#2b2b2b' }}>
          Alt Text <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <p className="text-xs" style={{ color: '#6b6b6b' }}>
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
            border: `1px solid ${altError ? '#ef4444' : '#e8e8e8'}`,
            background: '#ffffff',
            color: '#2b2b2b',
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
