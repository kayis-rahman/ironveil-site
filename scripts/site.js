(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  document.documentElement.classList.add('motion-ready');
  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in-view');
      currentObserver.unobserve(entry.target);
    }
  }, { threshold: 0.14, rootMargin: '0px 0px -32px 0px' });

  for (const target of targets) observer.observe(target);
})();
