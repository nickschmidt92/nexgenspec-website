# D.I.A. Inspections — Design Brief for Redesign

**Source site:** https://diainspections.com (current site has an expired/invalid SSL cert — flag this to the owner, any redesign must ship with a valid cert)
**Fetched:** 2026-04-18
**Current platform:** Zyro (all assets served from `assets.zyrosite.com` / `cdn.zyrosite.com`) — likely drop-in replaceable with any modern stack.

---

## 1. Business summary

**Name:** D.I.A. Inspections (sometimes "d.i.a. Inspections" lowercase)
**Location:** Commerce City, Colorado
**Service area:** Denver Metro + surrounding counties — Adams, Weld, Boulder, Arapahoe, Jefferson
**Tagline candidates pulled from site:**
- "Trusted Home Inspections. Clear, Actionable Results."
- "Same-day reports. Clear photos. No pressure, no upsells."
- "Trusted Inspections, Every Time."

**Positioning claims:** Licensed, certified, insured. "Local Experts." 150+ (inspections?), 15+ (years?) — the numerical badges are on the homepage but unitless in current copy; should be clarified on the redesign.

**Hours:** Tues – Sat, 8am – 5pm

**Contact:**
- Phone: (303) 720-6890
- Email: contact@diainspections.com

**Payment:** Cash, Zelle, debit, credit — due at end of inspection.

---

## 2. Sitemap (current)

| Page | URL | Priority |
|---|---|---|
| Home | `/` | 1.0 |
| Services | `/services` | 0.5 |
| About | `/about` | 0.5 |
| Contact | `/contact` | 0.5 |
| Appointments | `/appointments` | 0.5 |

The Appointments page is almost empty in the extracted HTML — appears to be a booking widget embed that isn't rendering in static fetch. Likely an iframe to a scheduler (Calendly / Zyro native).

---

## 3. Services offered (three main buckets)

1. **Home Inspections** — "Detailed checks covering structure, systems, and safety." For new and existing homes.
2. **Commercial Inspections** — "Certified inspections for offices, retail, and new builds."
3. **Specialty / Extras**
   - Radon testing
   - Thermal imaging
   - Pest inspections
   - Sewer scope
   - Water testing
   - Energy analysis
   - Pool inspections
   - Duct leakage testing

**Inspection duration:** 2–4 hours depending on property size.
**Report delivery:** Same-day, digital, with photos, optional add-ons.

---

## 4. Key copy blocks (verbatim, for reuse)

**Hero (home):**
> Trusted Home Inspections. Clear, Actionable Results.
> Same-day reports. Clear photos. No pressure, no upsells.
> Serving Denver Metro and surrounding counties with thorough, unbiased inspections.

**About blurb:**
> D.I.A. Inspections is a locally owned company serving the Denver Metro area, focused on clear communication, detailed reporting, and inspections you can understand.

**Services hero:**
> We Are Here To Help!
> Thorough inspections for homes and businesses across Denver metro & Colorado! Residential and commercial inspections, plus specialized testing services to help you make confident decisions.

**One testimonial on file (Services page):**
> "d.i.a. inspections gave me peace of mind with their thorough home inspection and radon testing—highly recommend their friendly, professional service." — J. M. ★★★★★

**FAQ (already written — reuse on redesign):**
1. *What inspections do you offer?* — home, commercial, radon, pest, sewer scope, and more.
2. *Are you licensed and insured?* — Yes, fully licensed, certified, and insured.
3. *Which areas do you serve?* — Commerce City, Denver metro, Adams, Weld, Boulder, Arapahoe, Jefferson.
4. *How long does an inspection take?* — 2–4 hours depending on property size.
5. *Do you offer additional services?* — Yes — thermal imaging, energy analysis, pool inspections.
6. *When do I get the report?* — Same day, digital, with photos and optional add-ons.
7. *How is payment handled?* — Due at end of inspection — cash, Zelle, debit, credit.

---

## 5. Brand assets (downloaded locally)

- `dia_logo.png` — transparent-background primary logo (D.I.A. Inspections text mark)
  - Original: `https://assets.zyrosite.com/XTZ8u8qOt4LIsQJt/transparent_background-removebg-preview-ArkPwh9SXJQxy2sd.png`
