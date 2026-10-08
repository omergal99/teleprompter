import { createStore, defaults } from "./state.js";
import * as St from "./storage.js";
import { t, applyLang } from "./i18n.js";
import { Prompter } from "./prompterEngine.js";
import { Camera } from "./cameraEngine.js";
import { openPip, pipSupported } from "./pipEngine.js";
import { Voice } from "./voiceEngine.js";
import { mountEditor } from "./components/editor.js";
import { mountScriptList } from "./components/scriptList.js";
import { bindSettings } from "./components/toolbar.js";
import { syncTooltips } from "./ui/tooltips.js";
import { createTransport } from "./ui/transport.js";
import { initDialogs } from "./ui/dialogs.js";
import { initHotkeys } from "./ui/hotkeys.js";
import { createMedia } from "./ui/record.js";

const $ = (id) => document.getElementById(id),
  store = createStore({ ...defaults, ...St.loadSettings() });
let scripts = St.loadScripts(),
  pipWin = null;
const text = $("text"),
  vp = $("viewport"),
  body = document.body;
const FONTS = {
  sans: 'system-ui,-apple-system,"Segoe UI",Arial,sans-serif',
  arial: 'Arial,Helvetica,sans-serif',
  verdana: 'Verdana,Geneva,sans-serif',
  tahoma: 'Tahoma,Geneva,sans-serif',
  times: '"Times New Roman",Times,Georgia,serif',
  serif: 'Georgia,"Times New Roman",serif',
  mono: "ui-monospace,Menlo,Consolas,monospace",
  courier: '"Courier New",Courier,ui-monospace,monospace',
  dyslexic: '"OpenDyslexic","Comic Sans MS","Comic Neue",Verdana,sans-serif',
};
const cam = new Camera($("cam"));

// empty-state helper (declared early so updateLabels can call it safely)
function renderEmptyState() {
  const emptyEl = $("emptyState");
  if (!emptyEl) return;
  const txt = (text.innerText || text.textContent || "").trim();
  emptyEl.hidden = txt.length > 0;
}
function applyStyle(s) {
  const th =
    s.theme === "light"
      ? ["#fff", "#000"]
      : s.theme === "custom"
        ? [s.bgColor, s.fgColor]
        : ["#000", "#fff"];
  for (const root of [
    document.documentElement,
    pipWin?.document.documentElement,
  ].filter(Boolean)) {
    const st = root.style;
    st.setProperty("--bg", th[0]);
    st.setProperty("--fg", th[1]);
    st.setProperty("--size", s.fontSize + "px");
    st.setProperty("--lh", s.lineHeight);
    st.setProperty("--ls", s.letterSpacing + "px");
    st.setProperty("--w", s.width + "%");
    st.setProperty("--zoom", s.viewZoom ?? 1);
    st.setProperty("--font", FONTS[s.font]);
    st.setProperty("--align", s.align);
    st.setProperty("--ov", cam.on ? s.overlay : 100);
    st.setProperty("--guideY", (s.guideY ?? 40) + "%");
  }
  vp.style.transform = `scale(${s.mirrorH ? -1 : 1},${s.mirrorV ? -1 : 1})`;
  body.classList.toggle("guide-on", !!s.guide);
  const gd = $("guide");
  if (gd) gd.hidden = !s.guide;
  applyLang(s.lang);
  syncTooltips(s.lang);
  editor?.syncAlign?.();
  editor?.syncZoom?.();
  transport?.updateLabels();
}

