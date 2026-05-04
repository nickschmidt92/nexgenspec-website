# Prompt for Claude Design — D.I.A. Inspections Website Redesign

## Who I am & what I want

I'm working with D.I.A. Inspections, a licensed home & commercial inspection company based in Commerce City, Colorado. Their current site is at https://diainspections.com (note: SSL cert is currently broken — redesign must ship with a valid cert). I want you to redesign the site so it (a) converts more visitors into booked inspections, (b) looks like a trustworthy modern local business, and (c) is easy for the owner to maintain after launch.

## What's attached in this bundle

The `dia-research/` folder next to this prompt contains everything I've pulled from the live site:

- **`DESIGN_BRIEF.md`** — read this first. Condensed brand, copy, services, tokens, and my initial recommendations.
- **`dia_brief.md`** — full verbatim copy from every page (hero text, paragraphs, FAQs, testimonial, legal) ready to reuse.
- **`extracted.json`** — structured dump: headings, forms, images, detected colors, detected fonts.
- **`dia_home.html`, `dia_services.html`, `dia_about.html`, `dia_contact.html`, `dia_appointments.html`** — raw HTML of each page if you want to audit the DOM.
- **`dia_logo.png`, `dia_logo_large.png`** — the two existing logo files.
- **`sitemap.xml`, `robots.txt`** — current crawl config.

Treat all copy in `dia_brief.md` as reusable; rewrite where the current wording is weak.

## Business facts (locked)

- **Company:** D.I.A. Inspections (also styled "d.i.a. Inspections")
- **Based in:** Commerce City, CO
- **Service area:** Denver Metro + Adams, Weld, Boulder, Arapahoe, Jefferson counties
- **Phone:** (303) 720-6890
- **Email:** contact@diainspections.com
- **Hours:** Tues – Sat, 8am – 5pm
- **Payment:** cash, Zelle, debit, credit — due at end of inspection
- **Report turnaround:** same day, digital, with photos
- **Inspection duration:** 2–4 hours
- **Services:** home inspections, commercial inspections, radon, thermal imaging, pest, sewer scope, water testing, energy analysis, pool inspections, duct leakage testing
- **Credentials to feature:** licensed, certified, insured (copy to verify which specific certs — InterNACHI / ASHI / state license #)

## My answers to the open questions

*(Nick: fill in the blanks below before handing this prompt to Claude Design. Anywhere you leave `TBD`, Claude Design will make a reasonable assumption and flag it.)*

1. **Primary goal of the redesign:** TBD
   *(e.g. "more booked inspections from homebuyers", "look credible to realtors who refer", "rank in Denver home-inspection search", "all of the above")*

2. **Target buyer (pick one primary, others secondary):** TBD
   *(homebuyers / realtors / commercial clients / sellers doing pre-listing inspections)*

3. **Brand direction:** TBD
   *(teal + charcoal pulled from current CSS, OR we have actual brand colors: ________, OR surprise me with 2–3 directions)*

4. **Logo status:** TBD
   *(existing logos in bundle are final / need a refresh / open to a new mark)*

5. **Real photography available?** TBD
   *(yes — folder at ________, OR no, continue with Unsplash for now, OR budget to commission)*

6. **Sample inspection report PDF:** TBD
   *(attached as `dia-research/sample_report.pdf` / not available yet / redact and I'll send)*

7. **Show pricing on site?** TBD
   *(yes, publish starting-at rates / no, gate behind quote form / show a price range)*

8. **Reviews integration:** TBD
   *(pull from Google Business Profile URL: ________ / embed Yelp / hardcode 5–10 real testimonials I'll provide)*

9. **Online booking:** TBD
   *(keep current Zyro widget / switch to Calendly / Spectora / ISN / custom form that emails the office)*

10. **Tech preference:** TBD
    *(stay on Zyro and restyle / migrate to Astro on Vercel / Next.js / Framer / WordPress / no preference — pick what's cheapest to maintain)*

11. **Budget & timeline:** TBD
    *(e.g. "$X over 3 weeks", "DIY hours only, ship in 2 weekends")*

12. **Who maintains it after launch:** TBD
    *(owner edits copy directly / Nick edits / we only update via dev handoff)*

13. **Competitor / inspiration sites you like:** TBD
    *(paste 2–3 URLs — inspector sites or otherwise — and one line on why each)*

14. **Must-keep vs. must-cut:** TBD
    *(anything on the current site we should preserve exactly / anything to remove)*

## Known problems to fix (from my audit)

These came out of my pass through the live site — please address them all unless I've marked one as out-of-scope:

1. SSL cert is invalid — must ship with valid HTTPS.
2. Every page's DOM duplicates its headings (desktop + mobile blocks rendered twice) — fix with proper responsive CSS.
3. Homepage badges "150+" and "15+" are unitless — clarify to "150+ inspections completed" / "15+ years of experience" (confirm real numbers with owner).
4. No sample-report download anywhere — add one as the primary trust CTA.
5. Booking lives on its own `/appointments` page only — surface the booking flow on home and services too.
6. `/contact` page is buried under a wall of legal terms — move to dedicated `/terms` page.
7. Meta descriptions are nearly identical across pages — write unique, keyword-specific ones per page.
8. No `LocalBusiness` structured data — add JSON-LD schema for local SEO (NAP, hours, service area, services, reviews).
9. Hero photos are stock Unsplash — replace (or license properly) per answer to Q5 above.
10. Single testimonial — expand per answer to Q8 above.

## Deliverables I want from you

Please produce, in this order:

1. **A short plan** (≤ 300 words): information architecture (sitemap), voice/tone choice, palette + type direction, and the 2–3 biggest decisions you're making with your rationale. Let me approve before you build.
2. **Homepage mockup first** (desktop + mobile) — once approved, roll the system across the rest.
3. **All pages:** Home, Services (with each service as an expandable card or sub-page), About, Contact, Appointments, plus a new Terms page and a "Sample Report" download page/modal.
4. **Implementation:** fully working static site (or chosen framework), deployable to whatever host we land on. Include:
   - Valid HTML, accessible (WCAG AA color contrast, alt text, semantic headings)
   - Lighthouse Performance + SEO + Accessibility all ≥ 95 on desktop
   - Mobile-first responsive
   - `LocalBusiness` JSON-LD schema
   - `sitemap.xml` and `robots.txt`
   - Open Graph + Twitter card meta per page
   - Favicons + apple-touch-icon
5. **Content deliverables:**
   - Rewritten hero + subheads per page (keep the current voice: direct, reassuring, no-hype)
   - Unique meta title + description per page
   - Rewritten FAQ section (expand from the existing 7 Q&As)
6. **A one-page handoff doc** explaining how the owner edits copy and images after launch.

## Constraints & voice

- **Tone:** calm, direct, local. Not corporate. "Same-day reports. Clear photos. No pressure, no upsells." is the sentence that captures the vibe — everything should feel consistent with it.
- **No dark patterns.** No fake urgency, fake review counts, fake scarcity.
- **Accessibility is non-negotiable.** This is a local-trust business — an inaccessible site actively harms the brand.
- **Keep it editable.** Whatever stack you pick, the owner must be able to change a phone number, swap a photo, or add an FAQ without a developer.

## What to ask me before you start

If any `TBD` above would materially change your direction, stop and ask. If it's cosmetic or downstream, make the call and flag it in your plan doc.

---

Ready when you are. Start with the 300-word plan.
