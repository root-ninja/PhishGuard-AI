/* PhishGuard AI - pre-login motion */

function initPreloginMotion() {
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);

  const revealItems = Array.from(document.querySelectorAll('.reveal-on-scroll'));
  revealItems.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index * 70, 280)}ms`);
  });

  const setProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progress.style.width = `${Math.min(Math.max(amount, 0), 100)}%`;
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    });

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    window.requestAnimationFrame(() => {
      setProgress();
      ticking = false;
    });
    ticking = true;
  }, { passive: true });

  setProgress();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPreloginMotion);
} else {
  initPreloginMotion();
}
