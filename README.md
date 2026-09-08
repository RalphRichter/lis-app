# Lisbon with Friends

A mobile-first shared trip shortlist for Lisbon, 8–13 September 2026.

## Features

- Day-by-day trip overview
- Fixed itinerary + flexible ideas
- 👍 voting per person
- Friends can add new ideas
- Shared persistence with Supabase
- LocalStorage fallback for local demo/testing
- Works as a plain static site (GitHub Pages, Netlify, Vercel, etc.)

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase.sql`.
3. Open **Project Settings → API**.
4. Copy the Project URL and anon/public key into `config.js`:

```js
window.LIS_APP_CONFIG = {
  SUPABASE_URL: "https://YOURPROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_KEY"
};
```

5. Commit and deploy.

The anon key is designed for browser apps. Access is controlled by the Row Level Security policies in `supabase.sql`.

## Local preview

Because this is a static app, either open `index.html` directly or run a local web server, e.g.:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## GitHub Pages

Repository → **Settings → Pages** → Deploy from branch → `main` / root.
