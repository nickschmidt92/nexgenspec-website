RAMPS AND RAILS CO — WEBSITE STARTER PACK
==========================================

Everything needed to hand off to Claude (or any designer) to build out
the full website for Ramps and Rails CO.

CONTENTS
--------

content.json
   Structured business content extracted from @ramps_and_rails_co.
   Source-of-truth for copy, products, pricing, FAQs, audiences, and
   design notes. Includes an `images` map that references the photos
   in /images by product, by add-on, and a lifestyle pool.

   Top-level keys:
     business         Brand, location, IG handle, value props
     products         Full lineup w/ pricing where known
     addOns           Upgrades & add-on services
     whyUs            Differentiator content blocks
     audiences        Target customer segments + hooks
     calloutQuotes    Pull-quote-ready taglines
     ctas             Standard call-to-action phrases
     faqs             Q&A pairs
     designNotes      Suggested palette, type, and tone
     images           Mapping of product/addon -> image file paths
     instagramPosts   Curated post URLs w/ tags & captions

index.html
   Working single-file landing page built from content.json with the
   real product photos. Use as a reference, a starting point, or scrap
   it entirely — the JSON + images are the real deliverable.

images/
   37 product photos pulled from @ramps_and_rails_co.
   All ~1080px wide, JPG format, organized by product type:
     01           Hero / brand video poster
     02-03        Kickers
     04-05        Custom builds
     06-07        Bolted transitions (detail shots)
     08-10        3-in-1 Butter Bench
     11           Mini ramp build
     12-13        Spine ramps
     14-16        Backyard build progress
     17-18        The Mullet
     19-20        Manual pads
     21-22        Garage setups
     23           Build process
     24           Family delivery moment
     25-26        Caster wheels add-on
     27-28        Quarter pipes
     29-30        Fun boxes
     31-32        Weather/finish upgrades
     33           Hand-hold detail
     34-35        Slacurail
     36-37        Customer "ramp in a RAV" testimonial

NEXT STEPS (uploading to Claude design)
---------------------------------------

Suggested prompt:

  "Use content.json as the source content and the photos in /images
   for visuals. Build a marketing site for Ramps and Rails CO — a
   skater-owned custom skate ramp shop in Boulder, CO. Match the
   tone (punchy, playful, skate-shop authentic). Use the suggested
   palette and typography from designNotes. Include hero, product
   grid, why-us, add-ons, gallery, FAQ, and a strong IG-driven CTA.
   IG @ramps_and_rails_co is currently the only contact channel."

NOTES
-----

- All pricing in content.json is what was publicly stated on IG.
  Verify with the owner before publishing.
- Image filenames are descriptive (e.g. "17-mullet.jpg") so they're
  easy to match against the products in content.json.
- The business has no website yet — IG DM is currently the only CTA.
