import { useRef } from 'react'
import EditorPage from '@/components/editors/EditorPage'
import { TextField } from '@/components/editors/fields'
import { PortfolioSection, type PortfolioSectionHandle } from '@/components/editors/PortfolioSection'
import { ClientLogosSection } from '@/components/editors/ClientLogosSection'
import { WorkImagesSection } from '@/components/editors/WorkImagesSection'
import type { OurWorkPage } from '@/lib/types'

const DEFAULT: OurWorkPage = {
  id: '', status: 'draft', published_at: null, scheduled_at: null,
  created_by: null, updated_by: null, created_at: '', updated_at: '',
  seo_title: null, seo_description: null, og_image: null, og_image_alt: '',
  canonical_url: null, no_index: false, no_follow: false,
  aeo_primary_question: null, aeo_direct_answer: null, aeo_faq_blocks: [], aeo_speakable_content: null,
  geo_topic_clusters: [], geo_entity_mentions: [], geo_ai_summary: null, geo_llms_txt_flag: true,
  hero_title: null,
}

export default function WorkEditor() {
  const portfolioRef = useRef<PortfolioSectionHandle>(null)

  return (
    <EditorPage
      table="our_work_page"
      title="Our Work"
      defaultData={DEFAULT}
      previewPath="/our-work"
      onBeforeSave={() => portfolioRef.current?.save() ?? Promise.resolve()}
    >
      {(data, onChange) => (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Hero
            </h3>
            <TextField label="Hero Title"
              value={data.hero_title ?? ''}
              onChange={e => onChange({ hero_title: e.target.value })} />
            <p className="text-xs mt-3" style={{ color: '#6b6b6b' }}>
              The landing section shows a big "Our Work" wordmark with the Hero Gallery
              images scattering in on scroll, then wipes up into the rotating client ring.
            </p>
          </section>

          <WorkImagesSection page="our-work" label="Hero Gallery (landing scatter)" />

          <ClientLogosSection />

          <PortfolioSection ref={portfolioRef} />
        </div>
      )}
    </EditorPage>
  )
}
