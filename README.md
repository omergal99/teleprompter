# Teleprompter PWA / טלפרומפטר
Zero-dependency, offline-capable teleprompter (vanilla ES modules). Hebrew RTL + English LTR.

## Run locally
`python3 -m http.server 8080` then open http://localhost:8080 (service worker/camera need localhost or HTTPS).

## Deploy
Push to `main` of a GitHub repo, enable Settings → Pages → Source: GitHub Actions. `.github/workflows/deploy.yml` publishes it.

## Features
rAF 60FPS scroll, up/down direction, speed 1–100, per-block speed (⚡), touch/wheel pause + auto-resume, countdown, MM:SS clock, mirror H/V, reading line, fonts/spacing/width/alignment/themes, rich text (bold/underline/color), script library (rename/duplicate/delete, .txt/.json import/export), camera overlay (double-tap preview flips front/back), recording of camera+mic only (text excluded), Document PiP floating window (Chromium desktop), voice commands (start/stop/pause), offline PWA.
Shortcuts: Space play/pause, Esc stop, ↑/↓ speed.

## Not implemented
Canvas-PiP fallback for browsers without Document PiP; IndexedDB fallback (localStorage only); PNG icons (SVG icon used).
