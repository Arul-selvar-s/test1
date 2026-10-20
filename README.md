# Elysian Dental Lounge website

Plain HTML website hosted on GitHub Pages. No build step is needed to view it.

## Blog (automatic)
- Articles live in `content/blog/*.md` and are written in the editor at `/admin/` (see `/admin/guide.html` for the plain-English guide).
- `tools/build_blog.py` turns them into pages, `posts.json`, `sitemap.xml`, `robots.txt` and `admin/status.html`.
  It runs by itself through `.github/workflows/build-blog.yml` whenever content changes and once every night (scheduled posts).
- Generated files: `blog-post-*.html` (those containing the "generated-by" comment), `posts.json`, `sitemap.xml`, `robots.txt`, `admin/status.html`. Do not edit them by hand.
- The page look for articles is `tools/post-template.html`.

## Website address
Nothing is tied to one address. All links are relative. The builder reads the `CNAME` file (created by GitHub when a custom domain is set) to write canonical links and the sitemap.

## Appointment form
`appointment-form.js` sends enquiries through Web3Forms (public access key at the top of the file).
