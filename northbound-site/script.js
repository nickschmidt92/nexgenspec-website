(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  // Scrolled header state
  const onScroll = () => {
    if (window.scrollY > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileNav.hidden = !open;
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        header.classList.remove('menu-open');
        mobileNav.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal
  const revealTargets = document.querySelectorAll(
    '.hero-copy, .hero-visual, .marquee, .problem-inner, .section-head, .bento-card, .steps li, .ai-copy, .ai-stack, .about-copy, .about-card, .cta-copy, .intake-form'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  // Mouse-tracking glow on bento cards
  const bentoCards = document.querySelectorAll('.bento-card');
  bentoCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });

  // Subtle parallax on hero radar
  const radar = document.querySelector('.radar');
  const heroSection = document.querySelector('.hero');
  if (radar && heroSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    heroSection.addEventListener('mousemove', (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = heroSection.getBoundingClientRect();
        const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
        const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
        radar.style.transform = `translate(${dx}px, ${dy}px)`;
        ticking = false;
      });
    });
    heroSection.addEventListener('mouseleave', () => {
      radar.style.transform = '';
    });
  }

  // Form handling (Formspree-friendly)
  const form = document.getElementById('intakeForm');
  const note = document.getElementById('formNote');
  if (form && note) {
    form.addEventListener('submit', async (e) => {
      const action = form.getAttribute('action') || '';
      if (action.includes('REPLACE_WITH_FORM_ID')) {
        e.preventDefault();
        note.className = 'form-note error';
        note.textContent = 'Form endpoint not yet configured. Email contact@northboundgrowthco.com and we\u2019ll reply within one business day.';
        return;
      }
      e.preventDefault();
      note.className = 'form-note';
      note.textContent = 'Sending\u2026';
      try {
        const res = await fetch(action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });
        if (res.ok) {
          form.reset();
          note.className = 'form-note success';
          note.textContent = 'Thanks \u2014 we\u2019ll be in touch within one business day with the Investment Guide and a link to book your call.';
        } else {
          throw new Error('Bad response');
        }
      } catch (err) {
        note.className = 'form-note error';
        note.textContent = 'Something went wrong. Email contact@northboundgrowthco.com and we\u2019ll respond directly.';
      }
    });
  }
})();
