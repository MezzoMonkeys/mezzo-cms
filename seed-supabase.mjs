/**
 * Mezzo Supabase seeder — safe mode.
 * Only fills fields that are null/empty. Never overwrites user-entered data.
 * Run: node seed-supabase.mjs <SERVICE_ROLE_KEY>
 */

import initSqlJs from 'sql.js'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://psycpnkxukydrjwdkaqm.supabase.co'
const SERVICE_ROLE_KEY = process.argv[2]

if (!SERVICE_ROLE_KEY) {
  console.error('Usage: node seed-supabase.mjs <SERVICE_ROLE_KEY>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x2B;/gi, '+')
    .replace(/&#x26;/gi, '&')
    .replace(/&[a-z#0-9]+;/gi, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
}

function featuresFromMarkup(markupJson) {
  try {
    const parsed = JSON.parse(markupJson)
    const markup = parsed?.markup || ''
    return stripHtml(markup)
  } catch {
    return []
  }
}

async function safePatch(table, id, patch) {
  // Only set fields that are null/empty in the existing record
  const { data: existing } = await supabase.from(table).select('*').eq('id', id).single()
  if (!existing) return
  const safe = {}
  for (const [k, v] of Object.entries(patch)) {
    const cur = existing[k]
    const isEmpty = cur === null || cur === undefined || cur === '' ||
      (Array.isArray(cur) && cur.length === 0)
    if (isEmpty) safe[k] = v
  }
  if (Object.keys(safe).length === 0) {
    console.log(`  [skip] ${table} — all fields already populated`)
    return
  }
  const { error } = await supabase.from(table).update(safe).eq('id', id)
  if (error) console.error(`  [error] ${table}:`, error.message)
  else console.log(`  [ok] ${table} — updated:`, Object.keys(safe).join(', '))
}

// ── Main ──────────────────────────────────────────────────────────────────────

const DB_PATH = 'M:/MEZZO/MARKETING/WEBSITE/MEZZO_SITE/umbraco/Data/Mezzo.sqlite.db'
const SQL = await initSqlJs()
const db = new SQL.Database(readFileSync(DB_PATH))

const result = db.exec(`
  SELECT n.text as page_name, pt.Alias as alias, pd.textValue, pd.varcharValue
  FROM umbracoPropertyData pd
  JOIN umbracoContentVersion cv ON pd.versionId = cv.id
  JOIN umbracoContent c ON cv.nodeId = c.nodeId
  JOIN umbracoNode n ON c.nodeId = n.id
  JOIN cmsPropertyType pt ON pd.propertytypeid = pt.id
  WHERE cv.current = 1 AND (pd.textValue IS NOT NULL OR pd.varcharValue IS NOT NULL)
  ORDER BY n.text, pt.Alias
`)

const rows = result[0]?.values || []
const umb = {}
for (const [page, alias, text, varchar] of rows) {
  if (!umb[page]) umb[page] = {}
  umb[page][alias] = text || varchar
}

// ── Parse Pricing ─────────────────────────────────────────────────────────────

const pricingJson = JSON.parse(umb['Pricing']['pricingCatagories'])
const pricingCats = []
for (const cat of pricingJson.contentData) {
  const vals = {}
  for (const v of (cat.values || [])) vals[v.alias] = v.value
  const cards = []
  if (vals.pricingCards) {
    try {
      const cardsJson = JSON.parse(vals.pricingCards)
      for (const card of (cardsJson.contentData || [])) {
        const cv = {}
        for (const v of (card.values || [])) cv[v.alias] = v.value
        cards.push(cv)
      }
    } catch {}
  }
  pricingCats.push({ title: vals.categoryTitle, key: vals.categoryKey, cards })
}

// ── Parse Work Items ──────────────────────────────────────────────────────────

const workJson = JSON.parse(umb['Our Work']['workitems'])
const workItems = []
for (const item of workJson.contentData) {
  const vals = {}
  for (const v of (item.values || [])) vals[v.alias] = v.value
  if (vals.portfolioText) workItems.push(vals)
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Singleton page updates (safe — only fills null fields)
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n── Home Page ───────────────────────────────')
const { data: homeRows } = await supabase.from('home_page').select('id').limit(1)
if (homeRows?.[0]) {
  await safePatch('home_page', homeRows[0].id, {
    hero_subheading: 'Specialist Advertising for the Building & Plumbing Industry',
    brand_title: 'The Brand Builders',
    brand_subtitle: 'Mezzo is a specialist advertising studio and the leading agency dedicated to the plumbing and building industry. We partner with manufacturers and retailers to develop brands, campaigns, and marketing systems engineered to perform across trade, retail, and digital environments—where real purchasing decisions happen. Our focus is singular. Our understanding is deep. Every decision we make is informed by industry expertise, real-world sales dynamics, and proven brand growth. Strategy-led. Creatively driven. Built for the trade.',
    service_section_heading: 'What we do',
    our_work_heading: 'Our Work',
    our_work_button_text: 'View More',
    clients_title: 'Our Clients',
    status: 'published',
  })
}

console.log('\n── About Us Page ───────────────────────────')
const { data: aboutRows } = await supabase.from('about_us_page').select('id').limit(1)
if (aboutRows?.[0]) {
  await safePatch('about_us_page', aboutRows[0].id, {
    hero_title: 'Leaders in specialist marketing and brand development for the plumbing and building industry.',
    intro_heading: 'Making brands an appreciating asset since 2013',
    intro_column_1: 'We are a specialist marketing agency focused entirely on the plumbing, building, and construction industry. Our deep sector expertise means we understand your customers, your channels, and your challenges like no generalist agency can.',
    intro_column_2: 'Over more than a decade, we have helped brands at every stage of their journey — from ambitious start-ups finding their voice to established market leaders defending and growing their position.',
    intro_column_3: 'Our integrated approach covers brand strategy, creative, digital, content, and campaigns — all under one roof, all informed by genuine industry knowledge and a commitment to measurable results.',
    our_work_heading: 'Our Work',
    our_work_button_text: 'View More',
    status: 'published',
  })
}

console.log('\n── Contact Us Page ─────────────────────────')
const { data: contactRows } = await supabase.from('contact_us_page').select('id').limit(1)
if (contactRows?.[0]) {
  await safePatch('contact_us_page', contactRows[0].id, {
    page_heading: 'Contact Us',
    contact_address: umb['Contact Us']['contactAddress'],
    contact_email: umb['Contact Us']['contactEmail'],
    contact_phone: umb['Contact Us']['contactPhone'],
    status: 'published',
  })
}

console.log('\n── Our Work Page ───────────────────────────')
const { data: workPageRows } = await supabase.from('our_work_page').select('id').limit(1)
if (workPageRows?.[0]) {
  await safePatch('our_work_page', workPageRows[0].id, {
    hero_title: 'Our Work',
    status: 'published',
  })
}

console.log('\n── Insights Page ───────────────────────────')
const { data: insightsRows } = await supabase.from('insights_page').select('id').limit(1)
if (insightsRows?.[0]) {
  await safePatch('insights_page', insightsRows[0].id, {
    page_heading: 'Insights',
    status: 'published',
  })
}

console.log('\n── Pricing Page ────────────────────────────')
const { data: pricingPageRows } = await supabase.from('pricing_page').select('id').limit(1)
if (pricingPageRows?.[0]) {
  await safePatch('pricing_page', pricingPageRows[0].id, {
    page_title: 'Our Pricing',
    status: 'published',
  })
}

// ── Remove duplicate pricing_page rows (keep only earliest) ──────────────────
const { data: allPricingPages } = await supabase.from('pricing_page').select('id, created_at').order('created_at')
if (allPricingPages && allPricingPages.length > 1) {
  const dupes = allPricingPages.slice(1).map(r => r.id)
  await supabase.from('pricing_page').delete().in('id', dupes)
  console.log(`  [ok] removed ${dupes.length} duplicate pricing_page row(s)`)
}

// ── Remove duplicate our_work_page rows ──────────────────────────────────────
const { data: allWorkPages } = await supabase.from('our_work_page').select('id, created_at').order('created_at')
if (allWorkPages && allWorkPages.length > 1) {
  const dupes = allWorkPages.slice(1).map(r => r.id)
  await supabase.from('our_work_page').delete().in('id', dupes)
  console.log(`  [ok] removed ${dupes.length} duplicate our_work_page row(s)`)
}

// ── Remove duplicate insights_page rows ──────────────────────────────────────
const { data: allInsights } = await supabase.from('insights_page').select('id, created_at').order('created_at')
if (allInsights && allInsights.length > 1) {
  const dupes = allInsights.slice(1).map(r => r.id)
  await supabase.from('insights_page').delete().in('id', dupes)
  console.log(`  [ok] removed ${dupes.length} duplicate insights_page row(s)`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. FAQ Items — only seed if table is empty
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n── FAQ Items ───────────────────────────────')
const { data: existingFaqs } = await supabase.from('faq_items').select('id').limit(1)
if (!existingFaqs || existingFaqs.length === 0) {
  const faqs = [
    { question: 'What industries do you specialise in?', answer: 'We focus exclusively on the plumbing, heating, bathroom, building, and construction industry. This means everything we do is informed by genuine sector knowledge — from the way tradespeople make purchase decisions to the role specifiers play in product selection.' },
    { question: 'What services do you offer?', answer: 'We offer end-to-end marketing services including brand strategy, identity design, digital marketing, content production, campaign management, and website development. We work as a fully integrated partner or to complement your existing in-house team.' },
    { question: 'How do you measure success?', answer: 'We set clear KPIs at the outset of every engagement and report against them regularly. Depending on the brief, this might include brand awareness metrics, lead generation targets, digital performance data, or share of voice in your market.' },
    { question: 'Do you work with smaller brands as well as large ones?', answer: 'Yes. We work with businesses of all sizes — from growing independents to multinational brands. We tailor our approach and investment levels to match your stage of growth and objectives.' },
    { question: 'Where are you based?', answer: 'We are based in Botha\'s Hill, Durban, South Africa, and work with clients across the country and internationally.' },
  ]
  const { error } = await supabase.from('faq_items').insert(faqs.map((f, i) => ({ ...f, sort_order: i })))
  if (error) console.error('  [error] faq_items:', error.message)
  else console.log(`  [ok] inserted ${faqs.length} FAQ items`)
} else {
  console.log('  [skip] faq_items already has data')
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. Pricing Categories & Cards — only seed if tables are empty
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n── Pricing Categories & Cards ──────────────')
const { data: existingCats } = await supabase.from('pricing_categories').select('id').limit(1)
if (!existingCats || existingCats.length === 0) {
  for (let i = 0; i < pricingCats.length; i++) {
    const cat = pricingCats[i]
    const { data: catRow, error: catErr } = await supabase
      .from('pricing_categories')
      .insert({ category_title: cat.title, category_key: cat.key, sort_order: i })
      .select()
      .single()
    if (catErr) { console.error(`  [error] category ${cat.title}:`, catErr.message); continue }
    console.log(`  [ok] category: ${cat.title}`)

    if (cat.cards.length) {
      const cardInserts = cat.cards.map((c, j) => ({
        category_id: catRow.id,
        level_label: c.levellabel || null,
        package_title: c.packageTitle || '',
        badge_text: c.badgeText || null,
        price_text: c.priceText || 'TBC',
        card_theme: c.cardTheme || 'blue',
        features: featuresFromMarkup(c.features || '{}'),
        sort_order: j,
      }))
      const { error: cardErr } = await supabase.from('pricing_cards').insert(cardInserts)
      if (cardErr) console.error(`    [error] cards for ${cat.title}:`, cardErr.message)
      else console.log(`    [ok] inserted ${cardInserts.length} cards`)
    }
  }
} else {
  // Categories exist — just update features on cards that have empty features
  console.log('  categories exist — patching empty card features only')
  const { data: allCats } = await supabase.from('pricing_categories').select('id, category_key')
  for (const umCat of pricingCats) {
    const dbCat = allCats?.find(c => c.category_key === umCat.key)
    if (!dbCat) continue
    const { data: dbCards } = await supabase
      .from('pricing_cards')
      .select('id, package_title, features')
      .eq('category_id', dbCat.id)
    for (const umCard of umCat.cards) {
      const dbCard = dbCards?.find(c => c.package_title === umCard.packageTitle)
      if (!dbCard) continue
      const isEmpty = !dbCard.features || dbCard.features.length === 0
      if (!isEmpty) continue
      const features = featuresFromMarkup(umCard.features || '{}')
      const priceText = umCard.priceText || 'TBC'
      const badgeText = umCard.badgeText || null
      const cardTheme = umCard.cardTheme || 'blue'
      const { error } = await supabase
        .from('pricing_cards')
        .update({ features, price_text: priceText, badge_text: badgeText, card_theme: cardTheme })
        .eq('id', dbCard.id)
      if (error) console.error(`    [error] card ${umCard.packageTitle}:`, error.message)
      else console.log(`    [ok] patched card: ${umCard.packageTitle} (${features.length} features, ${priceText})`)
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. Portfolio Items — only seed if table is empty
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n── Portfolio Items ─────────────────────────')
const { data: existingPortfolio } = await supabase.from('portfolio_items').select('id').limit(1)
if (!existingPortfolio || existingPortfolio.length === 0) {
  const items = workItems.map((item, i) => ({
    title: item.portfolioText || '',
    brand: item.brand || null,
    date: item.date || null,
    description: item.description || null,
    layout_side: item.layoutSide === 'right' ? 'right' : 'left',
    colour_scheme: item.colourSelector === 'dark' ? 'dark' : 'light',
    image_url: '',
    image_alt: '',
    sort_order: i,
  }))
  const { error } = await supabase.from('portfolio_items').insert(items)
  if (error) console.error('  [error] portfolio_items:', error.message)
  else console.log(`  [ok] inserted ${items.length} portfolio items`)
} else {
  console.log('  [skip] portfolio_items already has data')
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. Enquiry Options — only seed if table is empty
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n── Enquiry Options ─────────────────────────')
const { data: existingEnquiry } = await supabase.from('enquiry_options').select('id').limit(1)
if (!existingEnquiry || existingEnquiry.length === 0) {
  const options = ['Brand Strategy', 'Social Media Management', 'Content Creation', 'Website Design', 'Package Enquiry', 'Custom Package', 'Other']
  const { error } = await supabase.from('enquiry_options').insert(options.map((label, i) => ({ label, sort_order: i })))
  if (error) console.error('  [error] enquiry_options:', error.message)
  else console.log(`  [ok] inserted ${options.length} enquiry options`)
} else {
  console.log('  [skip] enquiry_options already has data')
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. Site Settings — only seed if table is empty
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n── Site Settings ───────────────────────────')
const { data: existingSettings } = await supabase.from('site_settings').select('id').limit(1)
if (!existingSettings || existingSettings.length === 0) {
  const { error } = await supabase.from('site_settings').insert({
    copyright_text: '© 2025 Mezzo. All rights reserved.',
    footer_description: 'Specialist marketing and brand development for the plumbing and building industry.',
    instagram_url: null,
    linkedin_url: null,
    facebook_url: null,
  })
  if (error) console.error('  [error] site_settings:', error.message)
  else console.log('  [ok] inserted site_settings')
} else {
  console.log('  [skip] site_settings already has data')
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. Footer Links — only seed if table is empty
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n── Footer Links ────────────────────────────')
const { data: existingLinks } = await supabase.from('footer_links').select('id').limit(1)
if (!existingLinks || existingLinks.length === 0) {
  const links = [
    { name: 'About Us', url: '/about-us/', target: '_self' },
    { name: 'Our Work', url: '/our-work/', target: '_self' },
    { name: 'Pricing', url: '/pricing/', target: '_self' },
    { name: 'Insights', url: '/insights/', target: '_self' },
    { name: 'Contact Us', url: '/contact-us/', target: '_self' },
  ]
  const { error } = await supabase.from('footer_links').insert(links.map((l, i) => ({ ...l, sort_order: i })))
  if (error) console.error('  [error] footer_links:', error.message)
  else console.log(`  [ok] inserted ${links.length} footer links`)
} else {
  console.log('  [skip] footer_links already has data')
}

console.log('\n✓ Seed complete\n')
