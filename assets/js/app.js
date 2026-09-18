
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function initScroll() {
    var bar    = $('#progress');
    var nav    = $('#subnav');
    var links  = $$('.subnav-links a[href^="#"]');
    var navMap = {};

    links.forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });

    var targets = Object.keys(navMap)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
        if (nav) nav.classList.toggle('is-stuck', h.scrollTop > window.innerHeight * 0.9);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if ('IntersectionObserver' in window && targets.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) { a.removeAttribute('aria-current'); });
          var active = navMap[entry.target.id];
          if (active) active.setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      targets.forEach(function (t) { spy.observe(t); });
    }
  }

  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add('is-in'); }, i * 70);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    items.forEach(function (n) { io.observe(n); });
  }

  var players = {};
  var videoReady = false;

  function initVideo() {
    if (videoReady) return;
    if (!window.YT || !window.YT.Player) return;
    var mounts = $$('.yt-mount');
    if (!mounts.length) return;
    videoReady = true;

    mounts.forEach(function (mount) {
      players[mount.id] = new YT.Player(mount.id, {
        host: 'https://www.youtube-nocookie.com',
        videoId: mount.dataset.video,
        playerVars: {
          mute: 1,
          playsinline: 1,
          rel: 0,
          controls: 1,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          origin: window.location.origin
        },
        events: {
          onReady: function (e) {
            e.target.mute();
            var f = e.target.getIframe();
            if (f) {
              f.setAttribute('title', mount.dataset.title || 'Video');
              f.setAttribute('allow',
                'autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture');
            }
            watch(mount.id);
          }
        }
      });
    });

  }

  function watch(id) {
    var p = players[id];
    if (!p || typeof p.getIframe !== 'function') return;
    var frame = p.getIframe();
    if (!frame || !('IntersectionObserver' in window)) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        try { p.playVideo(); } catch (err) {}
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    io.observe(frame);
  }

  window.onYouTubeIframeAPIReady = function () { initVideo(); };

  window.CGA = { players: players };

  function init() {
    initScroll();
    initReveal();
    initVideo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
