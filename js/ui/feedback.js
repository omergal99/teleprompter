// "What actually changed" feedback: toast-only (no inline CH badge).
// Every setting change confirms old → new in the top toast so the
// edit bar and dialogs stay compact.
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
    return {
      sans: "Sans", arial: "Arial", verdana: "Verdana", tahoma: "Tahoma",
      times: "Times", serif: "Serif", mono: "Mono",
      courier: "Courier", dyslexic: "Dyslexic",
    }[v] ?? v;
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
    const span =
      document.querySelector(`.fld > [data-i18n="${key}"]`) ||
      document.querySelector(`[data-i18n="${key}"]`);
    LABEL[key] = span?.textContent || key;
  }
  return LABEL[key];
}

export function announceChange(el, key, oldV, newV) {
  if (String(oldV) === String(newV)) return;
  // Toast-only feedback (no inline CH badge anywhere): keeps edit bar
  // and dialogs compact while still confirming old → new up top.
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
