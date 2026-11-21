"""Генерирует скрытый юридический раздел Aveno Academy: dist/legal/."""
import html
import re
import sys
from pathlib import Path

SRC = Path(__file__).parent / "src"
OUT = Path(sys.argv[1])

PHONE = "+7 700 360 53 00"
EMAIL = "aveno.academy@gmail.com"
ADDRESS = "Республика Казахстан, г. Алматы, ул. Кожабекова, д. 17/2"
EDITION = "9 октября 2026 года"

CURRENT = ' aria-current="page"'

DOCS = [
    ("/legal/", "Информация об обучении и условиях приобретения"),
    ("/legal/oferta/", "Публичная оферта"),
    ("/legal/privacy/", "Политика обработки персональных данных"),
]

ICONS = """<svg class="svg-library" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs>
    <symbol id="arrow" viewBox="0 0 24 24"><path d="M5 19 19 5M5 5h14v14"/></symbol>
    <symbol id="check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol>
    <symbol id="document" viewBox="0 0 24 24"><path d="M14 3H5v18h14V8l-5-5Z M14 3v5h5 M8 12h8M8 16h6"/></symbol>
    <symbol id="shield" viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></symbol>
    <symbol id="print" viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-8h16v8h-3M7 14h10v7H7z"/></symbol>
  </defs></svg>"""


def esc(s):
    return html.escape(s, quote=False)


def inline(text):
    """Markdown-подобная разметка внутри абзаца: **жирный**, [ссылка](url), url, email, @TODO[...]."""
    out = esc(text)
    out = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', out)
    out = re.sub(r"(?<![\"/])https://aveno\.academy\b", '<a href="https://aveno.academy">aveno.academy</a>', out)
    out = out.replace(EMAIL, f'<a href="mailto:{EMAIL}">{EMAIL}</a>')
    out = re.sub(r"@TODO\[([^\]]+)\]", r'<mark class="todo">[\1]</mark>', out)
    return out


def requisites(role, extra):
    rows = [
        (role, "ИП «TABLEY»"),
        ("ИИН", "070123500044"),
        ("Адрес", ADDRESS),
        ("Телефон / WhatsApp", f'<a href="tel:+77003605300">{PHONE}</a> · <a href="https://wa.me/77003605300" target="_blank" rel="noopener noreferrer">WhatsApp</a>'),
        ("Электронная почта", f'<a href="mailto:{EMAIL}">{EMAIL}</a>'),
    ]
    if extra == "bank":
        rows += [("Банк", "АО «Kaspi Bank»"), ("ИИК", "KZ74722S000047598447"), ("БИК", "CASPKZKA"), ("КБе", "19")]
    if extra == "site":
        rows += [("Сайт", '<a href="https://aveno.academy">aveno.academy</a>')]
    items = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in rows)
    return f'<dl class="req-card">{items}</dl>'


def render_md_clean(md):
    """Надёжная версия: сначала группирует блоки в пункты, затем рендерит."""
    sections, toc = [], []
    current = None
    for block in [b.strip() for b in md.strip().split("\n\n") if b.strip()]:
        if block.startswith("### "):
            title = block[4:]
            num = title.split(".")[0]
            current = {"id": f"s{num}", "title": title, "items": []}
            sections.append(current)
            toc.append((current["id"], title))
        elif block.startswith("- "):
            current["items"][-1]["list"] = [l[2:].rstrip(";.") for l in block.splitlines()]
        elif block.startswith("@REQ "):
            role, extra = block[5:].split("|")
            current["items"].append({"req": (role, extra)})
        else:
            m = re.match(r"^(\d+\.\d+\.)\s+(.*)$", block, re.S)
            current["items"].append({"num": m.group(1), "text": m.group(2)})

    out = []
    for s in sections:
        out.append(f'<section class="doc-section" id="{s["id"]}" aria-labelledby="{s["id"]}-h">')
        out.append(f'<h2 id="{s["id"]}-h">{esc(s["title"])}</h2>')
        for it in s["items"]:
            if "req" in it:
                out.append(requisites(*it["req"]))
                continue
            lst = ""
            if "list" in it:
                lst = "<ul>" + "".join(f"<li>{inline(x)}</li>" for x in it["list"]) + "</ul>"
            out.append(f'<div class="clause"><span class="clause-num">{it["num"]}</span><div><p>{inline(it["text"])}</p>{lst}</div></div>')
        out.append("</section>")
    return "\n".join(out), toc


