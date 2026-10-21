# Elysian Dental Lounge website

Plain HTML website hosted on GitHub Pages. No build step is needed to view it.

## Blog (automatic)
- Articles live in `content/blog/*.md` and are written in the editor at `/admin/` (see `/admin/guide.html` for the plain-English guide).
- `tools/build_blog.py` turns them into pages, `posts.json`, `sitemap.xml`, `robots.txt` and `admin/status.html`.
  It runs by itself through `.github/workflows/build-blog.yml` whenever content changes and once every night (scheduled posts).
- Also written automatically on every build: the search-engine / link-preview / favicon block in `index.html`, `blog.html` and `service-*.html` (between the `<!--SEO:START-->` and `<!--SEO:END-->` lines), `404.html` and `llms.txt`. The clinic's phone numbers, address and opening hours used in the search-engine data are in `CLINIC_FACTS` at the top of the site-wide section of `tools/build_blog.py` - change them there as well as in `index.html` if they ever change.
- Share-preview pictures (1200x630) are in `images/social/`; article pictures are converted to that size automatically.
- Generated files: `blog-post-*.html` (those containing the "generated-by" comment), `posts.json`, `sitemap.xml`, `robots.txt`, `admin/status.html`. Do not edit them by hand.
- The page look for articles is `tools/post-template.html`.

## Website address
Nothing is tied to one address. All links are relative. The builder reads the `CNAME` file (created by GitHub when a custom domain is set) to write canonical links and the sitemap.

## Appointment form
`appointment-form.js` sends enquiries through Web3Forms (public access key at the top of the file).

## Shared features
`site-extras.css` and `site-features.js` (loaded on every page) provide dark mode, site search (reads the automatic `search-index.json`), scroll progress bar, back-to-top, privacy notice, copy buttons and the footer "Last updated" date (the date the site was last published). `privacy.html` is written by the builder: if analytics or other tracking is ever added, update the text in `PRIVACY_BODY` in `tools/build_blog.py` first.
