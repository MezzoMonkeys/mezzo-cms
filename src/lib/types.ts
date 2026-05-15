export type Status = 'draft' | 'published' | 'scheduled'
export type UserRole = 'admin' | 'editor'

export interface SeoFields {
  seo_title: string | null
  seo_description: string | null
  og_image: string | null
  og_image_alt: string
  canonical_url: string | null
  no_index: boolean
  no_follow: boolean
}

export interface AeoFields {
  aeo_primary_question: string | null
  aeo_direct_answer: string | null
  aeo_faq_blocks: AeoFaqBlock[]
  aeo_speakable_content: string | null
}

export interface AeoFaqBlock {
  question: string
  answer: string
}

export interface GeoFields {
  geo_topic_clusters: string[]
  geo_entity_mentions: string[]
  geo_ai_summary: string | null
  geo_llms_txt_flag: boolean
}

export interface WorkflowFields {
  status: Status
  published_at: string | null
  scheduled_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type PageRecord = SeoFields & AeoFields & GeoFields & WorkflowFields & { id: string }

// ── Profiles ──────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
}

// ── Site Settings ─────────────────────────────────────────
export interface SiteSettings {
  id: string
  copyright_text: string | null
  footer_description: string | null
  instagram_url: string | null
  linkedin_url: string | null
  facebook_url: string | null
  instagram_icon: string | null
  linkedin_icon: string | null
  facebook_icon: string | null
  updated_by: string | null
  updated_at: string
}

export interface FooterLink {
  id: string
  name: string
  url: string
  target: '_self' | '_blank'
  sort_order: number
}

// ── Home Page ─────────────────────────────────────────────
export interface HomePage extends PageRecord {
  hero_subheading: string | null
  hero_image: string | null
  hero_image_alt: string
  brand_title: string | null
  brand_subtitle: string | null
  service_section_heading: string | null
  our_work_heading: string | null
  our_work_button_text: string | null
  our_work_button_url: string | null
  clients_title: string | null
}

export interface ServiceCard {
  id: string
  title: string
  body_text: string | null
  link_url: string | null
  sort_order: number
}

export interface WorkImage {
  id: string
  page: 'home' | 'about'
  image_url: string
  image_alt: string
  sort_order: number
}

export interface ClientLogo {
  id: string
  name: string
  logo_url: string
  logo_alt: string
  website_url: string | null
  sort_order: number
}

// ── About Us Page ─────────────────────────────────────────
export interface AboutUsPage extends PageRecord {
  hero_title: string | null
  intro_heading: string | null
  intro_column_1: string | null
  intro_column_2: string | null
  intro_column_3: string | null
  our_work_heading: string | null
  our_work_button_text: string | null
  our_work_button_url: string | null
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  sort_order: number
}

// ── Our Work Page ─────────────────────────────────────────
export interface OurWorkPage extends PageRecord {
  hero_title: string | null
  showreel_video_url: string | null
  showreel_poster_url: string | null
  showreel_poster_alt: string
}

export interface PortfolioItem {
  id: string
  title: string
  image_url: string
  image_alt: string
  brand: string | null
  brand_logo_url: string | null
  brand_logo_alt: string | null
  date: string | null
  description: string | null
  layout_side: 'left' | 'right'
  colour_scheme: 'light' | 'dark'
  link_url: string | null
  article_slug: string | null
  sort_order: number
}

// ── Pricing Page ──────────────────────────────────────────
export interface PricingPage extends PageRecord {
  page_title: string | null
}

export interface PricingCategory {
  id: string
  category_title: string
  category_key: string
  sort_order: number
}

export interface PricingCard {
  id: string
  category_id: string
  level_label: string | null
  package_title: string
  badge_text: string | null
  price_text: string
  card_theme: 'blue' | 'black'
  features: string[]
  sort_order: number
}

// ── Insights Page ─────────────────────────────────────────
export interface InsightsPage extends PageRecord {
  page_heading: string | null
}

export interface Article extends PageRecord {
  article_title: string
  slug: string
  publish_date: string | null
  featured_image_url: string | null
  featured_image_alt: string
  excerpt: string | null
  content_blocks: ContentBlock[]
  category: string | null
}

export type ContentBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: 2 | 3; content: string }
  | { type: 'image'; url: string; alt: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'cta'; text: string; url: string }

// ── Contact Us Page ───────────────────────────────────────
export interface ContactUsPage extends PageRecord {
  page_heading: string | null
  contact_address: string | null
  contact_phone: string | null
  contact_email: string | null
}

export interface EnquiryOption {
  id: string
  label: string
  sort_order: number
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  enquiry_type: string | null
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  submitted_at: string
  read_at: string | null
  replied_at: string | null
}
