'use strict';

const WHATSAPP_NUMBER = '77003605300';
const messages = {
  default: 'Здравствуйте! Хочу получить программу и стоимость курса Aveno Academy.',
  program: 'Здравствуйте! Пришлите, пожалуйста, полную программу курса Aveno Academy и стоимость обучения.',
  question: 'Здравствуйте! Хочу узнать, подойдёт ли мне курс Aveno Academy. Можно получить консультацию?',
  faq: 'Здравствуйте! Хочу узнать программу, стоимость курса Aveno Academy и какие инструменты и подписки понадобятся для обучения.',
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

const examples = {
  documents: {
    number: '01',
    request: 'Сравнить два предложения от подрядчиков и понять, какое подходит лучше.',
    title: 'Сравнение, с которым можно принять решение',
    items: ['Условия и отличия в одной таблице', 'Сильные стороны и возможные риски', 'Вывод с учётом ваших приоритетов'],
  },
  analysis: {
    number: '02',
    request: 'Разобраться в большом отчёте и подготовить главное к встрече с командой.',
    title: 'Короткая сводка вместо десятков страниц',
    items: ['Главные факты и ключевые изменения', 'Выводы с опорой на исходные данные', 'Вопросы и следующие шаги для обсуждения'],
  },
  routine: {
    number: '03',
    request: 'Каждую неделю готовить однотипный отчёт из новых данных, не объясняя задачу заново.',
    title: 'Повторяемый процесс для регулярной задачи',
    items: ['Сохранённые требования к результату', 'Единая структура для новых данных', 'Черновик, который остаётся проверить'],
  },
};
const tabs = [...document.querySelectorAll('[data-task]')];
function selectTask(tab) {
  const example = examples[tab.dataset.task];
  tabs.forEach((item) => {
    item.setAttribute('aria-selected', String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  });
  document.querySelector('#task-panel').setAttribute('aria-labelledby', tab.id);
  document.querySelector('.example-top > span:last-child').textContent = `${example.number} / 03`;
  document.querySelector('#example-request').textContent = example.request;
  document.querySelector('#example-title').textContent = example.title;
  document.querySelector('#example-list').replaceChildren(...example.items.map((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTask(tab));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTask(tabs[next]);
      tabs[next].focus();
    }
  });
});

const form = document.querySelector('#lead-form');
const nameInput = document.querySelector('#lead-name');
const phoneInput = document.querySelector('#lead-phone');
const formError = document.querySelector('#form-error');
const feedback = document.querySelector('.form-feedback');
form.addEventListener('input', () => {
  formError.hidden = true;
  nameInput.removeAttribute('aria-invalid');
  phoneInput.removeAttribute('aria-invalid');
  feedback.hidden = true;
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.hidden = true;
  const name = nameInput.value.trim().replace(/\s+/g, ' ');
  const rawPhone = phoneInput.value.trim();
  let digits = rawPhone.replace(/\D/g, '');
  if (name.length < 2) {
    formError.textContent = 'Пожалуйста, укажите ваше имя — минимум 2 символа.';
    formError.hidden = false;
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus();
    return;
  }
  if (!/^[+\d\s()\-]+$/.test(rawPhone) || digits.length < 10 || digits.length > 15 || /^(\d)\1+$/.test(digits)) {
    formError.textContent = 'Проверьте телефон. Укажите номер с кодом страны, например +7 700 360 53 00.';
    formError.hidden = false;
    phoneInput.setAttribute('aria-invalid', 'true');
    phoneInput.focus();
    return;
  }
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length === 10 && !rawPhone.startsWith('+')) digits = `7${digits}`;
  const url = whatsappUrl(`Здравствуйте! Хочу получить консультацию по курсу Aveno Academy.\n\nМеня зовут: ${name}\nМой телефон: +${digits}\n\nРасскажите, пожалуйста, о программе и стоимости обучения.`);
  document.querySelector('#form-fallback').href = url;
  window.open(url, '_blank', 'noopener,noreferrer');
  feedback.hidden = false;
});

// Hide the fixed mobile CTA while an equivalent main action or the form is in view.
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
  document.querySelectorAll('.hero .button, #lead-form, .final-section .button').forEach((element) => observer.observe(element));
}
document.querySelector('#year').textContent = new Date().getFullYear();
