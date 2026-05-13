import EditorPage from '@/components/editors/EditorPage'
import { TextField } from '@/components/editors/fields'
import type { PricingPage } from '@/lib/types'

const DEFAULT: PricingPage = {
  id: '', status: 'draft', published_at: null, scheduled_at: null,
  created_by: null, updated_by: null, created_at: '', updated_at: '',
  seo_title: null, seo_description: null, og_image: null, og_image_alt: '',
  canonical_url: null, no_index: false, no_follow: false,
  aeo_primary_question: null, aeo_direct_answer: null, aeo_faq_blocks: [], aeo_speakable_content: null,
  geo_topic_clusters: [], geo_entity_mentions: [], geo_ai_summary: null, geo_llms_txt_flag: true,
  page_title: null,
}

export default function PricingEditor() {
  return (
    <EditorPage table="pricing_page" title="Pricing" defaultData={DEFAULT} previewPath="/pricing">
      {(data, onChange) => (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Page Header
            </h3>
            <TextField label="Page Title"
              value={data.page_title ?? ''}
              onChange={e => onChange({ page_title: e.target.value })} />
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-2 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Pricing Categories & Cards
            </h3>
            <p className="text-sm mb-3" style={{ color: '#6b6b6b' }}>
              Pricing categories (tabs) and their cards are managed as separate database records.
            </p>
            <div
              className="rounded-xl p-4 text-sm"
              style={{ background: '#f7f7f7', border: '1px solid #e8e8e8' }}
            >
              Full pricing card editor coming in next release — categories and cards can be managed in Supabase in the meantime.
            </div>
          </section>
        </div>
      )}
    </EditorPage>
  )
}
