import type { GeoFields } from '@/lib/types'
import { TextareaField, ToggleField } from './fields'
import TagInput from './TagInput'

interface Props {
  data: GeoFields
  onChange: (patch: Partial<GeoFields>) => void
}

export default function GeoTab({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-xl p-4 text-sm"
        style={{ background: '#f4bf0015', border: '1px solid #f4bf0030' }}
      >
        <strong style={{ color: '#2b2b2b' }}>Generative Engine Optimisation (GEO)</strong>
        <p className="mt-1" style={{ color: '#6b6b6b' }}>
          Signals that help large language models understand, classify, and recommend your content in AI-generated responses.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 pb-2" style={{ color: '#111111', borderBottom: '1px solid #e8e8e8' }}>
          Semantic Signals
        </h2>
        <div className="flex flex-col gap-5">
          <TagInput
            label="Topic Clusters"
            hint="Broad topics this page belongs to. e.g. plumbing marketing, brand strategy, trade industry"
            values={data.geo_topic_clusters}
            onChange={v => onChange({ geo_topic_clusters: v })}
          />
          <TagInput
            label="Entity Mentions"
            hint="Named entities on this page: brands, people, places, products. e.g. Mezzo Collective, Melbourne, Rheem"
            values={data.geo_entity_mentions}
            onChange={v => onChange({ geo_entity_mentions: v })}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 pb-2" style={{ color: '#111111', borderBottom: '1px solid #e8e8e8' }}>
          AI Summary
        </h2>
        <TextareaField
          label="AI Summary"
          hint="A 2–4 sentence summary written for AI models. Plain language, factual, no fluff."
          rows={4}
          value={data.geo_ai_summary ?? ''}
          onChange={e => onChange({ geo_ai_summary: e.target.value })}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 pb-2" style={{ color: '#111111', borderBottom: '1px solid #e8e8e8' }}>
          llms.txt
        </h2>
        <ToggleField
          label="Include in llms.txt"
          hint="When enabled, this page will be listed in /llms.txt, signalling to AI crawlers that this content may be used for training or retrieval."
          checked={data.geo_llms_txt_flag}
          onChange={v => onChange({ geo_llms_txt_flag: v })}
        />
      </div>
    </div>
  )
}
