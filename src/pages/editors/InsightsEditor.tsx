import EditorPage from '@/components/editors/EditorPage'
import { TextField } from '@/components/editors/fields'
import type { InsightsPage } from '@/lib/types'

const DEFAULT: InsightsPage = {
  id: '', status: 'draft', published_at: null, scheduled_at: null,
  created_by: null, updated_by: null, created_at: '', updated_at: '',
  seo_title: null, seo_description: null, og_image: null, og_image_alt: '',
  canonical_url: null, no_index: false, no_follow: false,
  aeo_primary_question: null, aeo_direct_answer: null, aeo_faq_blocks: [], aeo_speakable_content: null,
  geo_topic_clusters: [], geo_entity_mentions: [], geo_ai_summary: null, geo_llms_txt_flag: true,
  page_heading: null,
}

export default function InsightsEditor() {
  return (
    <EditorPage table="insights_page" title="Insights" defaultData={DEFAULT} previewPath="/insights">
      {(data, onChange) => (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Page Header
            </h3>
            <TextField label="Page Heading"
              value={data.page_heading ?? ''}
              onChange={e => onChange({ page_heading: e.target.value })} />
          </section>

          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: '#f4bf0015', border: '1px solid #f4bf0030' }}
          >
            <strong style={{ color: '#2b2b2b' }}>Articles</strong>
            <p className="mt-1" style={{ color: '#6b6b6b' }}>
              Individual articles are managed in the Articles section of the sidebar. Use the SEO, AEO and GEO tabs on this page for the listing page's search signals.
            </p>
          </div>
        </div>
      )}
    </EditorPage>
  )
}
