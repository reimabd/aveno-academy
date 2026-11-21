'use strict';

document.querySelector('#year').textContent = new Date().getFullYear();

// Печать / сохранение в PDF
const printButton = document.querySelector('[data-print]');
if (printButton && window.print) {
  printButton.hidden = false;
  printButton.addEventListener('click', () => window.print());
}

// Содержание: на компьютере раскрыто, на телефоне свёрнуто
const toc = document.querySelector('[data-toc]');
if (toc) {
  const wide = window.matchMedia('(min-width: 901px)');
  const sync = () => { toc.open = wide.matches; };
  sync();
  wide.addEventListener('change', sync);

  toc.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    if (!wide.matches) toc.open = false;
  }));

  // Подсветка текущего раздела
  const links = new Map([...toc.querySelectorAll('a')].map((a) => [a.hash.slice(1), a]));
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
      const current = sections.find((s) => visible.has(s.id));
      if (!current) return;
      links.forEach((a, id) => a.classList.toggle('is-active', id === current.id));
    }, { rootMargin: '0px 0px -65% 0px' });
    sections.forEach((s) => observer.observe(s));
  }
}
