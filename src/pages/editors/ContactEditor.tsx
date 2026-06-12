import EditorPage from '@/components/editors/EditorPage'
import { TextField, TextareaField } from '@/components/editors/fields'
import { EnquiryOptionsSection } from '@/components/editors/EnquiryOptionsSection'
import type { ContactUsPage } from '@/lib/types'

const DEFAULT: ContactUsPage = {
  id: '', status: 'draft', published_at: null, scheduled_at: null,
  created_by: null, updated_by: null, created_at: '', updated_at: '',
  seo_title: null, seo_description: null, og_image: null, og_image_alt: '',
  canonical_url: null, no_index: false, no_follow: false,
  aeo_primary_question: null, aeo_direct_answer: null, aeo_faq_blocks: [], aeo_speakable_content: null,
  geo_topic_clusters: [], geo_entity_mentions: [], geo_ai_summary: null, geo_llms_txt_flag: true,
  page_heading: null, contact_address: null, contact_phone: null, contact_email: null,
}

export default function ContactEditor() {
  return (
    <EditorPage table="contact_us_page" title="Contact Us" defaultData={DEFAULT} previewPath="/contact-us">
      {(data, onChange) => (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: 'var(--ci-muted)', borderBottom: '1px solid var(--ci-border)' }}>
              Page Header
            </h3>
            <TextField label="Page Heading"
              value={data.page_heading ?? ''}
              onChange={e => onChange({ page_heading: e.target.value })} />
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: 'var(--ci-muted)', borderBottom: '1px solid var(--ci-border)' }}>
              Contact Details
            </h3>
            <div className="flex flex-col gap-5">
              <TextareaField label="Address" rows={3}
                value={data.contact_address ?? ''}
                onChange={e => onChange({ contact_address: e.target.value })} />
              <TextField label="Phone" type="tel"
                value={data.contact_phone ?? ''}
                onChange={e => onChange({ contact_phone: e.target.value })} />
              <TextField label="Email" type="email"
                value={data.contact_email ?? ''}
                onChange={e => onChange({ contact_email: e.target.value })} />
            </div>
          </section>

          <EnquiryOptionsSection />
        </div>
      )}
    </EditorPage>
  )
}
