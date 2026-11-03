# JURO — Jugnu Roshni Pvt. Ltd. Website

Corporate website for **Jugnu Roshni Pvt. Ltd. (JURO)** — *Shaping Strength, Delivering Precision*.

- Pages: Home, Products, 5 product category pages (/products/turned-components/ etc.), About Us, Infrastructure & Quality, Our Customers, Contact Us (+ Thank-you and 404)
- Floating **Enquire Now** side tab + **WhatsApp** button on every page; the tab opens a quick enquiry panel (same Netlify form)
- Admin panel at **`/admin`** (Decap CMS, GitHub login) — edit text, images, services, customers, contact details
- Enquiry form → saved in **Netlify Forms** + opens **WhatsApp** with a pre-filled message
- Fast static site, no frameworks, no npm dependencies. Hosted on **Netlify**, auto-deploys from **GitHub**

---

## 1. Folder structure

```
content/          ← all editable website content (JSON) — the CMS edits these files
  settings.json     company name, phones, WhatsApp, email, addresses
  home.json         home page text, banner images, numbers, strengths, process
  products.json     product cards + categories (add / edit / delete)
  about.json        story, vision, fact sheet, team
  infrastructure.json  capabilities, machines, works facts, quality checks
  customers.json    customer list
  contact.json      contact page text
static/           ← copied as-is to the site
  css/style.css     design & animations
  js/main.js        slider, animations, menu, form + WhatsApp
  images/           logo, product photos, banner images
  uploads/          images uploaded from the admin panel
admin/            ← Decap CMS (index.html + config.yml)
build.js          ← generates the website into /dist
netlify.toml      ← build command, publish folder, redirects, security headers
```

Build locally: `node build.js` → open `dist/index.html` via any static server (`npm start`).

---

## 2. One-time setup (GitHub + Netlify + admin login)

### Step A — Put the code on GitHub
1. Create a new **private** repository on GitHub, e.g. `jugnuroshni-website`.
2. Upload this folder (or `git remote add origin … && git push -u origin main`).
3. Open `admin/config.yml` and replace
   `REPLACE_WITH_GITHUB_USERNAME/jugnuroshni-website` with your real `username/repo`. Commit.

### Step B — Deploy on Netlify
1. Netlify → **Add new site → Import an existing project → GitHub** → choose the repo.
2. Build settings are read from `netlify.toml` automatically:
   - Build command: `node build.js`
   - Publish directory: `dist`
3. Deploy. You get a URL like `https://jugnuroshni.netlify.app`.
4. (Optional) **Domain management → Add domain** → `www.jugnuroshni.com`, then update DNS at your domain registrar as Netlify shows. HTTPS is automatic.
5. If the final address is different from `https://www.jugnuroshni.com`, change **Website address** in Admin → Company Details (and `site_url` in `admin/config.yml`). This updates the sitemap, canonical links and social previews.

### Step C — Enable admin login with GitHub (real OAuth, no fake login)
1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Application name: `JURO Website CMS`
   - Homepage URL: your Netlify site URL
   - Authorization callback URL: **`https://api.netlify.com/auth/done`**
   - Create, then **Generate a new client secret**. Copy Client ID + Secret.
2. Netlify → your project → **Project configuration → Security → OAuth → Authentication providers → Install provider → GitHub** → paste Client ID + Secret.
   (Secrets stay inside Netlify — nothing is stored in website code.)
3. Visit `https://<your-site>/admin/` → **Login with GitHub**.
   The admin's GitHub account must have **write access** to the repository. Only people with repo access can log in and edit — that keeps it single-admin.

### Step D — Enquiry notifications
1. After the first deploy, Netlify → **Forms** shows the `enquiry` form automatically.
2. **Forms → Form notifications → Add notification → Email** → `info@jugnuroshni.com` (or any address). Every enquiry is then emailed as well as stored in Netlify.
3. Spam protection: honeypot field is built in; you can also turn on Netlify's spam filter (on by default).

---

## 3. How to edit the website (for the admin)

1. Open **`https://<your-site>/admin/`** and click **Login with GitHub**.
2. Left menu:
   - **Website Pages → Home Page** — banner heading, **banner images** (add/remove/replace), numbers, strengths, process, industries
   - **Website Pages → Products Page** — under **Products** click **Add Product** (name, category, photo, description) to add a card, the **×** to delete, drag to reorder; **Product categories** holds the detailed category sections
   - **Website Pages → About Us / Our Customers / Contact Us** — page text, fact sheet, machines, customer list
   - **Company Details** — phone numbers, **WhatsApp number**, email, addresses, working hours
3. To change an image: click the image field → **Choose different image** → **Upload** → select from computer → **Insert**.
   Banner images: landscape, at least **1920 × 1080 px**, under ~400 KB (compress at tinypng.com).
4. Click **Publish → Publish now** (top right). Changes go live in **1–2 minutes** (GitHub commit → Netlify rebuild).
5. Mistake? Every publish is a GitHub commit — any change can be rolled back in Netlify → **Deploys → (old deploy) → Publish deploy**.

### What can be edited from the admin panel

