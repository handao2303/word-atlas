# Deployment

`npm run build` produces a fully static site in `dist/` that can be hosted anywhere (Vercel, Cloudflare Pages, Nginx, GitHub Pages).

## Vercel (this edition)

The live site runs on Vercel with Supabase for sign-in and sync. See the [README](../README.md#deploy) for the Supabase, Google OAuth and environment variable setup. `vercel.json` sets the build, and `.vercelignore` keeps the ≈1.3 GB of illustrations and audio out of the upload; they are loaded from `VITE_MEDIA_BASE`.

```bash
npx vercel@latest deploy --prod
```

## Sub-path

```bash
ATLAS_BASE=/words/ npm run build
```

## Nginx example

```nginx
location ^~ /words/ {
    alias /var/www/word-atlas/;
    try_files $uri $uri/ /words/index.html;
    expires 7d;
}
```

## Size

Illustrations and audio add up to several hundred megabytes and about 37,000 files, more than many static hosts accept. Serve them from a CDN (as this edition does with `VITE_MEDIA_BASE`), or publish only `thumb/` and part of the audio.
