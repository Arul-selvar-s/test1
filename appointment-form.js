/* Elysian Dental Lounge — appointment enquiry form (sends via Web3Forms)
   The access key below is a PUBLIC key by design: it can only deliver messages
   to the email address registered with Web3Forms. It is not a password. */
(function () {
  'use strict';

  var ACCESS_KEY = '4408ac14-5b0f-4656-ad8c-a76497a905a1';
  var ENDPOINT = 'https://api.web3forms.com/submit';

  var form = document.getElementById('booking-form');
  if (!form || form.tagName !== 'FORM') return;

  var status = document.getElementById('form-status');
  var btn = form.querySelector('.btn-submit');

  var css =
    '.form-status{display:none;margin:.25rem 0 1rem;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.6}' +
    '.form-status.show{display:block}' +
    '.form-status.ok{background:#e8f7ee;color:#14532d;border:1px solid #a7e3bd}' +
    '.form-status.err{background:#fdecec;color:#7f1d1d;border:1px solid #f5b5b5}' +
    '.form-group input[aria-invalid="true"],.form-group select[aria-invalid="true"]{border-color:#d93025}' +
    '.btn-submit:disabled{opacity:.65;cursor:not-allowed;transform:none}' +
    '.form-privacy{font-size:12px;color:#4f7396;line-height:1.6;margin-top:.9rem;text-align:center}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function showStatus(type, msg) {
    status.className = 'form-status show ' + type;
    status.textContent = msg;
  }

  function clearInvalid() {
    var bad = form.querySelectorAll('[aria-invalid]');
    for (var i = 0; i < bad.length; i++) bad[i].removeAttribute('aria-invalid');
  }

  function invalid(el, msg) {
    el.setAttribute('aria-invalid', 'true');
    showStatus('err', msg);
    el.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearInvalid();

    var nameEl = document.getElementById('f-name');
    var phoneEl = document.getElementById('f-phone');
    var dateEl = document.getElementById('appt-date');
    var timeEl = document.getElementById('appt-time');
    var serviceEl = document.getElementById('f-service');
    var msgEl = document.getElementById('f-message');

    var name = nameEl.value.trim();
    if (name.length < 2) return invalid(nameEl, 'Please enter your full name.');

    var phoneClean = phoneEl.value.replace(/[\s\-()]/g, '');
    if (!/^(\+?91|0)?[6-9]\d{9}$/.test(phoneClean)) {
      return invalid(phoneEl, 'Please enter a valid 10-digit mobile number.');
    }

    if (!dateEl.value) return invalid(dateEl, 'Please choose a preferred date.');
    if (dateEl.min && dateEl.value < dateEl.min) {
      return invalid(dateEl, 'Please choose today or a future date.');
    }
    if (!timeEl.value) return invalid(timeEl, 'Please choose a preferred time.');

    // Hidden spam trap: real visitors never tick this box.
    if (form.elements['botcheck'] && form.elements['botcheck'].checked) return;

    var payload = {
      access_key: ACCESS_KEY,
      subject: 'New appointment request - Elysian Dental Lounge',
      from_name: 'Elysian Dental Lounge website',
      name: name,
      phone: phoneEl.value.trim(),
      preferred_date: dateEl.value,
      preferred_time: timeEl.value,
      service: serviceEl.value,
      message: msgEl.value.trim()
    };

    var originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        if (res.ok && res.data && res.data.success === true) {
          var first = name.split(/\s+/)[0];
          showStatus('ok', 'Thank you, ' + first + '! We have received your request and will call you shortly to confirm your appointment.');
          form.reset();
          timeEl.innerHTML = '<option value="">— Select a date first —</option>';
        } else {
          throw new Error('Web3Forms did not confirm delivery');
        }
      })
      .catch(function () {
        showStatus('err', 'Sorry, we could not send your request. Please call us on 94980 52828 or message us on WhatsApp.');
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = originalLabel;
      });
  });
})();