def page(path, title, h1, description, meta, body, toc=None, h1_class=""):
    nav = "".join(
        f'<a href="{href}"{CURRENT if href == path else ""}>{esc(label)} <svg><use href="#arrow"/></svg></a>'
        for href, label in DOCS
    )
    toc_html = ""
    if toc:
        links = "".join(f'<li><a href="#{i}">{esc(t)}</a></li>' for i, t in toc)
        toc_html = f'<details class="doc-toc" data-toc><summary>Содержание <span aria-hidden="true">+</span></summary><ol>{links}</ol></details>'
    footer_nav = "".join(f'<a href="{href}">{esc(label)}</a>' for href, label in DOCS)
    h1_attr = f' class="{h1_class}"' if h1_class else ""
    return f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0664ff">
  <meta name="robots" content="noindex, nofollow">
  <title>{esc(title)} — Aveno Academy</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="https://aveno.academy{path}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/refinements.css">
  <link rel="stylesheet" href="/legal.css">
  <link rel="stylesheet" href="/legal/docs.css">
  <script src="/legal/docs.js" defer></script>
</head>
<body class="page-legal page-docs">
  <a class="skip-link" href="#main">Перейти к содержанию</a>
  {ICONS}
  <header class="header wrap">
    <a class="brand" href="/" aria-label="Aveno Academy — на главную"><span class="brand-icon"><img src="/assets/aveno-brand.png" alt="" width="2000" height="2000"></span><span class="brand-word">Aveno<small>ACADEMY</small></span></a>
    <a class="header-contact" href="https://wa.me/77003605300" target="_blank" rel="noopener noreferrer">Задать вопрос <svg><use href="#arrow"/></svg></a>
  </header>
  <main id="main" class="doc wrap">
    <aside class="doc-head">
      <p class="eyebrow">ДОКУМЕНТЫ · AI STARTER</p>
      <h1{h1_attr}>{h1}</h1>
      <p class="doc-date">{meta}</p>
      <button class="doc-print" type="button" data-print hidden><svg><use href="#print"/></svg> Распечатать или сохранить PDF</button>
      <nav class="doc-links" aria-label="Документы AI Starter">{nav}</nav>
      {toc_html}
    </aside>
    <article class="doc-body">
{body}
    </article>
  </main>
  <footer class="legal wrap" aria-label="Реквизиты">
    <dl class="requisites">
      <div><dt>Исполнитель</dt><dd>ИП «TABLEY»</dd></div>
      <div><dt>ИИН</dt><dd>070123500044</dd></div>
      <div><dt>Адрес</dt><dd>г. Алматы, ул. Кожабекова, д. 17/2</dd></div>
      <div><dt>Контакты</dt><dd><a href="mailto:{EMAIL}">{EMAIL}</a><br><a href="tel:+77003605300">{PHONE}</a></dd></div>
    </dl>
    <div class="legal-bottom"><small>© <span id="year">2026</span> Aveno Academy</small><nav aria-label="Документы">{footer_nav}</nav></div>
  </footer>
