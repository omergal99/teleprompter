import { announceChange } from "../ui/feedback.js";

export function bindSettings(store) {
  document.querySelectorAll("[data-s]").forEach((el) => {
    const k = el.dataset.s,
      o = el.parentElement.querySelector("output"),
      sync = () => {
        const v = store.get()[k];
        el.type === "checkbox" ? (el.checked = !!v) : (el.value = v);
        if (o) o.textContent = v;
      };
    sync();
    store.subscribe((_, p) => k in p && sync());
    el.addEventListener("input", () => {
      const oldV = store.get()[k];
      let v =
        el.type === "checkbox"
          ? el.checked
          : el.type === "range" ||
              el.hasAttribute("data-num") ||
              k === "countdown"
            ? Number(el.value)
            : el.value;
      if (k === "countdown") {
        v = Math.max(0, Math.min(60, Math.round(Number(v) || 0)));
        el.value = v;
        // keep select+number in sync; allow custom value for select
        document
          .querySelectorAll('[data-s="countdown"]')
          .forEach((other) => {
            if (other !== el) {
              if (other.tagName === "SELECT") {
                if (![...other.options].some((o) => Number(o.value) === v)) {
                  const o = document.createElement("option");
                  o.value = String(v);
                  o.textContent = v + "s";
                  other.appendChild(o);
                }
                other.value = String(v);
              } else other.value = v;
            }
          });
        // if this is the select and value is custom-typed via number, ensure option exists
        if (el.tagName === "SELECT" && ![...el.options].some((o) => Number(o.value) === v)) {
          const o = document.createElement("option");
          o.value = String(v);
          o.textContent = v + "s";
          el.appendChild(o);
          el.value = String(v);
        }
      }
      store.set({ [k]: v });
      announceChange(el, k, oldV, v);
    });
  });
  document
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = () => b.closest("dialog").close()));
  // click outside modal sheet closes it (but dock dlgText handled separately to stay anchored)
  document.querySelectorAll("dialog.sheet:not(.dock)").forEach((d) => {
    d.addEventListener("click", (e) => {
      const r = d.getBoundingClientRect();
      const outside =
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom;
      if (outside) d.close();
    });
  });
}
