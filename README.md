# Teleprompter PWA / טלפרומפטר
Fast, offline-capable, zero-dependency teleprompter for mobile and desktop. Hebrew (RTL) and English (LTR).

## Quick start
```
make run     # http://localhost:8080
make check   # syntax-check all JS
make zip     # package
```
Camera and service worker need `localhost` or HTTPS.

## Features
60FPS scrolling (up/down), speed 1–100 with live value, per-paragraph speed, touch/wheel pause + auto-resume, optional countdown, clock, edit-while-paused, mirror H/V, reading line, text sheet (size, spacing, width, font, alignment, themes), rich text, script library with import/export, camera overlay, recording (camera+mic only), Document PiP, voice commands, rotate/fullscreen, offline PWA.

## Layout
```
index.html  manifest.json  sw.js  Makefile
css/  js/ (+components/)  icons/  docs/  .skills/  .github/workflows/deploy.yml
```
## Deploy
Push to `main`, then Settings → Pages → Source: GitHub Actions.
