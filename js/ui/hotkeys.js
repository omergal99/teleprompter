import { t } from "../i18n.js";

// Global keyboard shortcuts. Receives actions instead of reaching into app.js.
export function initHotkeys({ $, store, play, stop, prompter }) {
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
    if (e.key === "ArrowLeft") prompter.seek(-10);
    if (e.key === "ArrowRight") prompter.seek(10);
  });
}