| Admin section | What you can change |
|---|---|
| **Company Details** | Floating "Enquire Now" text, logo, company name, tagline, top-bar text, menu button text, phone numbers, WhatsApp number, email, both addresses (+ map), working hours, footer text, customer-strip label |
| **Home Page** | Customer testimonials (hidden until you add a real one), banner heading/sub-text/buttons, **banner images** (add, remove, replace), banner numbers, trust strip, intro text + image + badge, products section text, strengths, process steps, industries, FAQ, bottom call-to-action |
| **Products Page** | Banner image, headings, **product cards** (add / edit / delete, photo, category, description), category sections (text, range list, main image, gallery), features |
| **About Us Page** | Banner image, story text + image, vision, mentor box, fact sheet, team roles, all section headings |
| **Infrastructure & Quality Page** | Banner, capabilities, machines list, works facts, quality text and checks, certifications note (only real certificates) |
| **Our Customers Page** | Banner image, headings, customer list (add / edit / delete) with optional customer logo |
| **Contact Us Page** | Banner image, headings, form text, thank-you message, location headings |
| Every page | Google title and description (SEO) |

Not editable from the admin (change in code if ever needed): the site colours/design, form field labels and error messages, small button words such as "Enquire" / "All products", and the browser-tab icon (favicon).

Tips: In multi-paragraph text boxes, leave a blank line between paragraphs. In the Home "Main heading", press Enter where you want the line break.

---

## 4. Features implemented

| Area | What's included |
|---|---|
| Design | Dark industrial theme (#101419 background, steel-blue #3B82A0 and cyan #45C4D8 accents), Space Grotesk + Inter typography, transparent-to-dark header; genuine product photos on light studio panels; previously navy/steel palette from the JURO logo + amber "firefly" accent (Jugnu Roshni); Archivo + IBM Plex typography; blueprint-grid engineering visual language |
| Home banner | 4 banner images; a **random different one is shown on every fresh visit**, then crossfade every 7 s with slow zoom; progress dots; fireflies effect |
| Animations | Page loader (first visit only), line-by-line hero text, word-by-word page titles, scroll reveals, image wipe reveals, parallax banners, card 3D tilt, magnetic buttons, button shine, counters (verified figures only), page fade transitions, dropdown & mobile menu animations, marquee of customers, WhatsApp pulse |
| Accessibility | Respects *reduce motion* setting, skip link, keyboard focus styles, labelled form fields with inline errors, alt text, ARIA on slider/menu |
| Products | Product catalogue with category filter buttons, product cards (photo zoom, Enquire + WhatsApp per product), detailed category sections with gallery lightbox; old /services/ links redirect to /products/ |
| Enquiry | Validation (Indian mobile, email, required fields), Netlify Forms submission, success only shown after confirmed save, WhatsApp opens with formatted enquiry, honeypot spam trap, thank-you page fallback without JavaScript |
| Contact | Click-to-call for both contact persons, floating WhatsApp + call buttons, Google Maps for works & head office |
| SEO | Unique titles/descriptions, canonical URLs, Open Graph + Twitter cards, Organization JSON-LD, sitemap.xml, robots.txt, clean URLs, redirects (/about-us → /about/ …) |
| Speed | No framework, ~30 KB CSS+JS, responsive banner images (960/1920), lazy loading, long-cache headers |
| Security | Security headers (HSTS, nosniff, frame, referrer, permissions), admin `noindex`, OAuth secrets only in Netlify |

---

## 5. Testing report (automated headless Chrome, before delivery)

| Check | Mobile 390 px | Tablet 820 px | Desktop 1440 px |
|---|---|---|---|
| All 5 pages + thank-you + 404 load | ✅ | ✅ | ✅ |
| No horizontal scroll | ✅  | ✅ | ✅ |
| JavaScript errors | none | none | none |
| Broken internal links / missing images | none | none | none |
| Mobile menu opens/closes | ✅ | ✅ | n/a (desktop nav + dropdown) |
| Banner starts on a different image on refresh | ✅ (4 different starts in 5 loads) | ✅ | ✅ |
| Form: empty submit shows 5 field errors | ✅ | ✅ | ✅ |
| Form: `?service=` pre-selects product | ✅ | | |
| Form: valid submit → success message + WhatsApp URL with formatted message | ✅ | | |

**Still to verify after going live** (needs real Netlify + GitHub, cannot be tested offline):
Netlify Forms receiving entries, admin GitHub login, image upload + publish → auto-deploy, Lighthouse score on the live URL, real iPhone Safari / Android Chrome check.

---

## 6. Pending company information / approvals

Confirmed by client (31 Oct 2026):
- WhatsApp number: **+91 90455 06413 (Mr. Manish Kumar)**
- Turnover: **not shown** on the website
- Experience: shown as **"promoters have 10+ years of experience"** (company itself established 2023); Krishna Engineering not mentioned
- Working hours: **not shown** (can be added later in Admin → Company Details)

Still pending:
1. **GitHub + Netlify access** for deployment (or follow Steps A–D above).
2. **Domain** — set as `www.jugnuroshni.com`. Confirm.
3. **Real photos** of workshop, machines, press tools, elevator parts and fabrication work.
4. **Customer names** — confirm all 10 can be shown publicly.
5. **Head office spelling** — "Panchsheel Greens-2" (profile says "Punchsheel Green-2").
6. Optional: designations for contact persons, GSTIN, certifications, social media links.

## 7. Suggested next improvements
- Add real workshop/machine photos and a short factory video to the Home banner.
- Downloadable company profile PDF on About page.
- Google Business Profile for both addresses (helps "near me" searches).
- Add GSTIN and Udyam number in footer for B2B trust.
- Product-wise sub-pages once more product photos are available.
