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

const $ = (id) => document.getElementById(id),
  store = createStore({ ...defaults, ...St.loadSettings() });
let scripts = St.loadScripts(),
  pipWin = null,
  cdTimer = 0,
  cancelCd = () => {};
const text = $("text"),
  vp = $("viewport"),
  body = document.body;
const FONTS = {
  sans: 'system-ui,-apple-system,"Segoe UI",Arial,sans-serif',
  serif: 'Georgia,"Times New Roman",serif',
  mono: "ui-monospace,Menlo,Consolas,monospace",
  dyslexic: '"OpenDyslexic","Comic Sans MS","Comic Neue",Verdana,sans-serif',
};
const cam = new Camera($("cam"));

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
  }
  vp.style.transform = `scale(${s.mirrorH ? -1 : 1},${s.mirrorV ? -1 : 1})`;
  body.classList.toggle("guide-on", s.guide);
  applyLang(s.lang);
  syncTooltips(s.lang);
  editor?.syncAlign?.();
  editor?.syncZoom?.();
  updateLabels();
}

const prompter = new Prompter(vp, text, () => store.get(), {
  onTick: (e) =>
    ($("clock").textContent =
      String((e / 60) | 0).padStart(2, "0") +
      ":" +
      String((e % 60) | 0).padStart(2, "0")),
  onEnd: () => updateLabels(),
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
  },
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
    const s = scripts.find((x) => x.id === id) || scripts[0];
    if (!s) return;
    store.set({ current: s.id });
    editor.load(s);
    setMode("edit");
    prompter.reset();
  },
});

function setMode(m) {
  const was = body.classList.contains("mode-present"),
    pt = Math.round(vp.clientHeight * 0.4);
  document.documentElement.style.setProperty("--pt", pt + "px");
  body.classList.toggle("mode-present", m === "present");
  body.classList.toggle("mode-edit", m === "edit");
  editor.setEditable(m === "edit");
  if (m === "present" && !was) vp.scrollTop += pt - 12;
  if (m === "edit" && was) vp.scrollTop = Math.max(0, vp.scrollTop - (pt - 12));
  if (m === "edit") body.classList.remove("hide-ui");
  updateLabels();
}
function updateLabels() {
  const run = prompter.running || !!cdTimer;
  $("playIcon").firstChild.firstElementChild.setAttribute(
    "href",
    run ? "#i-pause" : "#i-play",
  );
  $("btnRec").classList.toggle("on", cam.recording);
  $("recBadge").hidden = !cam.recording;
}
function countdown(sec) {
  return new Promise((res) => {
    const el = $("countdown");
    let n = sec;
    if (n <= 0) return res(true);
    el.style.display = "flex";
    el.textContent = n;
    cdTimer = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(cdTimer);
        cdTimer = 0;
        el.style.display = "none";
        res(true);
      } else el.textContent = n;
    }, 1000);
    cancelCd = () => {
      clearInterval(cdTimer);
      cdTimer = 0;
      el.style.display = "none";
      res(false);
    };
  });
}
async function play() {
  if (cdTimer) {
    cancelCd();
    updateLabels();
    return;
  }
  if (prompter.running) {
    prompter.pause();
    updateLabels();
    return;
  }
  if (body.classList.contains("mode-edit")) setMode("present");
  updateLabels();
  if (
    prompter.elapsed === 0 &&
    vp.scrollTop < 5 &&
    store.get().countdownOn &&
    (await countdown(store.get().countdown)) === false
  )
    return;
  prompter.start();
  updateLabels();
}
const stop = () => {
  cancelCd();
  prompter.reset();
  $("clock").textContent = "00:00";
  setMode("edit");
  updateLabels();
};
const toggleCam = async (on) => {
  try {
    on ? await cam.start(store.get().facing) : cam.stop();
    body.classList.toggle("cam-on", on);
    applyStyle(store.get());
  } catch {
    alert(t("noCam"));
  }
};
const voice = new Voice((c) =>
  c === "start"
    ? prompter.running || play()
    : c === "stop"
      ? stop()
      : prompter.running && (prompter.pause(), updateLabels()),
);

