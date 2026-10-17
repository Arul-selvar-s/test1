#!/usr/bin/env python3
"""
Elysian Dental Lounge - safe site fixes

HOW TO USE
  1. Put this file, appointment-form.js and site-enhancements.js in your website
     folder (the same folder as index.html).
  2. Run:   python apply_fixes.py        (or python3 apply_fixes.py)
  3. Open index.html in a browser and check it, then upload/commit to GitHub.

Every file that changes is first copied to the folder  _backup_before_fixes/
(the first backup is never overwritten, so running this twice is safe).

WHAT IT DOES
  - Fixes dead links: elysian_dental_lounge_v2.html  ->  index.html
  - Uses "Medavakkam" everywhere instead of "Kovilambakkam"
  - Adds the mobile menu script to every public page
  - index.html: real Web3Forms appointment form, better title + description,
    removes the "Replace with your actual patient photos" caption,
    hides the "360 tour coming soon" box, removes the dead website link
  - blog.html: newest posts first; no missing-page fallback links
  - posts.json: hides test / placeholder posts (sets draft = true)
It does NOT delete any file.
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKUP = ROOT / "_backup_before_fixes"

OLD_HOME = "elysian_dental_lounge_v2.html"
NEW_HOME = "index.html"

HIDE_IDS = {
    "post-1784454774953",  # Hi tester
    "post-1784454337769",  # T2
    "post-1784454260241",  # Tester 1
    "post-1784239671312",  # dfg (copied Wikipedia text)
    "post-1784148400243",  # test whatever
    "post-1780873913043",  # asdf
    "post-1780873040448",  # test (lion text)
    "post-001",            # placeholder gibberish
    "post-003",            # placeholder gibberish
}

TEST_FILES = [
    "blog-post-hi-tester.html", "blog-post-t2.html", "blog-post-tester-1.html",
    "blog-post-dfg.html", "blog-post-test-whatever.html", "blog-post-asdf.html",
    "blog-post-test.html", "blog-post-1.html",
]

NEW_TITLE_BLOCK = """<title>Elysian Dental Lounge – Dentist in Medavakkam, Chennai</title>
  <meta name="description" content="Elysian Dental Lounge in Medavakkam, Chennai – dental implants, orthodontics, root canal treatment, smile designing, paediatric dentistry and more by Dr. Yokesh Kumar R. Book your appointment today."/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="Elysian Dental Lounge – Dentist in Medavakkam, Chennai"/>
  <meta property="og:description" content="Expert, affordable and hygienic dental care in Medavakkam, Chennai. Book your appointment today."/>"""

NEW_FORM = """<form class="booking-form reveal-right" id="booking-form" novalidate>
      <h3>Book an Appointment</h3>
      <div class="form-row">
        <div class="form-group"><label for="f-name">Full Name</label><input type="text" id="f-name" name="name" placeholder="Your name" autocomplete="name" maxlength="80" required/></div>
        <div class="form-group"><label for="f-phone">Phone Number</label><input type="tel" id="f-phone" name="phone" placeholder="+91 94980 52828" autocomplete="tel" inputmode="tel" maxlength="20" required/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="appt-date">Preferred Date</label><input type="date" id="appt-date" name="date" min="" onchange="updateTimeSlots()" required/></div>
        <div class="form-group"><label for="appt-time">Preferred Time</label>
          <select id="appt-time" name="time" required>
            <option value="">— Select a date first —</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label for="f-service">Select Service</label>
        <select id="f-service" name="service">
          <option>General Checkup</option>
          <option>Prosthodontics</option>
          <option>Dental Implants</option>
          <option>Orthodontics</option>
          <option>Root Canal Treatment</option>
          <option>Smile Designing</option>
          <option>Paediatric Dentistry</option>
          <option>Sedation Dentistry</option>
          <option>Clearalign</option>
        </select>
      </div>
      <div class="form-group"><label for="f-message">Message (optional)</label><input type="text" id="f-message" name="message" placeholder="Any concern or question?" maxlength="300"/></div>
      <input type="checkbox" name="botcheck" id="f-botcheck" tabindex="-1" autocomplete="off" style="display:none" aria-hidden="true"/>
      <div id="form-status" class="form-status" role="status" aria-live="polite"></div>
      <button type="submit" class="btn-submit">Confirm Appointment →</button>
      <p class="form-privacy">We use your details only to contact you about your appointment.</p>
    </form>"""


def read_text_keep(path):
    """Read a file as LF text and remember whether it used Windows (CRLF) line endings."""
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    return raw.replace("\r\n", "\n"), crlf


def write_text_keep(path, text, crlf):
    if crlf:
        text = text.replace("\n", "\r\n")
    path.write_bytes(text.encode("utf-8"))


def note(msg):
    print(msg)


def backup(path):
    BACKUP.mkdir(exist_ok=True)
    dest = BACKUP / path.name
    if not dest.exists():
        shutil.copy2(path, dest)


def sub_once(text, pattern, replacement, label, flags=re.S):
    new, n = re.subn(pattern, lambda m: replacement, text, count=1, flags=flags)
    note("   %s %s%s" % ("done   " if n else "skipped", label, "" if n else " (not found or already applied)"))
    return new


def add_script_tag(text, src):
    if src in text:
        return text
    idx = text.rfind("</body>")
    if idx == -1:
        return text
    return text[:idx] + '<script src="%s" defer></script>\n' % src + text[idx:]


def process_html(path):
    original, crlf = read_text_keep(path)
    text = original
    name = path.name
    is_admin = name == "admin.html"

    text = text.replace(OLD_HOME, NEW_HOME)
    text = text.replace("Kovilambakkam", "Medavakkam")

    if not is_admin:
        text = add_script_tag(text, "site-enhancements.js")

    if name == "index.html":
        text = sub_once(text, r"<title>Elysian Dental Lounge – Chennai</title>", NEW_TITLE_BLOCK,
                        "homepage title + meta description")
        text = sub_once(text,
                        r'<div class="booking-form reveal-right" id="booking-form">.*?<button class="btn-submit"[^>]*>.*?</button>\s*</div>',
                        NEW_FORM, "real appointment form (Web3Forms)")
        text = add_script_tag(text, "appointment-form.js")
        text = sub_once(text, r"← Drag to reveal · Replace with your actual patient photos",
                        "← Drag to reveal", "slider caption placeholder text")
        text = sub_once(text, r'<section class="view360-section" id="clinic-view">',
                        '<section class="view360-section" id="clinic-view" hidden>',
                        "hide '360 tour coming soon' section")
        text = sub_once(text,
                        r'\s*<div class="contact-item">\s*<div class="c-icon">🌐</div>\s*<div>\s*<div class="c-label">Website</div>\s*<div class="c-val"><a href="#">Elysiandental\.com</a></div>\s*</div>\s*</div>',
                        "", "dead 'Elysiandental.com' link")

    if name == "blog.html":
        old = "allPosts = (data.posts || []).filter(p => !p.draft);"
        new = ("allPosts = (data.posts || []).filter(p => !p.draft)"
               ".sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));")
        if old in text:
            text = text.replace(old, new)
            note("   done    blog list sorted newest first")
        else:
            note("   skipped blog sort (not found or already applied)")
        old = "allPosts = fallbackPosts();"
        new = "allPosts = fallbackPosts().filter(p => p.filename === 'blog-post-2.html');"
        if old in text:
            text = text.replace(old, new)
            note("   done    blog fallback no longer links to missing/placeholder pages")
        else:
            note("   skipped blog fallback (not found or already applied)")

    if text != original:
        backup(path)
        write_text_keep(path, text, crlf)
        return True
    return False


def process_posts_json():
    path = ROOT / "posts.json"
    if not path.exists():
        note("posts.json not found - skipped")
        return
    raw, crlf = read_text_keep(path)
    fixed = raw.replace(OLD_HOME, NEW_HOME).replace("Kovilambakkam", "Medavakkam")
    data = json.loads(fixed)
    hidden = 0
    for p in data.get("posts", []):
        if p.get("id") in HIDE_IDS and not p.get("draft"):
            p["draft"] = True
            hidden += 1
        if p.get("id") == "post-002":
            p.setdefault("draft", False)
    out = json.dumps(data, ensure_ascii=False, indent=2)
    if out.strip() != raw.strip():
        backup(path)
        write_text_keep(path, out + "\n", crlf)
    live = [p["title"] for p in data.get("posts", []) if not p.get("draft")]
    note("posts.json: %d test/placeholder post(s) hidden. Still public: %s" % (hidden, live or "none"))


def main():
    for needed in ("appointment-form.js", "site-enhancements.js"):
        if not (ROOT / needed).exists():
            raise SystemExit("Missing %s - put it in the same folder as this script." % needed)
    if not (ROOT / "index.html").exists():
        raise SystemExit("index.html not found - run this script from your website folder.")

    changed = []
    for path in sorted(ROOT.glob("*.html")):
        print("\n%s" % path.name)
        if process_html(path):
            changed.append(path.name)
            note("   -> updated")
        else:
            note("   -> no changes")
    print("")
    process_posts_json()

    print("\nFiles updated: %d" % len(changed))
    if BACKUP.exists():
        print("Backups of originals are in: %s" % BACKUP.name)

    leftovers = [p.name for p in ROOT.glob("*.html") if "Kovilambakkam" in read_text_keep(p)[0]]
    if leftovers:
        print("Still mentions Kovilambakkam: %s" % ", ".join(leftovers))

    present = [f for f in TEST_FILES if (ROOT / f).exists()]
    if present:
        print("\nTest/placeholder pages that are hidden from the blog list but still reachable")
        print("by direct URL. Delete them from your GitHub repo when you are ready:")
        for f in present:
            print("   - " + f)


if __name__ == "__main__":
    main()
