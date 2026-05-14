import initSqlJs from 'sql.js'
import { readFileSync } from 'fs'

const dbPath = 'M:/MEZZO/MARKETING/WEBSITE/MEZZO_SITE/umbraco/Data/Mezzo.sqlite.db'
const SQL = await initSqlJs()
const db = new SQL.Database(readFileSync(dbPath))

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

function extractValues(obj, results = []) {
  if (!obj || typeof obj !== 'object') return results
  if (typeof obj.value === 'string' && obj.value.trim()) results.push({ alias: obj.alias, value: obj.value.trim() })
  if (typeof obj.markup === 'string') {
    const clean = obj.markup.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim()
    if (clean) results.push({ alias: 'markup', value: clean })
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) v.forEach(i => extractValues(i, results))
    else if (typeof v === 'object') extractValues(v, results)
  }
  return results
}

const rows = result[0]?.values || []
const data = {}
for (const [page, alias, text, varchar] of rows) {
  if (!data[page]) data[page] = {}
  data[page][alias] = text || varchar
}

// ── Parse pricing categories + cards ──────────────────────────
const pricingJson = JSON.parse(data['Pricing']['pricingCatagories'])
const cats = []
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
  cats.push({ title: vals.categoryTitle, key: vals.categoryKey, cards })
}

// ── Parse work items ───────────────────────────────────────────
const workJson = JSON.parse(data['Our Work']['workitems'])
const workItems = []
for (const item of workJson.contentData) {
  const vals = {}
  for (const v of (item.values || [])) vals[v.alias] = v.value
  if (vals.portfolioText) workItems.push(vals)
}

// ── Build SQL ─────────────────────────────────────────────────
const q = s => s.replace(/'/g, "''")

let sql = `-- ============================================================
-- MEZZO UMBRACO IMPORT — Run in Supabase SQL Editor
-- ============================================================

-- Home Page
UPDATE public.home_page SET
  hero_subheading = '${q(data['Mezzo home']['pageSections'] ? 'Specialist Advertising for the Building & Plumbing Industry' : '')}',
  brand_title = 'The Brand Builders',
  brand_subtitle = '${q('Mezzo is a specialist advertising studio and the leading agency dedicated to the plumbing and building industry. We partner with manufacturers and retailers to develop brands, campaigns, and marketing systems engineered to perform across trade, retail, and digital environments—where real purchasing decisions happen. Our focus is singular. Our understanding is deep. Every decision we make is informed by industry expertise, real-world sales dynamics, and proven brand growth. Strategy-led. Creatively driven. Built for the trade.')}',
  service_section_heading = 'What we do',
  our_work_heading = 'Our Work',
  our_work_button_text = 'View More',
  clients_title = 'Our Clients',
  status = 'published'
WHERE id = (SELECT id FROM public.home_page LIMIT 1);

-- Contact Us Page
UPDATE public.contact_us_page SET
  page_heading = 'Contact Us',
  contact_address = '${q(data['Contact Us']['contactAddress'])}',
  contact_email = '${q(data['Contact Us']['contactEmail'])}',
  contact_phone = '${q(data['Contact Us']['contactPhone'])}',
  status = 'published'
WHERE id = (SELECT id FROM public.contact_us_page LIMIT 1);

-- Insights Page
UPDATE public.insights_page SET
  page_heading = 'Insights',
  status = 'published'
WHERE id = (SELECT id FROM public.insights_page LIMIT 1);

-- Our Work Page
UPDATE public.our_work_page SET
  hero_title = 'Our Work',
  status = 'published'
WHERE id = (SELECT id FROM public.our_work_page LIMIT 1);

-- Pricing Page
UPDATE public.pricing_page SET
  page_title = 'Our Pricing',
  status = 'published'
WHERE id = (SELECT id FROM public.pricing_page LIMIT 1);

-- Enquiry Options (replace seed data)
DELETE FROM public.enquiry_options;
INSERT INTO public.enquiry_options (label, sort_order) VALUES
`

const enquiryOptions = ['Brand Strategy', 'Social Media Management', 'Content Creation', 'Website Design', 'Package Enquiry', 'Custom Package', 'Other']
sql += enquiryOptions.map((o, i) => `  ('${o}', ${i})`).join(',\n') + ';\n\n'

// Pricing categories + cards
sql += `-- Pricing Categories (replace seed data)
DELETE FROM public.pricing_cards;
DELETE FROM public.pricing_categories;
`
for (let i = 0; i < cats.length; i++) {
  const cat = cats[i]
  sql += `INSERT INTO public.pricing_categories (id, category_title, category_key, sort_order)
VALUES (gen_random_uuid(), '${q(cat.title)}', '${q(cat.key)}', ${i});\n`
}
sql += '\n'

for (const cat of cats) {
  if (!cat.cards.length) continue
  sql += `-- Cards for ${cat.title}\n`
  sql += `WITH cat AS (SELECT id FROM public.pricing_categories WHERE category_key = '${cat.key}')\n`
  sql += `INSERT INTO public.pricing_cards (category_id, level_label, package_title, price_text, card_theme, features, sort_order)\n`
  sql += `SELECT cat.id, v.level_label, v.package_title, v.price_text, v.card_theme, v.features::text[], v.sort_order\nFROM cat, (VALUES\n`
  sql += cat.cards.map((c, i) => {
    const pts = Array.isArray(c.bulletPoints) ? c.bulletPoints : []
    const features = pts.length ? `{${pts.map(p => `"${String(p).replace(/"/g, '\\"')}"`).join(',')}}` : '{}'
    return `  ('${q(c.levellabel||'')}', '${q(c.packageTitle||'')}', '${q(c.price||'TBC')}', '${q(c.cardColour||'blue')}', '${features}', ${i})`
  }).join(',\n')
  sql += `\n) AS v(level_label, package_title, price_text, card_theme, features, sort_order);\n\n`
}

// Portfolio items
sql += `-- Portfolio Items (replace seed data)
DELETE FROM public.portfolio_items;
INSERT INTO public.portfolio_items (title, brand, date, description, layout_side, colour_scheme, sort_order) VALUES
`
sql += workItems.map((item, i) => {
  const side = item.layoutSide === 'right' ? 'right' : 'left'
  const scheme = item.colourSelector === 'dark' ? 'dark' : 'light'
  return `  ('${q(item.portfolioText||'')}', '${q(item.brand||'')}', '${q(item.date||'')}', '${q(item.description||'')}', '${side}', '${scheme}', ${i})`
}).join(',\n') + ';\n'

console.log(sql)
