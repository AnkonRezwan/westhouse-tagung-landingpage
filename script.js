(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sticky header */
  var header = doc.getElementById('site-header');
  if (header) {
    var updateHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* Mobile navigation */
  var nav = doc.getElementById('primary-nav');
  var navToggle = doc.getElementById('nav-toggle');
  if (nav && navToggle) {
    var closeNav = function (returnFocus) {
      if (navToggle.getAttribute('aria-expanded') !== 'true') return;
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Menü öffnen');
      if (returnFocus) navToggle.focus();
    };

    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav(false);
    });

    doc.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(e.target) || navToggle.contains(e.target)) return;
      closeNav(false);
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') closeNav(true);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) closeNav(false);
    });
  }

  /* Scroll reveal */
  var revealItems = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));
  if (revealItems.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      root.classList.add('reveal-ready');
      var observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }
      );
      revealItems.forEach(function (item) { observer.observe(item); });
    } else {
      revealItems.forEach(function (item) { item.classList.add('is-visible'); });
    }
  }

  /* Footer year */
  var year = doc.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* Inquiry form */
  var form = doc.getElementById('anfrage-form');
  if (!form) return;

  var statusBox = doc.getElementById('form-status');
  var recipient = 'info@westhouse-augsburg.de';
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var fields = {
    name: doc.getElementById('f-name'),
    company: doc.getElementById('f-company'),
    email: doc.getElementById('f-email'),
    phone: doc.getElementById('f-phone'),
    date: doc.getElementById('f-date'),
    attendees: doc.getElementById('f-attendees'),
    type: doc.getElementById('f-type'),
    notes: doc.getElementById('f-notes'),
    privacy: doc.getElementById('f-privacy')
  };

  var messages = {
    name: 'Bitte geben Sie Ihren Namen an.',
    company: 'Bitte geben Sie Ihre Firma oder Organisation an.',
    email: 'Bitte geben Sie eine gültige E-Mail-Adresse an.',
    date: 'Bitte geben Sie einen Termin oder Zeitraum an.',
    attendees: 'Bitte geben Sie die voraussichtliche Teilnehmerzahl an.',
    type: 'Bitte wählen Sie ein Veranstaltungsformat aus.',
    privacy: 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.'
  };

  var fieldWrap = function (input) {
    return input ? input.closest('.field') : null;
  };

  var setError = function (input, message) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    var error = wrap.querySelector('.field__error');
    if (error) error.textContent = message;
  };

  var clearError = function (input) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
    var error = wrap.querySelector('.field__error');
    if (error) error.textContent = '';
  };

  var validate = function (input) {
    if (!input) return true;
    var value = (input.value || '').trim();

    if (input === fields.name && value.length < 2) {
      setError(input, messages.name);
      return false;
    }
    if (input === fields.company && value.length < 2) {
      setError(input, messages.company);
      return false;
    }
    if (input === fields.email && !emailPattern.test(value)) {
      setError(input, messages.email);
      return false;
    }
    if (input === fields.date && value.length < 2) {
      setError(input, messages.date);
      return false;
    }
    if (input === fields.attendees && (!value || parseInt(value, 10) < 1)) {
      setError(input, messages.attendees);
      return false;
    }
    if (input === fields.type && !value) {
      setError(input, messages.type);
      return false;
    }
    if (input === fields.privacy && !input.checked) {
      setError(input, messages.privacy);
      return false;
    }

    clearError(input);
    return true;
  };

  var requiredKeys = ['name', 'company', 'email', 'date', 'attendees', 'type', 'privacy'];
  var required = requiredKeys.map(function (key) { return fields[key]; }).filter(Boolean);

  required.forEach(function (input) {
    input.addEventListener('blur', function () { validate(input); });
    input.addEventListener('input', function () {
      var wrap = fieldWrap(input);
      if (wrap && wrap.classList.contains('has-error')) validate(input);
    });
    if (input === fields.type || input === fields.privacy) {
      input.addEventListener('change', function () { validate(input); });
    }
  });

  var showStatus = function (html) {
    if (!statusBox) return;
    statusBox.innerHTML = html;
    statusBox.hidden = false;
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var valid = true;
    var firstInvalid = null;
    required.forEach(function (input) {
      if (!validate(input)) {
        valid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (!valid) {
      if (statusBox) statusBox.hidden = true;
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      return;
    }

    var checked = Array.prototype.slice
      .call(form.querySelectorAll('input[type="checkbox"]:checked'))
      .map(function (input) { return input.value; })
      .filter(function (value) { return value !== 'on'; });

    var subject = 'Tagungsanfrage über die Website: ' + fields.type.value;
    var body = [
      'Name: ' + fields.name.value.trim(),
      'Firma / Organisation: ' + fields.company.value.trim(),
      'E-Mail: ' + fields.email.value.trim(),
      fields.phone && fields.phone.value.trim() ? 'Telefon: ' + fields.phone.value.trim() : null,
      'Termin / Zeitraum: ' + fields.date.value.trim(),
      'Teilnehmerzahl: ' + fields.attendees.value.trim(),
      'Veranstaltungsformat: ' + fields.type.value,
      checked.length ? 'Zusätzlicher Bedarf: ' + checked.join(', ') : null,
      fields.notes && fields.notes.value.trim() ? 'Hinweise: ' + fields.notes.value.trim() : null
    ].filter(function (line) { return line !== null; }).join('\r\n');

    var mailto = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

    showStatus(
      '<strong>Ihre Anfrage ist vorbereitet.</strong> Bitte prüfen Sie die Angaben und senden Sie ' +
      'die E-Mail über diesen Link: <a href="' + mailto + '">' + recipient + '</a>. ' +
      'Für den produktiven Betrieb ist noch ein freigegebener Empfänger bzw. CRM-Anschluss erforderlich.'
    );

    if (statusBox) statusBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  });
})();
