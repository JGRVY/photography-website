# CarSpot UK 🚗

A car identification quiz for UK roads. Shows a car image and asks you to identify the make and model from four multiple-choice options.

## Stack

- **GitHub** — source control
- **Vercel** — free static hosting (auto-deploys on push)
- **Cloudinary** — image hosting (optional, but recommended)

## Getting Started

### 1. Clone / upload to GitHub
Create a new repo and push these four files:
```
index.html
style.css
script.js
questions.json
```

### 2. Deploy on Vercel
- Go to [vercel.com](https://vercel.com) → New Project
- Import your GitHub repo
- No build settings needed — it's a static site
- Click Deploy

That's it. Vercel will auto-redeploy every time you push to GitHub.

---

## Adding Real Car Images

The `questions.json` file currently uses **placeholder images** from picsum.photos. To use real car photos:

### Option A — Cloudinary (recommended)
1. Log in to your Cloudinary account
2. Create a folder called `car-quiz`
3. Upload your car photos there
4. Replace the `"image"` URL in `questions.json` with the Cloudinary URL:

```json
"image": "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/car-quiz/ford-fiesta.jpg"
```

Cloudinary tip: Append `/w_900,c_fill,ar_16:9` to auto-crop to 16:9 landscape:
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/w_900,c_fill,ar_16:9/v1/car-quiz/ford-fiesta.jpg
```

### Option B — Any direct image URL
You can use any publicly accessible image URL. Wikimedia Commons is a good free source with CC-licensed car photos.

---

## Adding Questions

Edit `questions.json`. Each question follows this structure:

```json
{
  "id": 21,
  "difficulty": "easy",
  "image": "https://your-image-url.jpg",
  "correct": "Ford Fiesta",
  "wrong": ["Vauxhall Corsa", "Peugeot 208", "Renault Clio"]
}
```

| Field        | Description |
|--------------|-------------|
| `id`         | Unique number (increment from last) |
| `difficulty` | `"easy"` or `"medium"` |
| `image`      | Direct URL to a landscape car photo (16:9 recommended) |
| `correct`    | The right answer |
| `wrong`      | Array of exactly 3 plausible wrong answers |

**Tips for good wrong answers:**
- Use cars from the same segment (e.g. don't mix a supermini with an SUV)
- Use cars of similar era
- Medium questions can use very similar-looking cars (e.g. VW Group siblings)

---

## Question Bank

Currently includes **20 questions**:
- 10 Easy — common UK cars, front-on views
- 10 Medium — less common models, angled shots

---

## Customisation

All colours are CSS variables in `style.css`:

```css
:root {
  --accent: #C8281E;   /* Red — change to any colour */
  --bg:     #F4F3F0;   /* Page background */
  --surface: #FFFFFF;  /* Card background */
}
```
