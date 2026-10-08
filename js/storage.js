const S = "tp.settings",
  L = "tp.scripts",
  SV = 3; // settings schema version
const j = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
export const loadSettings = () => {
  const s = j(S, {});
  // v3: countdown OFF by default. Fresh installs have no sv; legacy (sv<3)
  // that never touched countdown explicitly fall back to OFF too.
  if ((s.sv ?? 0) < SV) {
    if (s.width === undefined || s.width === 80) s.width = 100;
    if (s.sv === undefined && s.countdown === undefined) {
      s.countdown = 0;
      s.countdownOn = false;
    }
    if (s.sv === 2 && (s.countdown === 3 || s.countdownOn === true)) {
      // v2 auto-migrated 0->3 / may carry countdownOn=true from old defaults;
      // treat untouched installs as OFF unless user explicitly enabled.
      if (!("countdownOn" in s) || s.countdown === 3) {
        s.countdown = 0;
        s.countdownOn = false;
      }
    }
    s.sv = SV;
  }
  return s;
};
export const saveSettings = (s) => {
  try {
    localStorage.setItem(S, JSON.stringify(s));
  } catch {}
};
const esc = (s) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
export const textToHtml = (t) =>
  t
    .split(/\n/)
    .map((l) => `<div>${esc(l) || "<br>"}</div>`)
    .join("");
const OK = new Set([
  "B",
  "U",
  "I",
  "STRONG",
  "EM",
  "SPAN",
  "DIV",
  "P",
  "BR",
  "FONT",
]);
export function sanitize(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  (function walk(n) {
    [...n.children].forEach((c) => {
      if (!OK.has(c.tagName)) {
        c.replaceWith(...c.childNodes);
        return;
      }
      [...c.attributes].forEach((a) => {
        if (!(
          a.name === "color" ||
          (a.name === "style" && /^[\w\s:;#(),.%-]*$/.test(a.value)) ||
          (a.name === "data-speed" && !isNaN(a.value))
        ))
          c.removeAttribute(a.name);
      });
    });
    [...n.children].forEach(walk);
  })(tpl.content);
  return tpl.innerHTML;
}
const uid = () => Math.random().toString(36).slice(2, 10);
export const samples = () => [
  {
    id: uid(),
    title: "שלום וברוכים הבאים",
    updated: Date.now(),
    html: textToHtml(
      'שלום וברוכים הבאים לטלפרומפטר.\nזהו סקריפט לדוגמה. לחצו על "הפעל" כדי להתחיל לגלול.\nאפשר לשנות מהירות, גודל גופן, צבעים ולהפעיל מצלמה והקלטה.\nבהצלחה!',
    ),
  },
  {
    id: uid(),
    title: "Welcome sample",
    updated: Date.now(),
    html: textToHtml(
      "Welcome to your teleprompter.\nThis is a sample script. Press Start to begin scrolling.\nAdjust speed, font size and colors, or turn on the camera and record.\nGood luck!",
    ),
  },
];
export function loadScripts() {
  let a = j(L, null);
  if (!a || !a.length) {
    // never wipe user data: if backup exists restore it, else seed samples
    const bak = j(L + ".bak", null);
    if (bak && bak.length) {
      a = bak;
      try {
        localStorage.setItem(L, JSON.stringify(a));
      } catch {}
    } else {
      a = samples();
      saveScripts(a);
    }
  }
  return a;
}
export function saveScripts(a) {
  try {
    localStorage.setItem(L, JSON.stringify(a));
    // keep a backup copy so a bad write / quota error never loses history
    try {
      localStorage.setItem(L + ".bak", JSON.stringify(a));
    } catch {}
  } catch {
    alert("Storage full / האחסון מלא");
  }
}
export const newScript = (title, html = "<div><br></div>") => ({
  id: uid(),
  title,
  html,
  updated: Date.now(),
});
export const stats = (html) => {
  const d = document.createElement("div");
  d.innerHTML = html;
  const w = (d.innerText || d.textContent)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return { words: w, min: Math.max(1, Math.round(w / 130)) };
};
export function download(name, data, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
