'use strict';

const WHATSAPP_NUMBER = '77003605300';
const messages = {
  default: 'Здравствуйте! Хочу узнать подробнее о курсе AI Starter от Aveno Academy.',
  buy: 'Здравствуйте! Хочу записаться на курс AI Starter от Aveno Academy по специальной цене 69 900 ₸.',
  program: 'Здравствуйте! Пришлите, пожалуйста, программу курса AI Starter от Aveno Academy.',
};
const whatsappUrl = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

document.querySelectorAll('[data-wa]').forEach((link) => {
  link.href = whatsappUrl(messages[link.dataset.wa] || messages.default);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
});

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
  mobileNav.hidden = true;
}
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
  mobileNav.hidden = isOpen;
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.hidden) {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header')) closeMenu();
});
window.matchMedia('(min-width: 641px)').addEventListener('change', closeMenu);

// Hide the fixed mobile CTA while an equivalent main action or the price card is in view.
const fixedCta = document.querySelector('.mobile-cta');
if ('IntersectionObserver' in window) {
  const visibleActions = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleActions.add(entry.target);
      else visibleActions.delete(entry.target);
    }
    const hide = visibleActions.size > 0;
    fixedCta.classList.toggle('is-hidden', hide);
    fixedCta.inert = hide;
  }, {threshold: 0.2});
  document.querySelectorAll('.hero .button, .price-card, .final-section .button').forEach((element) => observer.observe(element));
}
// Strike the old price once, when the price card first scrolls into view.
const priceCard = document.querySelector('.price-card');
if (priceCard && 'IntersectionObserver' in window) {
  priceCard.classList.add('will-strike');
  const strikeObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      priceCard.classList.add('is-struck');
      strikeObserver.disconnect();
    }
  }, {threshold: 0.6});
  strikeObserver.observe(priceCard);
}
document.querySelector('#year').textContent = new Date().getFullYear();