- `dia_logo_large.png` — alternate "d.i.a. solutions logo - final - large"
  - Original: `https://assets.zyrosite.com/XTZ8u8qOt4LIsQJt/d.i.a.-solutions-logo---final---large-XCCSd10cB8EbnmuE.png`

All hero/marketing photos currently used on the site are stock Unsplash photos (not owned by DIA). Redesign should either license proper photos, commission local Denver-area shoots, or continue using Unsplash with attribution if still appropriate.

---

## 6. Design tokens (as detected in the current site CSS)

These are mostly **Zyro builder defaults** — not a curated brand palette. Treat them as a starting point, not a constraint:

- **Fonts in use:** Inter, Open Sans, Roboto (via CSS vars `--font-primary`, `--font-secondary`). No Google Fonts link tags — fonts loaded via Zyro CDN.
- **Prominent colors in CSS (mix of builder defaults + brand):**
  - Neutrals: `#0d141a`, `#1d1e20`, `#36344d`, `#727586`, `#ffffff`, `#f2f3f6`, `#dadce0`
  - Teal/green: `#008361`, `#00b090`, `#def4f0` — plausible primary brand accent
  - Blues: `#265ab2`, `#357df9`, `#e3ebf9`
  - Purples (probably Zyro UI, not brand): `#5025d1`, `#673de6`, `#6366F1`, `#2f1c6a`, `#1F1346`
  - Warm accents: `#fea419`, `#ffcd35`, `#fc5185`, `#d63163`

**Recommendation:** The teal/green (`#008361`) + deep charcoal (`#0d141a`) combo reads as the intended brand direction. Blues and purples appear to be builder chrome. Confirm with Travis/owner before locking a palette.

---

## 7. Forms / conversion paths

- Every page has a trailing "Please Reach Us At:" section with a 2-field form (Name + Phone/Email). Not form-submitted fields — placeholders only, no `name` attribute; likely wired up via Zyro builder.
- Email newsletter signup ("Monthly Maintenance Checklist?") on homepage — 1-field email capture. Good lead magnet idea to preserve.
- Contact page has a duplicate name+email form.
- Appointments page embeds a scheduling widget (not captured in static fetch).

**CTAs the current site relies on:** "Appointments" nav link, phone number, email. No visible pricing CTAs, no sample-report download, no online booking form directly on services page — all conversion funnels through the /appointments widget.

---

## 8. Recommendations for the redesign (high-level)

1. **Fix the SSL cert** on any new deployment — current cert is invalid/expired.
2. **Dedupe content** — every page's headings appear twice in the DOM (desktop + mobile duplicate blocks). Cleaner responsive CSS eliminates this.
3. **Clarify the 150+ / 15+ badges** — they're unitless. "150+ inspections" vs "15+ years" should be explicit.
4. **Add a sample report download** — biggest trust-builder for inspection sites; currently absent.
5. **Add online booking directly in the flow**, not just on a separate /appointments page.
6. **Tighten the legal/terms dump on /contact** — move to a dedicated /terms page.
7. **Replace stock Unsplash heroes** with real photos of the inspector on-site in Denver metro — builds local trust.
8. **SEO:** every page has nearly identical meta description. Differentiate per-page titles/descriptions.
9. **Consider structured data** (LocalBusiness schema) — none detected currently.

---

## 9. Files in this research bundle

```
dia-research/
├── dia_home.html           # raw HTML of /
├── dia_services.html       # raw HTML of /services
├── dia_about.html          # raw HTML of /about
├── dia_contact.html        # raw HTML of /contact
├── dia_appointments.html   # raw HTML of /appointments
├── sitemap.xml             # current sitemap
├── robots.txt              # current robots
├── dia_logo.png            # primary logo, transparent bg
├── dia_logo_large.png      # large "solutions" logo variant
├── extracted.json          # structured dump (headings, copy, forms, images, design tokens)
├── dia_brief.md            # long-form per-page content dump
└── DESIGN_BRIEF.md         # this file
```
