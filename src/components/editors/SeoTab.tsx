import type { SeoFields } from '@/lib/types'
import ImageUpload from './ImageUpload'
import { TextField, TextareaField, ToggleField } from './fields'

interface Props {
  data: SeoFields
  onChange: (patch: Partial<SeoFields>) => void
}

export default function SeoTab({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold mb-4 pb-2" style={{ color: 'var(--ci-navy)', borderBottom: '1px solid var(--ci-border)' }}>
          Search Engine Optimisation
        </h2>
        <div className="flex flex-col gap-5">
          <TextField
            label="SEO Title"
            hint="Shown in search results. Target 50–60 characters."
            value={data.seo_title ?? ''}
            onChange={e => onChange({ seo_title: e.target.value })}
            counter={{ current: (data.seo_title ?? '').length, target: [50, 60] }}
          />
          <TextareaField
            label="SEO Description"
            hint="Shown in search results. Target 150–160 characters."
            rows={3}
            value={data.seo_description ?? ''}
            onChange={e => onChange({ seo_description: e.target.value })}
            counter={{ current: (data.seo_description ?? '').length, target: [150, 160] }}
          />
          <TextField
            label="Canonical URL"
            hint="Override the canonical URL if needed"
            type="url"
            value={data.canonical_url ?? ''}
            onChange={e => onChange({ canonical_url: e.target.value })}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 pb-2" style={{ color: 'var(--ci-navy)', borderBottom: '1px solid var(--ci-border)' }}>
          Open Graph / Social Sharing
        </h2>
        <ImageUpload
          label="OG Image"
          value={data.og_image}
          altValue={data.og_image_alt}
          onChange={url => onChange({ og_image: url })}
          onAltChange={alt => onChange({ og_image_alt: alt })}
          required
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 pb-2" style={{ color: 'var(--ci-navy)', borderBottom: '1px solid var(--ci-border)' }}>
          Crawling
        </h2>
        <div className="flex flex-col gap-3">
          <ToggleField
            label="No Index"
            hint="Prevent search engines from indexing this page"
            checked={data.no_index}
            onChange={v => onChange({ no_index: v })}
          />
          <ToggleField
            label="No Follow"
            hint="Prevent search engines from following links on this page"
            checked={data.no_follow}
            onChange={v => onChange({ no_follow: v })}
          />
        </div>
      </div>
    </div>
  )
}
