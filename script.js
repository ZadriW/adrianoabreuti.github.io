/* ============================================================
   ADRIANO ABREU — PORTFOLIO
   script.js
   ============================================================ */

/* ── NAVBAR scroll state (throttle via rAF) ──────────────── */
const navbar = document.getElementById('navbar');
let navScrollTicking = false;

function updateNavbarScrollState() {
  const scrollTop = typeof portfolioGetScrollTop === 'function'
    ? portfolioGetScrollTop()
    : (window.scrollY || 0);
  navbar.classList.toggle('scrolled', scrollTop > 20);
}

function onPageScroll() {
  if (navScrollTicking) return;
  navScrollTicking = true;
  requestAnimationFrame(() => {
    updateNavbarScrollState();
    navScrollTicking = false;
  });
}

window.addEventListener('scroll', onPageScroll, { passive: true });
document.addEventListener('portfolio-scroll', onPageScroll);

/* ── HAMBURGER menu ──────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  hamburger.classList.toggle('active');
  if (hamburger.classList.contains('active')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  }
});

/* Close menu on nav link click */
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.querySelectorAll('span').forEach(s => {
      s.style.transform = '';
      s.style.opacity   = '';
    });
  });
});

/* ── TYPEWRITER effect (i18n-aware) ──────────────────────── */
const typewriterEl = document.getElementById('typewriter');
let twPi = 0;
let twCi = 0;
let twDeleting = false;
let twTimer = null;

function getTypewriterPhrases() {
  if (typeof I18N === 'undefined') return [];
  return I18N.phrases[I18N.currentLang] || I18N.phrases[I18N.defaultLang];
}

function resetTypewriter() {
  clearTimeout(twTimer);
  twPi = 0;
  twCi = 0;
  twDeleting = false;
  if (typewriterEl) typewriterEl.textContent = '';
  type();
}

function type() {
  if (!typewriterEl) return;
  const phrases = getTypewriterPhrases();
  if (!phrases.length) return;

  const phrase = phrases[twPi];

  if (!twDeleting) {
    typewriterEl.textContent = phrase.slice(0, twCi + 1);
    twCi++;
    if (twCi === phrase.length) {
      twDeleting = true;
      twTimer = setTimeout(type, 2000);
      return;
    }
    twTimer = setTimeout(type, 70);
  } else {
    typewriterEl.textContent = phrase.slice(0, twCi - 1);
    twCi--;
    if (twCi === 0) {
      twDeleting = false;
      twPi = (twPi + 1) % phrases.length;
      twTimer = setTimeout(type, 400);
      return;
    }
    twTimer = setTimeout(type, 35);
  }
}

document.addEventListener('DOMContentLoaded', resetTypewriter);
document.addEventListener('langchange', resetTypewriter);

/* ── REVEAL on scroll (entrada + saída espelhada) ────────── */
const revealTargets = document.querySelectorAll(
  '.skill-group, .stepper-step, .timeline-item, .project-card, .cert-card, ' +
  '.stat-card, .contact-card, .about-text, .about-stats, ' +
  '.project-featured, .edu-card'
);

const REVEAL_TRANSITION_MS = 450;
const REVEAL_STAGGER_MS = 30;
const REVEAL_EXIT_DEBOUNCE_MS = 70;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealTimers = new WeakMap();
const revealCleanupTimers = new WeakMap();

revealTargets.forEach(el => el.classList.add('reveal'));

function clearRevealTimer(el) {
  const id = revealTimers.get(el);
  if (id == null) return;
  clearTimeout(id);
  revealTimers.delete(el);
}

function scheduleRevealCleanup(el) {
  const prev = revealCleanupTimers.get(el);
  if (prev != null) clearTimeout(prev);
  revealCleanupTimers.set(el, setTimeout(() => {
    el.classList.remove('is-animating');
    revealCleanupTimers.delete(el);
  }, REVEAL_TRANSITION_MS + 40));
}

function setRevealVisible(el, show) {
  if (prefersReducedMotion) {
    el.classList.toggle('visible', show);
    return;
  }

  const isVisible = el.classList.contains('visible');
  if (isVisible === show) return;

  el.classList.add('is-animating');
  el.classList.toggle('visible', show);
  scheduleRevealCleanup(el);
}

function queueRevealChange(el, show, delay) {
  clearRevealTimer(el);
  if (delay <= 0) {
    setRevealVisible(el, show);
    return;
  }
  revealTimers.set(el, setTimeout(() => setRevealVisible(el, show), delay));
}

const revealObserver = new IntersectionObserver(entries => {
  const entering = [];
  const leaving = [];

  entries.forEach(entry => {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
      entering.push(entry.target);
    } else if (!entry.isIntersecting) {
      leaving.push(entry.target);
    }
  });

  entering.forEach((el, i) => {
    queueRevealChange(el, true, i * REVEAL_STAGGER_MS);
  });

  /* debounce curto na saída evita flicker na borda do viewport;
     escalonamento espelhado distribui a carga GPU como na entrada */
  leaving.forEach((el, i) => {
    queueRevealChange(el, false, REVEAL_EXIT_DEBOUNCE_MS + i * REVEAL_STAGGER_MS);
  });
}, {
  threshold: [0, 0.08, 0.15],
  rootMargin: '0px 0px -40px 0px',
});

revealTargets.forEach(t => revealObserver.observe(t));

