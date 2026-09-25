/* Local demo interactions only. No submission, persistence, analytics or fetch. */
(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  const mobile = window.matchMedia('(max-width: 1023px)');

  if (header && toggle && nav) {
    const setOpen = (open, restoreFocus = false) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.menu-label').textContent = open ? '閉じる' : 'メニュー';
      nav.classList.toggle('is-open', open);
      if (restoreFocus) toggle.focus();
    };
    const updateLayout = () => {
      const active = document.activeElement;
      const focusWillHide = mobile.matches ? nav.contains(active) : active === toggle;
      toggle.hidden = !mobile.matches;
      setOpen(false);
      if (focusWillHide) (mobile.matches ? toggle : nav.querySelector('a')).focus();
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false, true);
      }
    });
    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || !mobile.matches) return;
      setOpen(false);
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
    });
    if (mobile.addEventListener) mobile.addEventListener('change', updateLayout);
    else mobile.addListener(updateLayout);
    // Collapse only after all controls have been wired. Without JS the links remain visible.
    header.classList.add('menu-enhanced');
    updateLayout();
  }

  document.querySelectorAll('.image-frame img').forEach((image) => {
    const showPlaceholder = () => image.parentElement.classList.add('image-unavailable');
    image.addEventListener('error', showPlaceholder);
    if (image.complete && image.naturalWidth === 0) showPlaceholder();
  });

  const viewSwitch = document.querySelector('.view-switch');
  if (viewSwitch) {
    const setView = (view, preservePosition = true) => {
      // Only presentation state travels between pages; never any field values.
      const anchors = [...document.querySelectorAll('main h1, main h2, main h3, .image-frame, .form-field, .footer-top')];
      const anchor = anchors.find((element) => element.getBoundingClientRect().top >= 0);
      const previousTop = anchor?.getBoundingClientRect().top;
      const previousScroll = window.scrollY;
      document.documentElement.classList.toggle('is-preview', view === 'preview');
      viewSwitch.querySelectorAll('[data-view]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.view === view));
      });
      document.querySelectorAll('[data-page-link]').forEach((link) => {
        const url = new URL(link.getAttribute('href'), window.location.href);
        if (view === 'preview') url.searchParams.set('view', 'preview');
        else url.searchParams.delete('view');
        link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
      });
      document.querySelector('#view-status').textContent = view === 'preview'
        ? '完成イメージを表示しています。デモに関する注記は引き続き表示されます。'
        : '確認用デモを表示しています。各所のご相談メッセージをご覧いただけます。';
      if (preservePosition && previousScroll > 0 && anchor) {
        const currentTop = anchor.getBoundingClientRect().top;
        // Hiding notes can already clamp scrollY near the document's bottom.
        window.scrollTo({ top: window.scrollY + currentTop - previousTop, behavior: 'instant' });
      }
    };
    viewSwitch.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => setView(button.dataset.view));
    });
    viewSwitch.hidden = false;
    setView(new URLSearchParams(window.location.search).get('view') === 'preview' ? 'preview' : 'review', false);
  }

  const panel = document.querySelector('#demo-form');
  if (panel) {
    const contact = document.querySelector('#demo-contact');
    const result = document.querySelector('#form-result');
    const check = document.querySelector('#demo-check');
    const clear = document.querySelector('#demo-clear');
    const fields = [...panel.querySelectorAll('input[required]:not([type="radio"]), select[required]')];
    let checked = false;
    const selectedMethod = () => panel.querySelector('input[name="demo-method"]:checked').value;
    const validate = (field) => {
      let message = '';
      const value = field.value.trim();
      if (!value) {
        message = ({ 'demo-name': 'お名前を入力してください。', 'demo-city': '市区町村を入力してください。', 'demo-topic': 'ご相談内容をお選びください。', 'demo-contact': '選んだ連絡方法の連絡先を入力してください。' })[field.id];
      } else if (field === contact && selectedMethod() === 'email' && !field.validity.valid) {
        message = 'メールアドレスの形式をご確認ください。例：example@example.com';
      } else if (field === contact && selectedMethod() === 'tel') {
        const normalized = value.normalize('NFKC');
        const count = normalized.replace(/\D/g, '').length;
        if (!/^[+\d\s()-]+$/.test(normalized) || count < 10 || count > 15) {
          message = '電話番号の形式をご確認ください。例：000-0000-0000';
        }
      }
      const error = document.querySelector(`#${field.id}-error`);
      error.textContent = message;
      error.hidden = !message;
      field.setAttribute('aria-invalid', String(Boolean(message)));
      return !message;
    };
    const updateMethod = () => {
      const email = selectedMethod() === 'email';
      contact.type = email ? 'email' : 'tel';
      contact.inputMode = email ? 'email' : 'tel';
      contact.placeholder = email ? '例：example@example.com' : '例：000-0000-0000';
      document.querySelector('#contact-field-label').textContent = email ? 'メールアドレス' : '電話番号';
      result.hidden = true;
      if (checked) validate(contact);
    };
    panel.querySelectorAll('input[name="demo-method"]').forEach((radio) => radio.addEventListener('change', updateMethod));
    fields.forEach((field) => field.addEventListener('input', () => {
      result.hidden = true;
      if (checked) validate(field);
    }));
    check.addEventListener('click', () => {
      checked = true;
      const invalid = fields.filter((field) => !validate(field));
      result.hidden = false;
      result.classList.toggle('has-errors', invalid.length > 0);
      if (invalid.length) {
        result.textContent = '入力が必要な項目や、形式を確認したい項目があります。各欄の案内をご覧ください。入力内容は送信されていません。';
        invalid[0].focus();
      } else {
        result.textContent = '入力項目の確認ができました。これはデモの操作確認です。入力内容は送信・保存されておらず、実際のお問い合わせにはつながりません。';
        result.focus();
      }
    });
    const clearFields = () => {
      panel.querySelectorAll('input:not([type="radio"]), textarea, select').forEach((field) => { field.value = ''; field.removeAttribute('aria-invalid'); });
      panel.querySelector('input[value="email"]').checked = true;
      panel.querySelectorAll('.field-error').forEach((error) => { error.hidden = true; error.textContent = ''; });
      checked = false;
      result.hidden = true;
      result.textContent = '';
      updateMethod();
    };
    clear.addEventListener('click', () => { clearFields(); document.querySelector('#demo-name').focus(); });
    // Erase the in-page demonstration values on leaving or restoring the page.
    window.addEventListener('pagehide', clearFields);
    window.addEventListener('pageshow', (event) => { if (event.persisted) clearFields(); });
    updateMethod();
    check.hidden = false;
    clear.hidden = false;
  }
})();
