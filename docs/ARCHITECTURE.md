# Architecture

Static site, no backend. `index.html` + `css/` + `js/` (ES modules). `app.js` wires `state` (store), `storage` (localStorage), `i18n`, `prompterEngine` (rAF scroll), `cameraEngine` (getUserMedia/MediaRecorder), `pipEngine` (Document PiP), `voiceEngine` (Web Speech), and `components/` (editor, scriptList, settings binding). `sw.js` caches the shell for offline use.

## UI model

Edit mode: editable text + formatting bar. Present mode: read-only, scroll engine. Pencil button pauses and returns to edit without losing position; Stop resets.
