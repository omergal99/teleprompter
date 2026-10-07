// "What actually changed" feedback: when a setting is edited, the row flashes
// and shows  old → new  inline, so it's obvious even when a phone dialog is
// only partially covering the screen.
let toastEl = null,
  toastTimer = 0;

function ensureToast() {
  if (toastEl) return toastEl;
  toastEl = document.createElement("div");
  toastEl.id = "chgToast";
  toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);
  return toastEl;
}

const fmt = (k, v) => {
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (k === "theme") return { dark: "Dark", light: "Light", custom: "Custom" }[v] ?? v;
  if (k === "font")
    return { sans: "Sans", serif: "Serif", mono: "Mono", dyslexic: "Dyslexic" }[v] ?? v;
  if (k === "align")
    return { center: "Center", start: "Start", end: "End" }[v] ?? v;
  if (k === "direction") return v === "down" ? "⬇" : "⬆";
  if (k === "lang") return v === "he" ? "עברית" : "English";
  if (typeof v === "number" && !Number.isInteger(v)) return v.toFixed(1);
  return String(v);
};

const LABEL = {}; // data-i18n key -> localized label, filled lazily
function labelFor(el, key) {
  if (!LABEL[key]) {
    const span = document.querySelector(`.fld > [data-i18n="${key}"]`);
    LABEL[key] = span?.textContent || key;
  }
  return LABEL[key];
}

export function announceChange(el, key, oldV, newV) {
  if (String(oldV) === String(newV)) return;
  const row = el.closest(".fld") || el.closest("label") || el.parentElement;
  // inline badge right on the changed row
  if (row) {
    row.classList.remove("chg");
    void row.offsetWidth; // restart animation
    row.classList.add("chg");
    let badge = row.querySelector(".chg-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "chg-badge";
      row.appendChild(badge);
    }
    badge.innerHTML = "";
    const a = document.createElement("s");
    a.textContent = fmt(key, oldV);
    const arrow = document.createElement("i");
    arrow.textContent = " → ";
    const b = document.createElement("b");
    b.textContent = fmt(key, newV);
    badge.append(a, arrow, b);
    clearTimeout(row._chgT);
    row._chgT = setTimeout(() => {
      row.classList.remove("chg");
      badge.remove();
    }, 4000);
  }
  // top toast summarises the change (visible even over the sheet header)
  const el2 = ensureToast();
  el2.innerHTML = "";
  const name = document.createElement("span");
  name.textContent = labelFor(el, key);
  const a2 = document.createElement("s");
  a2.textContent = fmt(key, oldV);
  const arrow2 = document.createElement("i");
  arrow2.textContent = " → ";
  const b2 = document.createElement("b");
  b2.textContent = fmt(key, newV);
  el2.append(name, a2, arrow2, b2);
  el2.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el2.classList.remove("show"), 2500);
}
