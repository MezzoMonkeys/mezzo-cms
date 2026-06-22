import EditorPage from '@/components/editors/EditorPage'
import { TextField, TextareaField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import { FaqSection } from '@/components/editors/FaqSection'
import { TeamMembersSection } from '@/components/editors/TeamMembersSection'
import { WorkImagesSection } from '@/components/editors/WorkImagesSection'
import type { AboutUsPage } from '@/lib/types'

const DEFAULT: AboutUsPage = {
  id: '', status: 'draft', published_at: null, scheduled_at: null,
  created_by: null, updated_by: null, created_at: '', updated_at: '',
  seo_title: null, seo_description: null, og_image: null, og_image_alt: '',
  canonical_url: null, no_index: false, no_follow: false,
  aeo_primary_question: null, aeo_direct_answer: null, aeo_faq_blocks: [], aeo_speakable_content: null,
  geo_topic_clusters: [], geo_entity_mentions: [], geo_ai_summary: null, geo_llms_txt_flag: true,
  hero_title: null, intro_heading: null,
  intro_column_1: null, intro_column_2: null, intro_column_3: null,
  our_work_heading: null, our_work_button_text: null, our_work_button_url: null, our_work_image: null,
}

export default function AboutEditor() {
  return (
    <EditorPage table="about_us_page" title="About Us" defaultData={DEFAULT} previewPath="/about-us">
      {(data, onChange) => (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: 'var(--ci-muted)', borderBottom: '1px solid var(--ci-border)' }}>
              Hero
            </h3>
            <TextareaField label="Hero Title" rows={3}
              hint="The large opening statement"
              value={data.hero_title ?? ''}
              onChange={e => onChange({ hero_title: e.target.value })} />
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: 'var(--ci-muted)', borderBottom: '1px solid var(--ci-border)' }}>
              Intro Section
            </h3>
            <div className="flex flex-col gap-5">
              <TextField label="Intro Heading"
                value={data.intro_heading ?? ''}
                onChange={e => onChange({ intro_heading: e.target.value })} />
              <TextareaField label="Column 1" rows={4}
                value={data.intro_column_1 ?? ''}
                onChange={e => onChange({ intro_column_1: e.target.value })} />
              <TextareaField label="Column 2" rows={4}
                value={data.intro_column_2 ?? ''}
                onChange={e => onChange({ intro_column_2: e.target.value })} />
              <TextareaField label="Column 3" rows={4}
                value={data.intro_column_3 ?? ''}
                onChange={e => onChange({ intro_column_3: e.target.value })} />
            </div>
          </section>

          <WorkImagesSection page="about" label="About Page Work Images" />

          <TeamMembersSection />

          <FaqSection />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: 'var(--ci-muted)', borderBottom: '1px solid var(--ci-border)' }}>
              Our Work Section
            </h3>
            <div className="flex flex-col gap-5">
              <ImageUpload
                label="Background Image"
                value={data.our_work_image ?? null}
                altValue=""
                onChange={url => onChange({ our_work_image: url ?? null })}
                onAltChange={() => {}}
              />
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
        </div>
      )}
    </EditorPage>
  )
}
