import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react'
import { getChildItems, upsertChildItem, deleteChildItem } from '@/lib/queries'
import { TextField, TextareaField } from '@/components/editors/fields'
import type { PricingCategory, PricingCard } from '@/lib/types'

type CardDraft = PricingCard & { _featuresText: string }
type CategoryDraft = PricingCategory & { _cards: CardDraft[]; _expanded: boolean }

export function PricingCategoriesSection() {
  const [cats, setCats] = useState<CategoryDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getChildItems('pricing_categories'),
      getChildItems('pricing_cards'),
    ])
      .then(([categories, cards]) => {
        const catList = categories as PricingCategory[]
        const cardList = cards as PricingCard[]
        setCats(
          catList.map(cat => ({
            ...cat,
            _expanded: true,
            _cards: cardList
              .filter(c => c.category_id === cat.id)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(c => ({ ...c, _featuresText: (c.features || []).join('\n') })),
          })),
        )
      })
      .catch(() => toast.error('Failed to load pricing data'))
      .finally(() => setLoading(false))
  }, [])

  function addCategory() {
    setCats(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category_title: '',
        category_key: '',
        sort_order: prev.length,
        _cards: [],
        _expanded: true,
      },
    ])
  }

  function updateCat(i: number, patch: Partial<PricingCategory>) {
    setCats(prev => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  function toggleCat(i: number) {
    setCats(prev => prev.map((c, idx) => (idx === i ? { ...c, _expanded: !c._expanded } : c)))
  }

  function moveCat(i: number, dir: -1 | 1) {
    setCats(prev => {
      const next = [...prev]
      const swap = i + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[i], next[swap]] = [next[swap], next[i]]
      return next
    })
  }

  async function removeCat(cat: CategoryDraft, i: number) {
    setCats(prev => prev.filter((_, idx) => idx !== i))
    await Promise.all(cat._cards.map(c => deleteChildItem('pricing_cards', c.id).catch(() => null)))
    await deleteChildItem('pricing_categories', cat.id).catch(() => null)
  }

  function addCard(catIdx: number) {
    const newCard: CardDraft = {
      id: crypto.randomUUID(),
      category_id: cats[catIdx].id,
      level_label: '',
      package_title: '',
      badge_text: null,
      price_text: '',
      card_theme: 'blue',
      features: [],
      sort_order: cats[catIdx]._cards.length,
      _featuresText: '',
    }
    setCats(prev =>
      prev.map((c, i) => (i === catIdx ? { ...c, _cards: [...c._cards, newCard] } : c)),
    )
  }

  function updateCard(catIdx: number, cardIdx: number, patch: Partial<CardDraft>) {
    setCats(prev =>
      prev.map((c, i) => {
        if (i !== catIdx) return c
        return {
          ...c,
          _cards: c._cards.map((card, j) => (j === cardIdx ? { ...card, ...patch } : card)),
        }
      }),
    )
  }

  function moveCard(catIdx: number, cardIdx: number, dir: -1 | 1) {
    setCats(prev =>
      prev.map((c, i) => {
        if (i !== catIdx) return c
        const next = [...c._cards]
        const swap = cardIdx + dir
        if (swap < 0 || swap >= next.length) return c
        ;[next[cardIdx], next[swap]] = [next[swap], next[cardIdx]]
        return { ...c, _cards: next }
      }),
    )
  }

  async function removeCard(catIdx: number, card: CardDraft, cardIdx: number) {
    setCats(prev =>
      prev.map((c, i) => {
        if (i !== catIdx) return c
        return { ...c, _cards: c._cards.filter((_, j) => j !== cardIdx) }
      }),
    )
    await deleteChildItem('pricing_cards', card.id).catch(() => null)
  }

  async function save() {
    setSaving(true)
    try {
      await Promise.all(
        cats.map((cat, i) =>
          upsertChildItem('pricing_categories', {
            id: cat.id,
            category_title: cat.category_title,
            category_key: cat.category_key,
            sort_order: i,
          } as Record<string, unknown>),
        ),
      )
      await Promise.all(
        cats.flatMap((cat, _catIdx) =>
          cat._cards.map((card, cardIdx) =>
            upsertChildItem('pricing_cards', {
              id: card.id,
              category_id: cat.id,
              level_label: card.level_label || null,
              package_title: card.package_title,
              badge_text: card.badge_text || null,
              price_text: card.price_text,
              card_theme: card.card_theme,
              features: card._featuresText
                .split('\n')
                .map(f => f.trim())
                .filter(Boolean),
              sort_order: cardIdx,
            } as Record<string, unknown>),
          ),
        ),
      )
      toast.success('Pricing saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm" style={{ color: '#6b6b6b' }}>Loading…</p>

  return (
    <section>
      <div
        className="flex items-center justify-between mb-4 pb-2"
        style={{ borderBottom: '1px solid #e8e8e8' }}
      >
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#6b6b6b' }}
        >
          Pricing Categories & Cards
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={addCategory}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: '#111111', color: '#f7f7f7' }}
          >
            <Plus size={12} /> Add Category
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: '#f4bf00', color: '#111111' }}
          >
            {saving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {cats.map((cat, catIdx) => (
          <div
            key={cat.id}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #e8e8e8' }}
          >
            {/* Category header */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                background: '#f7f7f7',
                borderBottom: cat._expanded ? '1px solid #e8e8e8' : 'none',
              }}
            >
              <button
                onClick={() => toggleCat(catIdx)}
                className="flex-shrink-0"
                style={{ color: '#6b6b6b' }}
              >
                <ChevronRight
                  size={14}
                  style={{
                    transform: cat._expanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <input
                  className="flex-1 text-sm font-medium bg-transparent border-0 outline-none min-w-0"
                  placeholder="Category title…"
                  value={cat.category_title}
                  onChange={e => updateCat(catIdx, { category_title: e.target.value })}
                  style={{ color: '#111111' }}
                />
                <input
                  className="w-36 text-xs bg-transparent border-0 outline-none flex-shrink-0"
                  placeholder="slug-key"
                  value={cat.category_key}
                  onChange={e => updateCat(catIdx, { category_key: e.target.value })}
                  style={{ color: '#6b6b6b', fontFamily: 'monospace' }}
                />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveCat(catIdx, -1)}
                  disabled={catIdx === 0}
                  className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                  style={{ color: '#6b6b6b' }}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => moveCat(catIdx, 1)}
                  disabled={catIdx === cats.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                  style={{ color: '#6b6b6b' }}
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  onClick={() => removeCat(cat, catIdx)}
                  className="w-6 h-6 flex items-center justify-center rounded"
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
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Cards */}
            {cat._expanded && (
              <div className="p-4 flex flex-col gap-3">
                {cat._cards.map((card, cardIdx) => (
                  <div
                    key={card.id}
                    className="rounded-lg p-4 flex gap-3"
                    style={{ background: '#fafafa', border: '1px solid #efefef' }}
                  >
                    <div className="flex flex-col gap-1 pt-1 flex-shrink-0">
                      <button
                        onClick={() => moveCard(catIdx, cardIdx, -1)}
                        disabled={cardIdx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                        style={{ color: '#6b6b6b' }}
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveCard(catIdx, cardIdx, 1)}
                        disabled={cardIdx === cat._cards.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                        style={{ color: '#6b6b6b' }}
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <TextField
                        label="Package Title"
                        value={card.package_title}
                        onChange={e => updateCard(catIdx, cardIdx, { package_title: e.target.value })}
                      />
                      <TextField
                        label="Level Label"
                        value={card.level_label ?? ''}
                        onChange={e =>
                          updateCard(catIdx, cardIdx, { level_label: e.target.value || null })
                        }
                      />
                      <TextField
                        label="Price"
                        value={card.price_text}
                        onChange={e => updateCard(catIdx, cardIdx, { price_text: e.target.value })}
                      />
                      <TextField
                        label="Badge Text (optional)"
                        value={card.badge_text ?? ''}
                        onChange={e =>
                          updateCard(catIdx, cardIdx, { badge_text: e.target.value || null })
                        }
                      />
                      <div>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: '#6b6b6b' }}
                        >
                          Theme
                        </label>
                        <select
                          value={card.card_theme}
                          onChange={e =>
                            updateCard(catIdx, cardIdx, {
                              card_theme: e.target.value as 'blue' | 'black',
                            })
                          }
                          className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
                          style={{
                            borderColor: '#e8e8e8',
                            background: '#fff',
                            color: '#111111',
                          }}
                        >
                          <option value="blue">Blue</option>
                          <option value="black">Black</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <TextareaField
                          label="Features — one per line"
                          rows={6}
                          value={card._featuresText}
                          onChange={e =>
                            updateCard(catIdx, cardIdx, { _featuresText: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => removeCard(catIdx, card, cardIdx)}
                      className="mt-1 w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
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
                ))}

                <button
                  onClick={() => addCard(catIdx)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg self-start"
                  style={{ border: '1px dashed #d4d4d4', color: '#6b6b6b' }}
                >
                  <Plus size={12} /> Add Card
                </button>
              </div>
            )}
          </div>
        ))}

        {cats.length === 0 && (
          <p className="text-sm" style={{ color: '#6b6b6b' }}>
            No categories yet — click Add Category to create one.
          </p>
        )}
      </div>
    </section>
  )
}
