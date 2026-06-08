/* ============================================================
   NiceScroll — scroll suave do portfólio
   https://github.com/inuyaksa/jquery.nicescroll
   ============================================================ */

(function ($) {
  'use strict';

  if (!$ || !$.fn.niceScroll) return;

  const NAV_OFFSET = 80;

  /* scrollspeed (roda): controla inércia do mouse — fórmula interna do NiceScroll:
     duração = 80 + (distância / 72) * scrollspeed
     Para âncoras da navbar usamos scrollspeed menor = transição mais curta. */
  const SCROLL_TUNING = {
    scrollspeed: 145,
    mousescrollstep: 44,
    snapbackspeed: 110,
    /* navegação por nav-links — mais direta, menos inércia */
    anchorDuration: 820,
    anchorMinDuration: 360,
    anchorScrollSpeedMin: 28,
    anchorScrollSpeedMax: 105,
    anchorMsPerPx: 0.28,
  };

  let niceInstance = null;
  let defaultScrollSpeed = SCROLL_TUNING.scrollspeed;

  function canUseNiceScroll() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.matchMedia('(max-width: 768px)').matches) return false;
    return true;
  }

  function getNice() {
    return niceInstance || ($('body').getNiceScroll()[0] || null);
  }

  function initNiceScroll() {
    if (!canUseNiceScroll()) {
      destroyNiceScroll();
      return null;
    }

    if (niceInstance) {
      niceInstance.resize();
      return niceInstance;
    }

    niceInstance = $('body').niceScroll({
      cursorcolor: '#10b981',
      cursorwidth: '5px',
      cursorborder: 'none',
      cursorborderradius: '6px',
      cursoropacitymin: 0,
      cursoropacitymax: 0.75,
      background: 'rgba(48, 54, 61, 0.15)',
      autohidemode: 'scroll',
      hidecursordelay: 500,
      smoothscroll: true,
      scrollspeed: SCROLL_TUNING.scrollspeed,
      mousescrollstep: SCROLL_TUNING.mousescrollstep,
      snapbackspeed: SCROLL_TUNING.snapbackspeed,
      hwacceleration: true,
      enabletranslate3d: true,
      usetransition: true,
      bouncescroll: false,
      cursordragspeed: 0.22,
      horizrailenabled: false,
      railalign: 'right',
      railoffset: { top: 64 },
      zindex: 90,
      boxzoom: false,
      dblclickzoom: false,
      gesturezoom: false,
      preservenativescrolling: false,
      /* desabilita o MutationObserver interno do NiceScroll — ele chamava
         resize() a cada classList.add('visible') das reveal animations,
         causando recálculo de layout no meio do scroll */
      enableobserver: false,
      disablemutationobserver: true,
      scrollCLass: 'portfolio-nicescroll',
    });

    $('html').addClass('nicescroll-enabled');

    const api = $('body').getNiceScroll()[0];
    if (api) {
      defaultScrollSpeed = api.opt.scrollspeed || SCROLL_TUNING.scrollspeed;

      /* throttle do CustomEvent: dispara no máximo 1× por frame de rAF,
         não em cada tick interno do NiceScroll */
      let notifyPending = false;
      const notifyScroll = function () {
        if (notifyPending) return;
        notifyPending = true;
        requestAnimationFrame(function () {
          document.dispatchEvent(new CustomEvent('portfolio-scroll'));
          notifyPending = false;
        });
      };
      api.onscroll = notifyScroll;
      api.onscrollend = notifyScroll;
    }

    return niceInstance;
  }

  function anchorDurationForDistance(distance) {
    const { anchorMinDuration, anchorDuration, anchorMsPerPx } = SCROLL_TUNING;
    return Math.min(
      anchorDuration,
      Math.max(anchorMinDuration, 220 + distance * anchorMsPerPx)
    );
  }

  function durationToScrollSpeed(distance, targetMs) {
    if (distance <= 0) return defaultScrollSpeed;
    const ms = Math.max(SCROLL_TUNING.anchorMinDuration, Math.min(targetMs, SCROLL_TUNING.anchorDuration));
    const speed = ((ms - 80) * 72 / distance) | 0;
    /* não usar Math.max(defaultScrollSpeed) — isso impedia âncoras mais rápidas que a roda */
    return Math.max(
      SCROLL_TUNING.anchorScrollSpeedMin,
      Math.min(speed, SCROLL_TUNING.anchorScrollSpeedMax)
    );
  }

  function restoreScrollSpeed(api, delay) {
    setTimeout(function () {
      if (api && api.opt) api.opt.scrollspeed = defaultScrollSpeed;
    }, delay);
  }

  function destroyNiceScroll() {
    const nice = getNice();
    if (nice) nice.remove();
    niceInstance = null;
    $('html').removeClass('nicescroll-enabled');
  }

  window.portfolioGetScrollTop = function () {
    const nice = getNice();
    if (nice) return nice.getScrollTop();
    return window.scrollY || document.documentElement.scrollTop || 0;
  };

  window.portfolioSmoothScrollTo = function (top, duration) {
    const dest = Math.max(0, top);
    const ms = duration || SCROLL_TUNING.anchorDuration;
    const nice = getNice();

    if (nice) {
      const start = nice.getScrollTop();
      const distance = Math.abs(dest - start);
      const boosted = durationToScrollSpeed(distance, ms);

      nice.opt.scrollspeed = boosted;
      nice.doScrollTop(dest);
      restoreScrollSpeed(nice, ms + 120);
      return;
    }

    window.scrollTo({ top: dest, behavior: 'smooth' });
  };

  window.portfolioScrollToSection = function (el) {
    if (!el) return;
    const currentTop = portfolioGetScrollTop();
    const top = Math.max(0, el.getBoundingClientRect().top + currentTop - NAV_OFFSET);
    const distance = Math.abs(top - currentTop);
    portfolioSmoothScrollTo(top, anchorDurationForDistance(distance));
  };

  $(function () {
    initNiceScroll();

    let resizeTimer = null;
    $(window).on('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (canUseNiceScroll()) {
          initNiceScroll();
        } else {
          destroyNiceScroll();
        }
      }, 200);
    });
  });
})(window.jQuery);
