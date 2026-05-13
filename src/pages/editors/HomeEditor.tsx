import EditorPage from '@/components/editors/EditorPage'
import { TextField, TextareaField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import { ServiceCardsSection } from '@/components/editors/ServiceCardsSection'
import { WorkImagesSection } from '@/components/editors/WorkImagesSection'
import { ClientLogosSection } from '@/components/editors/ClientLogosSection'
import type { HomePage } from '@/lib/types'

const DEFAULT: HomePage = {
  id: '', status: 'draft', published_at: null, scheduled_at: null,
  created_by: null, updated_by: null, created_at: '', updated_at: '',
  seo_title: null, seo_description: null, og_image: null, og_image_alt: '',
  canonical_url: null, no_index: false, no_follow: false,
  aeo_primary_question: null, aeo_direct_answer: null, aeo_faq_blocks: [], aeo_speakable_content: null,
  geo_topic_clusters: [], geo_entity_mentions: [], geo_ai_summary: null, geo_llms_txt_flag: true,
  hero_subheading: null, hero_image: null, hero_image_alt: '',
  brand_title: null, brand_subtitle: null, service_section_heading: null,
  our_work_heading: null, our_work_button_text: null, our_work_button_url: null, clients_title: null,
}

export default function HomeEditor() {
  return (
    <EditorPage table="home_page" title="Home Page" defaultData={DEFAULT} previewPath="/">
      {(data, onChange) => (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Hero
            </h3>
            <div className="flex flex-col gap-5">
              <TextField label="Hero Subheading"
                value={data.hero_subheading ?? ''}
                onChange={e => onChange({ hero_subheading: e.target.value })} />
              <ImageUpload label="Hero Image"
                value={data.hero_image} altValue={data.hero_image_alt}
                onChange={url => onChange({ hero_image: url })}
                onAltChange={alt => onChange({ hero_image_alt: alt })} required />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Brand Builder Section
            </h3>
            <div className="flex flex-col gap-5">
              <TextField label="Title"
                value={data.brand_title ?? ''}
                onChange={e => onChange({ brand_title: e.target.value })} />
              <TextareaField label="Subtitle" rows={3}
                value={data.brand_subtitle ?? ''}
                onChange={e => onChange({ brand_subtitle: e.target.value })} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Services Section
            </h3>
            <div className="flex flex-col gap-5">
              <TextField label="Services Section Heading"
                value={data.service_section_heading ?? ''}
                onChange={e => onChange({ service_section_heading: e.target.value })} />
            </div>
          </section>

          <ServiceCardsSection />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Our Work Section
            </h3>
            <div className="flex flex-col gap-5">
              <TextField label="Heading"
                value={data.our_work_heading ?? ''}
                onChange={e => onChange({ our_work_heading: e.target.value })} />
              <TextField label="Button Text"
                value={data.our_work_button_text ?? ''}
                onChange={e => onChange({ our_work_button_text: e.target.value })} />
              <TextField label="Button URL"
                value={data.our_work_button_url ?? ''}
                onChange={e => onChange({ our_work_button_url: e.target.value })} />
            </div>
          </section>

          <WorkImagesSection page="home" label="Work Slideshow Images" />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Clients Section
            </h3>
            <TextField label="Clients Section Title"
              value={data.clients_title ?? ''}
              onChange={e => onChange({ clients_title: e.target.value })} />
          </section>

          <ClientLogosSection />
        </div>
      )}
    </EditorPage>
  )
}
