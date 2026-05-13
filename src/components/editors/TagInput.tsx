import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { FieldWrap } from './fields'

interface Props {
  label: string
  hint?: string
  values: string[]
  onChange: (values: string[]) => void
}

export default function TagInput({ label, hint, values, onChange }: Props) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (tag && !values.includes(tag)) {
      onChange([...values, tag])
    }
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  function removeTag(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <FieldWrap label={label} hint={hint}>
      <div
        className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg"
        style={{ border: '1px solid #e8e8e8', background: '#ffffff', cursor: 'text' }}
        onClick={() => document.getElementById(`tag-input-${label}`)?.focus()}
      >
        {values.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: '#f4bf0020', color: '#2b2b2b', border: '1px solid #f4bf0040' }}
          >
            {tag}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                removeTag(i)
              }}
              style={{ color: '#6b6b6b', lineHeight: 1 }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          id={`tag-input-${label}`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={values.length === 0 ? 'Type and press Enter or comma' : ''}
          className="flex-1 min-w-24 text-sm outline-none"
          style={{ background: 'transparent', border: 'none', color: '#2b2b2b' }}
        />
      </div>
    </FieldWrap>
  )
}
