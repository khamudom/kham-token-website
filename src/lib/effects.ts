/** Scroll reveal and click-to-play video facades. */

export function initReveal(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll<HTMLElement>('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  targets.forEach((el) => io.observe(el));
}

/** Thumbnail first, player on demand: no iframe cost (or error state) until the visitor asks. */
export function initVideoFacades(): void {
  document.querySelectorAll<HTMLButtonElement>('.video-facade').forEach((btn) => {
    btn.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.video}?autoplay=1`;
      frame.title = btn.getAttribute('aria-label') ?? 'Video';
      frame.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      btn.replaceWith(frame);
    });
  });
}
