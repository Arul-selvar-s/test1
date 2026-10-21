/* Elysian Dental Lounge — appointment enquiry form (sends via Web3Forms)
   The access key below is a PUBLIC key by design: it can only deliver messages
   to the email address registered with Web3Forms. It is not a password. */
(function () {
  'use strict';

  var ACCESS_KEY = '94fa5af2-b53b-44ab-8940-298cd9a2d0c9';
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var WHATSAPP_NUMBER = '919498052828';   // the clinic's WhatsApp number (same as the WhatsApp links on the site)

  var form = document.getElementById('booking-form');
  if (!form || form.tagName !== 'FORM') return;

  var status = document.getElementById('form-status');
  var btn = form.querySelector('.btn-submit');

  var css =
    '.form-status{display:none;margin:.25rem 0 1rem;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.6}' +
    '.form-status.show{display:block}' +
    '.form-status.ok{background:#e8f7ee;color:#14532d;border:1px solid #a7e3bd}' +
    '.form-status.err{background:#fdecec;color:#7f1d1d;border:1px solid #f5b5b5}' +
    '.form-status .wa-copy{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;min-height:44px;padding:10px 16px;border-radius:30px;background:#1a7f4b;color:#fff;font-weight:500;text-decoration:none}' +
    '.form-status .wa-copy:hover{background:#146b3f}' +
    '.form-status .wa-note{display:block;margin-top:8px;font-size:12px;opacity:.85}' +
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

  // After the email has really been delivered, offer an OPTIONAL WhatsApp copy.
  // It opens WhatsApp with the details already typed; the patient only has to press Send.
  // The enquiry itself is already safe by email, so this is never needed for the booking to work.
  function addWhatsAppCopy(d) {
    var lines = [
      'Hello Elysian Dental Lounge, I have just requested an appointment on your website.',
      'Name: ' + d.name,
      'Phone: ' + d.phone,
      'Preferred date: ' + d.date,
      'Preferred time: ' + d.time,
      'Treatment: ' + d.service
    ];
    if (d.message) lines.push('Message: ' + d.message);
    var a = document.createElement('a');
    a.className = 'wa-copy';
    a.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Also send these details on WhatsApp';
    var note = document.createElement('span');
    note.className = 'wa-note';
    note.textContent = 'Optional. Opens WhatsApp with your details ready to send, so we can reach you faster.';
    status.appendChild(a);
    status.appendChild(note);
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
          addWhatsAppCopy({ name: name, phone: payload.phone, date: payload.preferred_date, time: payload.preferred_time, service: payload.service, message: payload.message });
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