/* ── ACTIVE nav link highlight ───────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const links    = document.querySelectorAll('.nav-links a[href^="#"]');
let activeSectionId = null;

const sectionObserver = new IntersectionObserver(entries => {
  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (!visible.length) return;

  const nextId = visible[0].target.id;
  if (nextId === activeSectionId) return;
  activeSectionId = nextId;

  links.forEach(l => l.classList.remove('active-link'));
  const active = document.querySelector(`.nav-links a[href="#${nextId}"]`);
  if (active) active.classList.add('active-link');
}, {
  threshold: [0.2, 0.45, 0.7],
  rootMargin: '-15% 0px -60% 0px',
});

sections.forEach(s => sectionObserver.observe(s));

/* ── SMOOTH scroll offset (fixed nav) ───────────────────────*/
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (typeof portfolioScrollToSection === 'function') {
      portfolioScrollToSection(target);
    } else {
      const offset = 64 + 16;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});

/* ── CONTACT FORM (Pageclip + Turnstile + honeypot) ──────── */
(function () {
  const form        = document.getElementById('contact-form');
  const success     = document.getElementById('cform-success');
  const errorBox    = document.getElementById('cform-error');
  const errorMsg    = document.getElementById('cform-error-msg');
  const honeypot    = document.getElementById('cf-website');
  const captchaEl   = document.getElementById('turnstile-widget');
  const captchaErr  = document.getElementById('cform-captcha-error');

  if (!form || typeof Pageclip === 'undefined') return;

  const fields = form.querySelectorAll('[required]');
  let turnstileWidgetId = null;
  let captchaPassed = false;

  function hideFeedback() {
    success.classList.remove('is-visible');
    errorBox.classList.remove('is-visible');
    hideCaptchaError();
  }

  function showCaptchaError() {
    if (!captchaErr) return;
    captchaErr.textContent = I18N.t('contact.error.captcha');
    captchaErr.hidden = false;
    captchaErr.classList.add('is-visible');
  }

  function hideCaptchaError() {
    if (!captchaErr) return;
    captchaErr.hidden = true;
    captchaErr.classList.remove('is-visible');
  }

  function showSuccess() {
    hideFeedback();
    form.hidden = true;
    success.classList.add('is-visible');
    resetCaptcha();
  }

  function showError(message) {
    hideFeedback();
    form.hidden = false;
    errorMsg.textContent = '';
    errorMsg.insertAdjacentHTML('afterbegin', message);
    errorBox.classList.add('is-visible');
    resetCaptcha();
  }

  function resetCaptcha() {
    captchaPassed = false;
    if (typeof turnstile !== 'undefined' && turnstileWidgetId !== null) {
      turnstile.reset(turnstileWidgetId);
    }
  }

  function getTurnstileToken() {
    const input = form.querySelector('[name="cf-turnstile-response"]');
    return input && input.value.trim() ? input.value.trim() : '';
  }

  function isHoneypotClean() {
    return !honeypot || honeypot.value.trim() === '';
  }

  function initTurnstile() {
    const siteKey = window.PORTFOLIO_SECURITY && window.PORTFOLIO_SECURITY.turnstileSiteKey;
    if (!siteKey || !captchaEl || typeof turnstile === 'undefined') return;

    if (turnstileWidgetId !== null) {
      turnstile.remove(turnstileWidgetId);
      turnstileWidgetId = null;
    }

    turnstileWidgetId = turnstile.render(captchaEl, {
      sitekey: siteKey,
      theme: 'dark',
      language: I18N.currentLang === 'pt-BR' ? 'pt-BR' : I18N.currentLang,
      callback: () => {
        captchaPassed = true;
        hideCaptchaError();
      },
      'expired-callback': () => { captchaPassed = false; },
      'error-callback': () => { captchaPassed = false; },
    });
  }

  function waitForTurnstile(attempts = 0) {
    if (typeof turnstile !== 'undefined') {
      initTurnstile();
      return;
    }
    if (attempts < 40) {
      setTimeout(() => waitForTurnstile(attempts + 1), 150);
    }
  }

  hideFeedback();
  waitForTurnstile();
  document.addEventListener('langchange', () => {
    hideCaptchaError();
    waitForTurnstile();
  });

  function validateField(el) {
    const value = el.value.trim();
    const empty = value === '';
    const emailInvalid = el.type === 'email' && value !== ''
      && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const tooLong = el.maxLength > 0 && value.length > el.maxLength;

    if (empty || emailInvalid || tooLong) {
      el.classList.add('invalid');
      return false;
    }
    el.classList.remove('invalid');
    return true;
  }

  fields.forEach(f => {
    f.addEventListener('input', () => validateField(f));
    f.addEventListener('blur',  () => validateField(f));
  });

  Pageclip.form(form, {
    onSubmit: function () {
      if (!isHoneypotClean()) {
        showError(I18N.t('contact.error.honeypot'));
        return false;
      }

      let valid = true;
      fields.forEach(f => { if (!validateField(f)) valid = false; });
      if (!valid) {
        fields[0].focus();
        return false;
      }

      const token = getTurnstileToken();
      if (!captchaPassed || !token) {
        showCaptchaError();
        if (captchaEl) captchaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }

      hideFeedback();
    },
    onResponse: function (error) {
      if (!error) {
        showSuccess();
        return false;
      }

      const origin = window.location.origin;
      let detail = I18N.t('contact.error.send');

      if (origin.startsWith('file://')) {
        detail = I18N.t('contact.error.file');
      } else if (origin.includes('127.0.0.1')) {
        detail = I18N.t('contact.error.localhost');
      } else if (String(error.message || '').includes('Error submitting data')) {
        detail = I18N.t('contact.error.domain');
      }

      showError(
        `${detail} ${I18N.t('contact.error.fallback')} ` +
        `<a href="mailto:adrianoabreudealmeida@gmail.com">adrianoabreudealmeida@gmail.com</a>.`
      );
      return false;
    }
  });
})();
