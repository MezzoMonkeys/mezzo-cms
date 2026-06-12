import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { AeoFields, AeoFaqBlock } from '@/lib/types'
import { TextField, TextareaField } from './fields'

interface Props {
  data: AeoFields
  onChange: (patch: Partial<AeoFields>) => void
}

export default function AeoTab({ data, onChange }: Props) {
  function updateFaqBlock(index: number, patch: Partial<AeoFaqBlock>) {
    const updated = data.aeo_faq_blocks.map((b, i) => (i === index ? { ...b, ...patch } : b))
    onChange({ aeo_faq_blocks: updated })
  }

  function addFaqBlock() {
    onChange({ aeo_faq_blocks: [...data.aeo_faq_blocks, { question: '', answer: '' }] })
  }

  function removeFaqBlock(index: number) {
    onChange({ aeo_faq_blocks: data.aeo_faq_blocks.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-xl p-4 text-sm"
        style={{ background: '#f4bf0015', border: '1px solid #f4bf0030' }}
      >
        <strong style={{ color: 'var(--ci-navy)' }}>Answer Engine Optimisation (AEO)</strong>
        <p className="mt-1" style={{ color: 'var(--ci-muted)' }}>
          Structured Q&A signals help AI assistants (Perplexity, ChatGPT, Google AI Overviews) surface your content as a direct answer.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 pb-2" style={{ color: 'var(--ci-navy)', borderBottom: '1px solid var(--ci-border)' }}>
          Primary Answer
        </h2>
        <div className="flex flex-col gap-5">
          <TextField
            label="Primary Question"
            hint="The main question this page answers"
            value={data.aeo_primary_question ?? ''}
            onChange={e => onChange({ aeo_primary_question: e.target.value })}
          />
          <TextareaField
            label="Direct Answer"
            hint="A concise, direct answer (2–3 sentences). This may be surfaced verbatim by AI."
            rows={3}
            value={data.aeo_direct_answer ?? ''}
            onChange={e => onChange({ aeo_direct_answer: e.target.value })}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--ci-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ci-navy)' }}>
            FAQ Blocks
          </h2>
          <button
            type="button"
            onClick={addFaqBlock}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--ci-navy)', color: 'var(--ci-hover)' }}
          >
            <Plus size={12} />
            Add FAQ
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {data.aeo_faq_blocks.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>
              No FAQ blocks yet. Add some to improve AI discoverability.
            </p>
          )}
          {data.aeo_faq_blocks.map((block, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ border: '1px solid var(--ci-border)', background: '#ffffff' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ci-muted)' }}>
                  FAQ {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeFaqBlock(i)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: 'var(--ci-muted)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--ci-muted)'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <TextField
                  label="Question"
                  value={block.question}
                  onChange={e => updateFaqBlock(i, { question: e.target.value })}
                />
                <TextareaField
                  label="Answer"
                  rows={2}
                  value={block.answer}
                  onChange={e => updateFaqBlock(i, { answer: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 pb-2" style={{ color: 'var(--ci-navy)', borderBottom: '1px solid var(--ci-border)' }}>
          Speakable Content
        </h2>
        <TextareaField
          label="Speakable Content"
          hint="Passages suitable for text-to-speech (Google speakable schema). Plain text, 1–3 sentences."
          rows={3}
          value={data.aeo_speakable_content ?? ''}
          onChange={e => onChange({ aeo_speakable_content: e.target.value })}
        />
      </div>
    </div>
  )
}
