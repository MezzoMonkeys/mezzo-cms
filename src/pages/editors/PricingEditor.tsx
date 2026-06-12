import { useRef } from 'react'
import EditorPage from '@/components/editors/EditorPage'
import { TextField } from '@/components/editors/fields'
import { PricingCategoriesSection, type PricingCategoriesSectionHandle } from '@/components/editors/PricingCategoriesSection'
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
  const pricingRef = useRef<PricingCategoriesSectionHandle>(null)

  return (
    <EditorPage
      table="pricing_page"
      title="Pricing"
      defaultData={DEFAULT}
      previewPath="/pricing"
      onBeforeSave={() => pricingRef.current?.save() ?? Promise.resolve()}
    >
      {(data, onChange) => (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: 'var(--ci-muted)', borderBottom: '1px solid var(--ci-border)' }}>
              Page Header
            </h3>
            <TextField label="Page Title"
              value={data.page_title ?? ''}
              onChange={e => onChange({ page_title: e.target.value })} />
          </section>

          <PricingCategoriesSection ref={pricingRef} />
        </div>
      )}
    </EditorPage>
  )
}