// transport is created below; engine state changes land here (late bind)
let transport = null;
const prompter = new Prompter(vp, text, () => store.get(), {
  onTick: (e) =>
    ($("clock").textContent =
      String((e / 60) | 0).padStart(2, "0") +
      ":" +
      String((e % 60) | 0).padStart(2, "0")),
  onEnd: () => transport?.updateLabels(),
  onChange: () => transport?.updateLabels(),
});
const editor = mountEditor({
  text,
  titleInput: $("titleInput"),
  getStore: () => store.get(),
  setStore: (p) => store.set(p),
  onChange: (html, title) => {
    const s = scripts.find((x) => x.id === store.get().current);
    if (!s) return;
    s.html = html;
    s.title = title;
    s.updated = Date.now();
    St.saveScripts(scripts);
    renderEmptyState();
  },
});
// flush pending edits before unload so no history is lost on refresh/close
addEventListener("beforeunload", () => {
  try {
    const s = scripts.find((x) => x.id === store.get().current);
    if (s) {
      s.html = text.innerHTML;
      s.title = $("titleInput").value;
      s.updated = Date.now();
      St.saveScripts(scripts);
    }
  } catch {}
});
const saveAll = (a) => {
  scripts = a;
  St.saveScripts(a);
};
const list = mountScriptList({
  dlg: $("dlgScripts"),
  list: $("scriptList"),
  getAll: () => scripts,
  setAll: saveAll,
  getCurrent: () => store.get().current,
  open: (id) => {
    let s = scripts.find((x) => x.id === id) || scripts[0];
    // never leave the app without a script (fixes null crash on new/delete)
    if (!s) {
      s = St.newScript(t("untitled"));
      scripts = [s];
      St.saveScripts(scripts);
    }
    store.set({ current: s.id });
    editor.load(s);
    transport.setMode("edit");
    prompter.reset();
  },
});

// ---------------- modules (ui/* keeps app.js as a thin orchestrator) ----------------
transport = createTransport({
  $,
  store,
  body,
  vp,
  text,
  cam,
  prompter,
  editor,
  renderEmptyState,
});

const media = createMedia({ $, store, cam, prompter, applyStyle, transport });

const voice = new Voice((c) =>
  c === "start"
    ? prompter.running || transport.play()
    : c === "stop"
      ? transport.stop()
      : prompter.running && prompter.pause(),
);

// PiP (float window) toggle shared by menu
const pip = {
  async toggle() {
    if (!pipSupported()) return alert(t("noPip"));
    if (pipWin) {
      pipWin.close();
      return;
    }
    try {
      pipWin = await openPip($("wrap"), () => {
        pipWin = null;
      });
      applyStyle(store.get());
    } catch (e) {
      console.error(e);
    }
  },
};

initDialogs({ $, store, cam, pip, list, applyStyle, onCamera: media.toggleCam });
initHotkeys({
  $,
  store,
  play: transport.play,
  stop: transport.stop,
  prompter,
});

bindSettings(store);
let prevVoice = false;
store.subscribe((s, p) => {
  St.saveSettings(s);
  applyStyle(s);
  if ("voice" in p && s.voice !== prevVoice) {
    prevVoice = s.voice;
    s.voice
      ? Voice.supported()
        ? voice.start(s.lang)
        : alert("Speech API not supported")
      : voice.stop();
  }
  if ("lang" in p && voice.active) {
    voice.stop();
    voice.start(s.lang);
  }
});
const first = store.get();
applyStyle(first);
let cur =
  scripts.find((x) => x.id === first.current) ||
  scripts.find(
    (x) => /[\u0590-\u05ff]/.test(x.title) === (first.lang === "he"),
  ) ||
  scripts[0];
// fresh / corrupted storage guard: never boot with undefined script
if (!cur) {
  cur = St.newScript(t("untitled"));
  scripts = [cur];
  St.saveScripts(scripts);
}
store.set({ current: cur.id });
editor.load(cur);
transport.setMode("edit");
list.render();
// empty-viewport wiring (renderEmptyState is declared near top)
text.addEventListener("input", renderEmptyState);
$("emptyNew")?.addEventListener("click", () => {
  text.focus();
  transport.setMode("edit");
});
$("emptySample")?.addEventListener("click", () => {
  const s = scripts.find((x) => x.id === store.get().current);
  if (!s) return;
  s.html = St.textToHtml(
    store.get().lang === "he"
      ? "כתבו כאן את הטקסט שלכם.\nלחצו הפעל כדי להתחיל."
      : "Type your script here.\nPress Start to begin.",
  );
  s.updated = Date.now();
  St.saveScripts(scripts);
  editor.load(s);
  renderEmptyState();
});
if ("serviceWorker" in navigator)
  addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => {
        // auto-activate new SW + reload once so refresh always shows new code
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller)
              location.reload();
          });
        });
        setInterval(() => reg.update().catch(() => {}), 60 * 1000);
      })
      .catch(() => {});
    // if a new SW already took over, reload to get fresh assets
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloaded) {
        reloaded = true;
        location.reload();
      }
    });
  });
