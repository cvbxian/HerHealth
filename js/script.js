'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// Dark mode (remembers choice; safe if storage is blocked)
const root = document.documentElement, themeBtn = $('#theme');
function setTheme(t) { root.dataset.theme = t; themeBtn.textContent = t === 'dark' ? '☀️' : '🌙'; }
let saved = null; try { saved = localStorage.getItem('hhh-theme'); } catch (e) {}
setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next); try { localStorage.setItem('hhh-theme', next); } catch (e) {}
});

// Mobile menu
const burger = $('#burger'), menu = $('#menu');
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', menu.classList.toggle('open')));
$$('#menu a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));

// Scroll progress, back-to-top, active nav link
const bar = $('#progress'), topBtn = $('#top'), links = $$('#menu a');
addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  topBtn.classList.toggle('show', scrollY > 600);
}, { passive: true });
topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

// Tabs
$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.tab').forEach(t => t.classList.remove('active'));
  $$('.panel').forEach(p => p.classList.remove('active'));
  tab.classList.add('active'); $('#' + tab.dataset.tab).classList.add('active');
}));

// Flip cards
$$('.flip').forEach(c => {
  c.addEventListener('click', () => c.classList.toggle('on'));
  c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('on'); } });
});

// Checklist
const boxes = $$('#check input'), fill = $('#fill'), ptxt = $('#progressText');
boxes.forEach(b => b.addEventListener('change', () => {
  const done = boxes.filter(x => x.checked).length;
  fill.style.width = done / boxes.length * 100 + '%';
  ptxt.textContent = done === boxes.length ? '🎉 You are ready for your checkup!' : `${done} of ${boxes.length} done`;
  if (done === boxes.length) toast('Checklist complete!');
}));

// Cycle estimator
const fmt = d => d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
$('#calc').addEventListener('click', () => {
  const out = $('#cycleOut'), val = $('#lmp').value, len = parseInt($('#len').value, 10);
  if (!val) { out.innerHTML = '<div class="err">Please choose the first day of your last period.</div>'; return; }
  if (!(len >= 21 && len <= 45)) { out.innerHTML = '<div class="err">Enter a cycle length between 21 and 45 days.</div>'; return; }
  const [y, m, d] = val.split('-').map(Number), start = new Date(y, m - 1, d);
  const next = addDays(start, len), ov = addDays(next, -14);
  out.innerHTML = `<div><b>Next period:</b> around ${fmt(next)}</div>
    <div><b>Estimated ovulation:</b> around ${fmt(ov)}</div>
    <div><b>Fertile window:</b> ${fmt(addDays(ov, -5))} to ${fmt(addDays(ov, 1))}</div>`;
});

// Quiz
const Q = [
  { q: 'What is the RH Law\'s official number?', o: ['RA 9262', 'RA 10354', 'RA 9710'], a: 1, f: 'RA 10354, signed in December 2012.' },
  { q: 'Does the RH Law legalize abortion?', o: ['Yes', 'No'], a: 1, f: 'No. Abortion remains illegal; the law requires humane care for complications.' },
  { q: 'Which Supreme Court case ruled on the RH Law\'s constitutionality?', o: ['Imbong v. Ochoa', 'Roe v. Wade', 'Estrada v. Sandiganbayan'], a: 0, f: 'Imbong v. Ochoa (G.R. No. 204819), decided April 8, 2014.' },
  { q: 'Who do government programs under the law prioritize?', o: ['Only urban residents', 'Poor and marginalized women and households', 'Only married women'], a: 1, f: 'The law prioritizes poor and marginalized women and households.' }
];
let qi = 0, score = 0;
function showQ() {
  const x = Q[qi]; $('#qCount').textContent = `Question ${qi + 1} of ${Q.length}`;
  $('#qText').textContent = x.q; $('#qFeed').textContent = ''; $('#qNext').hidden = true;
  const box = $('#qOpts'); box.innerHTML = '';
  x.o.forEach((t, i) => {
    const b = document.createElement('button'); b.textContent = t;
    b.addEventListener('click', () => {
      $$('#qOpts button').forEach((n, k) => { n.disabled = true; if (k === x.a) n.classList.add('ok'); });
      if (i === x.a) score++; else b.classList.add('no');
      $('#qFeed').textContent = (i === x.a ? 'Correct. ' : 'Not quite. ') + x.f;
      $('#qNext').textContent = qi === Q.length - 1 ? 'See score' : 'Next'; $('#qNext').hidden = false;
    });
    box.appendChild(b);
  });
}
let finished = false;
$('#qNext').addEventListener('click', () => {
  if (finished) { finished = false; qi = 0; score = 0; showQ(); return; }
  if (qi < Q.length - 1) { qi++; showQ(); return; }
  finished = true;
  $('#qCount').textContent = 'Quiz complete'; $('#qText').textContent = `You scored ${score} out of ${Q.length}.`;
  $('#qOpts').innerHTML = ''; $('#qFeed').textContent = score === Q.length ? 'Perfect score!' : 'Review the RH Law section and try again.';
  $('#qNext').textContent = 'Try again';
});
showQ();

// Scroll reveal + animated counters
function countUp(el) {
  const to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
  if (reduce) { el.textContent = pre + to + suf; return; }
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + Math.round(to * e) + suf;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('show');
  $$('.count', e.target).forEach(countUp);
  io.unobserve(e.target);
}), { threshold: 0.15 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 0.1 + 's'; io.observe(el); });

// Share
$('#share').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); toast('Link copied!'); }
  catch (e) { toast('Copy the link from your address bar'); }
});

$('#year').textContent = new Date().getFullYear();