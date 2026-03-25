# Photography Website — Setup Guide

## Files in this folder

| File | Purpose |
|---|---|
| `index.html` | The website structure (don't edit unless confident) |
| `style.css` | All the visual styling (don't edit unless confident) |
| `script.js` | Website logic (don't edit unless confident) |
| `photos.json` | **← You edit this to add photos & change site text** |
| `_redirects` | Required by Netlify (leave as-is) |

---

## How to add a new gallery

Open `photos.json` and add a new entry inside the `"galleries": [ ]` array.
Copy and paste the example below:

```json
{
  "id": "gallery-2",
  "title": "My Walk in the Peak District",
  "date": "2025-03-20",
  "folder": "photography/2025-03-20-peak-district",
  "photos": [
    "IMG_001.jpg",
    "IMG_002.jpg",
    "IMG_003.jpg"
  ]
}
```

### Rules:
- Each gallery needs a **unique `id`** (gallery-1, gallery-2, gallery-3…)
- The `folder` must exactly match the folder path in Cloudinary
- The filenames in `photos` must exactly match the filenames in Cloudinary
- Galleries are automatically sorted newest-first by `date`

---

## How to change your download password

In `photos.json`, find this line and change the password:

```json
"downloadPassword": "photos2024"
```

---

## How to change site text

All the text on the site can be changed in `photos.json`:

- `siteName` — appears in the header and page title
- `heroSubtitle` — the tagline under your name on the homepage
- `aboutText` — the paragraph in the About section
- `contactEmail` — your email address

---

## Deploying to Netlify (to make the site live)

1. Zip up this entire folder
2. Go to **netlify.com** and log in
3. Go to your dashboard → click **Add new site** → **Deploy manually**
4. Drag and drop the zip file into the deploy box
5. Netlify gives you a live URL like `random-name.netlify.app`
6. Optionally: rename your site in Site Settings

**Every time you update photos.json** (to add a new gallery), just re-zip and drag to Netlify again — it redeploys in seconds.

---

## Note on password security

The download password is stored in `photos.json`, which is a public file on your site.
A determined person *could* find it by viewing the page source. For a personal photography
site this is a reasonable trade-off for a free solution. If you need stronger protection,
a paid service like SmugMug or Pixieset would be more appropriate.
