import { useState } from 'react'
import { Plus, Trash2, GripVertical, Type, ImageIcon, Quote, MousePointerClick, Heading2 } from 'lucide-react'
import type { ContentBlock } from '@/lib/types'
import ImageUpload from './ImageUpload'
import { SelectField, TextField, TextareaField } from './fields'

interface Props {
  value: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}

const blockTypes: { value: ContentBlock['type']; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: 'paragraph', label: 'Paragraph', icon: Type },
  { value: 'heading', label: 'Heading', icon: Heading2 },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'quote', label: 'Quote', icon: Quote },
  { value: 'cta', label: 'CTA Button', icon: MousePointerClick },
]

function defaultBlock(type: ContentBlock['type']): ContentBlock {
  switch (type) {
    case 'paragraph': return { type: 'paragraph', content: '' }
    case 'heading': return { type: 'heading', level: 2, content: '' }
    case 'image': return { type: 'image', url: '', alt: '' }
    case 'quote': return { type: 'quote', text: '', attribution: '' }
    case 'cta': return { type: 'cta', text: '', url: '' }
  }
}

function BlockCard({
  block,
  index,
  onChange,
  onDelete,
}: {
  block: ContentBlock
  index: number
  onChange: (b: ContentBlock) => void
  onDelete: () => void
}) {
  return (
    <div
      className="rounded-xl p-5 relative"
      style={{ border: '1px solid #e8e8e8', background: '#ffffff' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GripVertical size={14} style={{ color: '#6b6b6b', cursor: 'grab' }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b6b6b' }}>
            {block.type}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: '#6b6b6b' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fee2e2'
            e.currentTarget.style.color = '#ef4444'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#6b6b6b'
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {block.type === 'paragraph' && (
        <TextareaField
          label={`Block ${index + 1} content`}
          rows={4}
          value={block.content}
          onChange={e => onChange({ ...block, content: e.target.value })}
        />
      )}

      {block.type === 'heading' && (
        <div className="flex flex-col gap-3">
          <SelectField
            label="Heading level"
            value={String(block.level)}
            onChange={v => onChange({ ...block, level: Number(v) as 2 | 3 })}
            options={[{ value: '2', label: 'H2' }, { value: '3', label: 'H3' }]}
          />
          <TextField
            label="Heading text"
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
          />
        </div>
      )}

      {block.type === 'image' && (
        <ImageUpload
          label="Block image"
          value={block.url}
          altValue={block.alt}
          onChange={url => onChange({ ...block, url })}
          onAltChange={alt => onChange({ ...block, alt })}
          required
        />
      )}

      {block.type === 'quote' && (
        <div className="flex flex-col gap-3">
          <TextareaField
            label="Quote text"
            rows={3}
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
          />
          <TextField
            label="Attribution (optional)"
            value={block.attribution ?? ''}
            onChange={e => onChange({ ...block, attribution: e.target.value })}
          />
        </div>
      )}

      {block.type === 'cta' && (
        <div className="flex flex-col gap-3">
          <TextField
            label="Button text"
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
          />
          <TextField
            label="Button URL"
            type="url"
            value={block.url}
            onChange={e => onChange({ ...block, url: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}

export default function BlockEditor({ value, onChange }: Props) {
  const [addType, setAddType] = useState<ContentBlock['type']>('paragraph')

  function addBlock() {
    onChange([...value, defaultBlock(addType)])
  }

  function updateBlock(index: number, block: ContentBlock) {
    const next = [...value]
    next[index] = block
    onChange(next)
  }

  function deleteBlock(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((block, i) => (
        <BlockCard
          key={i}
          block={block}
          index={i}
          onChange={b => updateBlock(i, b)}
          onDelete={() => deleteBlock(i)}
        />
      ))}

      <div
        className="flex items-center gap-3 p-4 rounded-xl"
        style={{ border: '2px dashed #e8e8e8' }}
      >
        <select
          value={addType}
          onChange={e => setAddType(e.target.value as ContentBlock['type'])}
          className="text-sm rounded-lg px-3 py-2 outline-none"
          style={{ border: '1px solid #e8e8e8', color: '#2b2b2b', background: '#ffffff' }}
        >
          {blockTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={addBlock}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#111111', color: '#f7f7f7' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1c1c1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#111111')}
        >
          <Plus size={14} />
          Add Block
        </button>
      </div>
    </div>
  )
}