</body>
</html>
"""


INFO_BODY = f"""      <p class="doc-lead">AI Starter — практический онлайн-курс Aveno Academy по использованию искусственного интеллекта для решения реальных задач.</p>

      <section class="doc-section" id="price" aria-labelledby="price-h">
        <h2 id="price-h" class="visually-hidden">Стоимость обучения</h2>
        <div class="buy-card">
          <span class="price-badge">СТОИМОСТЬ ОБУЧЕНИЯ</span>
          <p class="buy-price">69&nbsp;900&nbsp;₸</p>
          <p class="buy-note">Стоимость указана за полный курс. Обязательных дополнительных платежей за материалы, включённые в программу, нет.</p>
          <dl class="buy-facts">
            <div><dt>Формат</dt><dd>Онлайн, в своём темпе</dd></div>
            <div><dt>Срок доступа</dt><dd>6 месяцев</dd></div>
            <div><dt>Доступ</dt><dd>Сразу после подтверждения оплаты</dd></div>
            <div><dt>Оплата</dt><dd>Kaspi Pay</dd></div>
          </dl>
        </div>
      </section>

      <section class="doc-section" id="included" aria-labelledby="included-h">
        <h2 id="included-h">Что входит в стоимость</h2>
        <ul class="check-list">
          <li><span class="feature-check"><svg><use href="#check"/></svg></span>15 практических видеоуроков</li>
          <li><span class="feature-check"><svg><use href="#check"/></svg></span>Дополнительные учебные материалы и конспекты</li>
          <li><span class="feature-check"><svg><use href="#check"/></svg></span>Практические примеры использования ИИ-инструментов</li>
          <li><span class="feature-check"><svg><use href="#check"/></svg></span>Тесты для проверки знаний</li>
          <li><span class="feature-check"><svg><use href="#check"/></svg></span>Доступ к образовательной платформе Aveno Academy</li>
          <li><span class="feature-check"><svg><use href="#check"/></svg></span>Электронный сертификат после успешного завершения обучения</li>
        </ul>
      </section>

      <section class="doc-section" id="format" aria-labelledby="format-h">
        <h2 id="format-h">Формат обучения</h2>
        <p>Обучение проходит полностью онлайн в самостоятельном темпе.</p>
        <p>После подтверждения оплаты и регистрации предоставляется доступ к учебной платформе Aveno Academy.</p>
        <dl class="fact-list">
          <div><dt>Срок доступа</dt><dd>6 месяцев</dd></div>
          <div><dt>Предоставление доступа</dt><dd>Сразу после подтверждения оплаты</dd></div>
        </dl>
        <p>Для прохождения курса необходимы подключение к интернету и совместимое устройство.</p>
        <p class="doc-note">Некоторые сторонние ИИ-сервисы могут иметь собственные тарифы и ограничения. Их платные подписки не входят в стоимость AI Starter, если прямо не указано иное.</p>
      </section>

      <section class="doc-section" id="payment" aria-labelledby="payment-h">
        <h2 id="payment-h">Оплата</h2>
        <p>Оплата производится через Kaspi Pay по счёту или платёжной ссылке, направляемой представителем Aveno Academy.</p>
        <p>До оплаты покупателю предоставляется возможность ознакомиться с условиями приобретения.</p>
      </section>

      <section class="doc-section" id="documents" aria-labelledby="documents-h">
        <h2 id="documents-h">Юридические документы</h2>
        <div class="doc-cards">
          <a class="doc-tile" href="/legal/oferta/">
            <span class="doc-tile-icon"><svg><use href="#document"/></svg></span>
            <strong>Публичная оферта</strong>
            <span>Условия договора, сведения о курсе, порядок оплаты, предоставления доступа, права и обязанности сторон, порядок отказа от договора и возврата денежных средств.</span>
            <span class="doc-tile-link">Открыть публичную оферту <svg><use href="#arrow"/></svg></span>
          </a>
          <a class="doc-tile" href="/legal/privacy/">
            <span class="doc-tile-icon"><svg><use href="#shield"/></svg></span>
            <strong>Политика обработки персональных данных</strong>
            <span>Порядок сбора, обработки, хранения и защиты персональных данных пользователей Aveno Academy.</span>
            <span class="doc-tile-link">Открыть политику конфиденциальности <svg><use href="#arrow"/></svg></span>
          </a>
        </div>
        <p class="doc-accept">Оплата курса после предоставления возможности ознакомиться с публичной офертой является её акцептом в установленном законодательством порядке.</p>
      </section>

      <section class="doc-section" id="contractor" aria-labelledby="contractor-h">
        <h2 id="contractor-h">Информация об Исполнителе</h2>
        {requisites("Исполнитель", "")}
        <p>По вопросам обучения, оплаты и возврата денежных средств можно обратиться по указанным контактам.</p>
      </section>"""


def main():
    (OUT / "oferta").mkdir(parents=True, exist_ok=True)
    (OUT / "privacy").mkdir(parents=True, exist_ok=True)

    (OUT / "index.html").write_text(page(
        "/legal/", "AI Starter: информация об обучении и условиях приобретения",
        "AI Starter", "Стоимость, состав, формат обучения и условия приобретения курса AI Starter от Aveno Academy.",
        "Информация об обучении и условиях приобретения", INFO_BODY,
        toc=[("included", "Что входит в стоимость"), ("format", "Формат обучения"), ("payment", "Оплата"),
             ("documents", "Юридические документы"), ("contractor", "Информация об Исполнителе")],
    ), encoding="utf-8")

    body, toc = render_md_clean((SRC / "oferta.md").read_text(encoding="utf-8"))
    intro = '      <p class="doc-lead">О заключении договора возмездного оказания информационно-образовательных услуг (онлайн-курс AI Starter).</p>\n'
    (OUT / "oferta" / "index.html").write_text(page(
        "/legal/oferta/", "Публичная оферта", "Публичная оферта",
        "Публичная оферта Aveno Academy (ИП «TABLEY») о заключении договора на онлайн-курс AI Starter.",
        f"Редакция от {EDITION}", intro + body, toc=toc,
    ), encoding="utf-8")

    body, toc = render_md_clean((SRC / "privacy.md").read_text(encoding="utf-8"))
    intro = '      <p class="doc-lead">Как Aveno Academy собирает, обрабатывает, хранит и защищает персональные данные пользователей сайта и образовательной платформы.</p>\n'
    (OUT / "privacy" / "index.html").write_text(page(
        "/legal/privacy/", "Политика обработки и защиты персональных данных",
        "Политика обработки и&nbsp;защиты персональных данных",
        "Политика обработки и защиты персональных данных Aveno Academy (ИП «TABLEY»).",
        f"Дата вступления в силу: 9 октября 2026 года", intro + body, toc=toc, h1_class="h1-long",
    ), encoding="utf-8")


if __name__ == "__main__":
    main()
