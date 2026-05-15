import { useRef } from 'react'
import EditorPage from '@/components/editors/EditorPage'
import { TextField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import { PortfolioSection, type PortfolioSectionHandle } from '@/components/editors/PortfolioSection'
import type { OurWorkPage } from '@/lib/types'

const DEFAULT: OurWorkPage = {
  id: '', status: 'draft', published_at: null, scheduled_at: null,
  created_by: null, updated_by: null, created_at: '', updated_at: '',
  seo_title: null, seo_description: null, og_image: null, og_image_alt: '',
  canonical_url: null, no_index: false, no_follow: false,
  aeo_primary_question: null, aeo_direct_answer: null, aeo_faq_blocks: [], aeo_speakable_content: null,
  geo_topic_clusters: [], geo_entity_mentions: [], geo_ai_summary: null, geo_llms_txt_flag: true,
  hero_title: null, showreel_video_url: null, showreel_poster_url: null, showreel_poster_alt: '',
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
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
              style={{ color: '#6b6b6b', borderBottom: '1px solid #e8e8e8' }}>
              Showreel
            </h3>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#2b2b2b' }}>Showreel Video URL</label>
                <p className="text-xs" style={{ color: '#6b6b6b' }}>Paste a direct video URL or upload to Supabase Storage</p>
                <input type="url" value={data.showreel_video_url ?? ''}
                  onChange={e => onChange({ showreel_video_url: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid #e8e8e8', background: '#ffffff', color: '#2b2b2b' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e8e8e8')} />
              </div>
              <ImageUpload label="Showreel Poster Image"
                value={data.showreel_poster_url} altValue={data.showreel_poster_alt}
                onChange={url => onChange({ showreel_poster_url: url })}
                onAltChange={alt => onChange({ showreel_poster_alt: alt })} required />
            </div>
          </section>

          <PortfolioSection ref={portfolioRef} />
        </div>
      )}
    </EditorPage>
  )
}