$("btnPlay").onclick = play;
$("btnStop").onclick = stop;
$("btnBack").onclick = () => prompter.seek(-10);
$("btnFwd").onclick = () => prompter.seek(10);
$("btnHide").onclick = () => body.classList.add("hide-ui");
$("showUi").onclick = () => body.classList.remove("hide-ui");
$("stage").addEventListener("click", () => body.classList.remove("hide-ui"));
$("btnEdit").onclick = () => {
  prompter.pause();
  setMode("edit");
};
function syncTooltips(lang) {
  const he = lang === "he";
  const map = {
    btnScripts: he ? "סקריפטים" : "Scripts",
    btnText: he ? "הגדרות טקסט" : "Text settings",
    btnSettings: he ? "הגדרות" : "Settings",
    btnMenu: he ? "עוד" : "More",
    btnFontPlus: he ? "הגדל גופן" : "Increase font size",
    btnFontMinus: he ? "הקטן גופן" : "Decrease font size",
    btnAlign: he ? "יישור טקסט" : "Text alignment",
    btnFg: he ? "צבע טקסט לנבחר" : "Text color — selected text",
    btnBg: he ? "צבע הדגשה לנבחר" : "Highlight color — selected text",
    btnSelectAll: he ? "בחר את כל הטקסט" : "Select all text",
    btnBlockSpeed: he ? "מהירות פסקה" : "Paragraph speed",
    btnZoomIn: he ? "הגדל תצוגה (לא שומר)" : "Zoom in (view only)",
    btnZoomOut: he ? "הקטן תצוגה (לא שומר)" : "Zoom out (view only)",
    btnStop: he ? "עצור" : "Stop",
    btnEdit: he ? "ערוך" : "Edit",
    btnBack: he ? "-10 שניות" : "-10s",
    btnFwd: he ? "+10 שניות" : "+10s",
    btnRec: he ? "הקלט" : "Record",
    btnHide: he ? "הסתר ממשק" : "Hide controls",
    btnPlay: he ? "הפעל / השהה" : "Play / Pause",
  };
  for (const [id, tip] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) {
      el.title = tip;
      el.setAttribute("aria-label", tip);
    }
  }
  document.querySelectorAll("[data-cmd]").forEach((b) => {
    const c = b.dataset.cmd;
    const tip = c === "bold" ? (he ? "מודגש" : "Bold") : he ? "קו תחתון" : "Underline";
    b.title = tip;
    b.setAttribute("aria-label", tip);
  });
  document.querySelectorAll("[data-align]").forEach((b) => {
    const a = b.dataset.align;
    const tip = he
      ? `יישור ${a === "center" ? "מרכז" : a === "start" ? "התחלה" : "סוף"}`
      : `Align ${a}`;
    b.title = tip;
    b.setAttribute("aria-label", tip);
  });
}

// anchored non-modal text popup near #btnText
const dlgText = $("dlgText");
function positionDlgText() {
  const btn = $("btnText");
  if (!btn || !dlgText.open) return;
  const r = btn.getBoundingClientRect();
  const rtl = document.documentElement.dir === "rtl";
  const w = Math.min(420, innerWidth - 16);
  let left = rtl ? r.right - w : r.left;
  left = Math.max(8, Math.min(innerWidth - w - 8, left));
  dlgText.style.left = left + "px";
  dlgText.style.top = r.bottom + 8 + "px";
  dlgText.style.right = "auto";
}
function openDlgText() {
  if (dlgText.open) {
    dlgText.close();
    return;
  }
  dlgText.show();
  positionDlgText();
}
$("btnText").onclick = openDlgText;
$("btnMenu").onclick = () => $("dlgMenu").showModal();
const via = (id, f) =>
  ($(id).onclick = () => {
    $("dlgMenu").close();
    f();
  });
via("mCam", () => toggleCam(!cam.on));
via("mSet", () => $("dlgSettings").showModal());
via("mRot", async () => {
  try {
    if (!document.fullscreenElement)
      await document.documentElement.requestFullscreen();
    await screen.orientation.lock(
      screen.orientation.type.startsWith("landscape")
        ? "portrait"
        : "landscape",
    );
  } catch {}
});
via("mPip", async () => {
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
});
$("btnScripts").onclick = () => {
  list.render();
  $("dlgScripts").showModal();
};
$("btnSettings").onclick = () => $("dlgSettings").showModal();
// click outside anchored dlgText closes it (it has transparent backdrop via non-modal show())
document.addEventListener("pointerdown", (e) => {
  if (
    dlgText.open &&
    !e.target.closest("#dlgText,#btnText,#colorPop,#speedPop")
  )
    dlgText.close();
});
addEventListener("resize", () => {
  document.documentElement.style.setProperty(
    "--pt",
    Math.round(vp.clientHeight * 0.4) + "px",
  );
  positionDlgText();
});
$("cam").ondblclick = async () => {
  if (cam.on) {
    store.set({
      facing: store.get().facing === "user" ? "environment" : "user",
    });
    await toggleCam(true);
  }
};
$("btnRec").onclick = async () => {
  if (cam.recording) {
    const { blob, ext } = await cam.stopRec();
    updateLabels();
    const u = URL.createObjectURL(blob);
    $("recVideo").src = u;
    $("recDl").href = u;
    $("recDl").download = `teleprompter-${Date.now()}.${ext}`;
    $("dlgRec").showModal();
    return;
  }
  if (!cam.on) await toggleCam(true);
  if (!cam.on) return;
  try {
    cam.startRec();
    updateLabels();
    if (!prompter.running) play();
  } catch {
    alert(t("noCam"));
  }
};
$("dlgRec").addEventListener("close", () => $("recVideo").pause());
document.addEventListener("keydown", (e) => {
  if (e.target.closest?.("input,select,[contenteditable=true]")) return;
  if (e.code === "Space") {
    e.preventDefault();
    play();
  }
  if (e.key === "Escape") stop();
  if (e.key === "ArrowUp")
    store.set({ speed: Math.min(100, store.get().speed + 5) });
  if (e.key === "ArrowDown")
    store.set({ speed: Math.max(1, store.get().speed - 5) });
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
const cur =
  scripts.find((x) => x.id === first.current) ||
  scripts.find(
    (x) => /[\u0590-\u05ff]/.test(x.title) === (first.lang === "he"),
  ) ||
  scripts[0];
store.set({ current: cur.id });
editor.load(cur);
setMode("edit");
list.render();
if ("serviceWorker" in navigator)
  addEventListener("load", () =>
    navigator.serviceWorker.register("sw.js").catch(() => {}),
  );
