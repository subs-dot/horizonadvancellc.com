/* Horizon Advance — site scripts */
(() => {
  'use strict';

  const EMAIL = 'admin@horizonadvancellc.com';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* Build a mailto: link with a subject and a pre-filled body */
  const mailto = (subject, lines) =>
    `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\r\n'))}`;
  // "Term loan" -> "a term loan", "SBA loan" -> "an SBA loan"
  const phrase = p => /^SBA/i.test(p) ? `an SBA ${p.slice(4).toLowerCase()}` : `a ${p.toLowerCase()}`;
  const template = program => [
    'Hi Horizon Advance,', '',
    program ? `I'm interested in ${phrase(program)} for my business.` : "I'd like to explore funding options for my business.", '',
    'Business name: ',
    'Industry: ',
    'Time in business: ',
    'Average monthly revenue: ',
    'Amount needed: ',
    'What it\'s for: ',
    'Best phone number: ', '',
    'Thank you'
  ];

  /* Email buttons: data-mail="" for a general inquiry, data-mail="Term loan" for a program */
  $$('[data-mail]').forEach(a => {
    const program = a.getAttribute('data-mail');
    a.href = mailto(program ? `${program} inquiry` : 'Funding inquiry', template(program));
  });

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* Mobile nav */
  const menuBtn = $('.menu-btn');
  const nav = $('#nav');
  if (menuBtn && nav) {
    const setOpen = open => {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
    };
    const isOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.addEventListener('click', () => {
      const open = !isOpen();
      setOpen(open);
      // The links sit before the button in the page, so move keyboard focus into the menu
      if (open) { const first = nav.querySelector('a'); if (first) first.focus(); }
    });
    // Any link in the header (menu links, "Talk to us", the logo) closes the menu...
    menuBtn.closest('.header').addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    // ...and so does a click anywhere outside the header
    document.addEventListener('click', e => { if (isOpen() && !e.target.closest('.header')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { setOpen(false); menuBtn.focus(); } });
  }

  /* Header border on scroll */
  const header = $('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- Find your fit ---------------- */
  const form = $('#matcher');
  if (form) {
    const PROGRAMS = {
      mca:  { name: 'Merchant Cash Advance', why: 'The fastest option, often funded in 24 to 48 hours. Approval leans on your sales more than your credit score, so newer businesses and imperfect credit are welcome.' },
      term: { name: 'Term Loan', why: 'A lump sum with fixed, predictable payments over one to five years. A strong match for a planned investment with a clear payoff.' },
      loc:  { name: 'Line of Credit', why: 'Draw only what you need, when you need it, and pay only for what you use. Your available credit refills as you repay.' },
      sba:  { name: 'SBA Loan', why: 'Government-backed financing with the longest terms and some of the lowest rates available. It takes longer, but it\'s worth it if you qualify.' }
    };
    // Points each answer gives each program. Highest total wins.
    const SCORES = {
      speed: { asap:  { mca: 3, loc: 2, term: 1, sba: -3 },
               month: { term: 2, loc: 2, mca: 1, sba: -1 },
               wait:  { sba: 3, term: 2, loc: 2, mca: 0 } },
      use:   { cash:   { loc: 3, mca: 2, term: 1, sba: 0 },
               equip:  { term: 3, sba: 2, mca: 1, loc: 0 },
               big:    { sba: 4, term: 2, mca: 0, loc: 0 },
               safety: { loc: 4, mca: 1, term: 0, sba: 0 } },
      // SBA loans need roughly two years in business, so newer businesses are steered away from them
      tib:   { new: { mca: 3, loc: 0, term: -1, sba: -6 },
               mid: { mca: 1, term: 1, loc: 1, sba: -3 },
               est: { sba: 2, term: 2, loc: 1, mca: 0 } }
    };
    const ORDER = ['mca', 'term', 'loc', 'sba'];
    // On equal points, suggest the lower-cost program first
    const TIE_ORDER = ['loc', 'term', 'sba', 'mca'];

    const nameEl = $('#matchName'), whyEl = $('#matchWhy'), labelEl = $('#matchLabel');
    const runner = $('#matchRunner'), runnerName = $('#matchRunnerName');
    const cta = $('#matchCta'), reset = $('#matchReset');
    const cards = $$('.program[data-program]');
    const defaults = { name: nameEl.textContent, why: whyEl.textContent, href: cta.href };

    const labelOf = name => {
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.nextElementSibling.textContent : '';
    };

    const update = () => {
      const answers = Object.fromEntries(['speed', 'use', 'tib'].map(n => {
        const c = form.querySelector(`input[name="${n}"]:checked`);
        return [n, c ? c.value : null];
      }));
      const answered = Object.values(answers).filter(Boolean).length;
      cards.forEach(c => c.classList.remove('is-best'));

      if (!answered) {
        labelEl.textContent = 'Your match';
        nameEl.textContent = defaults.name;
        whyEl.textContent = defaults.why;
        runner.hidden = true;
        reset.hidden = true;
        cta.href = defaults.href;
        cta.textContent = 'Email us about my options';
        return;
      }

      const totals = Object.fromEntries(ORDER.map(p => [p, 0]));
      for (const [q, v] of Object.entries(answers)) {
        if (!v) continue;
        for (const [p, pts] of Object.entries(SCORES[q][v])) totals[p] += pts;
      }
      const ranked = [...ORDER].sort((a, b) => totals[b] - totals[a] || TIE_ORDER.indexOf(a) - TIE_ORDER.indexOf(b));
      const best = ranked[0], second = ranked[1];

      labelEl.textContent = answered < 3 ? `Your match so far (${answered} of 3 answered)` : 'Your best fit';
      nameEl.textContent = PROGRAMS[best].name;
      whyEl.textContent = PROGRAMS[best].why;
      runner.hidden = totals[second] < totals[best] - 3;
      runnerName.textContent = PROGRAMS[second].name;
      reset.hidden = false;
      const bestCard = cards.find(c => c.dataset.program === best);
      if (bestCard) bestCard.classList.add('is-best');

      cta.textContent = `Email us about ${phrase(PROGRAMS[best].name)}`;
      cta.href = mailto(`${PROGRAMS[best].name} inquiry`, [
        'Hi Horizon Advance,', '',
        'I used the Find Your Fit tool on your website.', '',
        `How soon I need funds: ${labelOf('speed')}`,
        `What it's for: ${labelOf('use')}`,
        `Time in business: ${labelOf('tib')}`,
        `Suggested program: ${PROGRAMS[best].name}`, '',
        'Business name: ',
        'Average monthly revenue: ',
        'Amount needed: ',
        'Best phone number: ', '',
        'Thank you'
      ]);
    };

    form.addEventListener('change', update);
    reset.addEventListener('click', () => {
      form.reset();
      update();
      // The button hides itself on reset, so hand keyboard focus back to the first question
      const first = form.querySelector('input');
      if (first) first.focus();
    });
    update();
  }
})();
