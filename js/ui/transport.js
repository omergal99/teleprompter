import { t } from "../i18n.js";

// Transport = play/pause/stop/countdown + edit<->read mode + control labels.
// Everything that decides "is it running right now" lives here so the icon,
// the countdown and the engine can never drift apart (single source of truth).
export function createTransport({
  $,
  store,
  body,
  vp,
  text,
  cam,
  prompter,
  editor,
  renderEmptyState,
}) {
  let cdTimer = 0,
    cancelCd = () => {};

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
    // running = engine OR active countdown — one truth for the play icon
    const run = prompter.running || !!cdTimer;
    const use = $("playIcon")?.querySelector("use");
    if (use) use.setAttribute("href", run ? "#i-pause" : "#i-play");
    $("btnPlay")?.classList.toggle("is-playing", run);
    $("btnPlay")?.setAttribute("aria-label", run ? t("pause") : t("start"));
    // btnEdit stays visible in both modes: edit <-> read toggle
    const eb = $("btnEdit"),
      editing = body.classList.contains("mode-edit");
    eb?.classList.toggle("to-read", editing);
    if (eb) {
      const label = editing ? t("read") : t("edit");
      eb.title = label;
      eb.setAttribute("aria-label", label);
      eb.querySelector("use")?.setAttribute("href", editing ? "#i-book" : "#i-pencil");
    }
    $("btnRec")?.classList.toggle("on", cam.recording);
    const rb = $("recBadge");
    if (rb) rb.hidden = !cam.recording;
    renderEmptyState();
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
          updateLabels();
          res(true);
        } else el.textContent = n;
      }, 1000);
      cancelCd = () => {
        clearInterval(cdTimer);
        cdTimer = 0;
        el.style.display = "none";
        updateLabels();
        res(false);
      };
      updateLabels(); // NOW cdTimer is set -> icon correctly shows "pause"
    });
  }

  async function play() {
    if (cdTimer) {
      cancelCd();
      return;
    }
    if (prompter.running) {
      prompter.pause();
      updateLabels();
      return;
    }
    // capture "starts from the very top" BEFORE mode switch scrolls the viewport
    // (this was the countdown bug: scrollTop was ~40vh by the time we checked)
    const fresh = prompter.elapsed === 0 && vp.scrollTop < 5;
    if (body.classList.contains("mode-edit")) setMode("present");
    updateLabels();
    if (fresh && store.get().countdownOn && (await countdown(store.get().countdown)) === false)
      return;
    prompter.start();
    updateLabels();
  }

  const stop = () => {
    cancelCd();
    // stop always returns to the top so next play starts from the beginning
    prompter.reset();
    const cd = $("countdown");
    if (cd) cd.style.display = "none";
    const ck = $("clock");
    if (ck) ck.textContent = "00:00";
    setMode("edit");
    requestAnimationFrame(() => {
      vp.scrollTop = 0;
      prompter.pos = 0;
    });
    updateLabels();
  };

  // ---- wiring ----
  $("btnPlay").onclick = play;
  $("btnStop").onclick = stop;
  $("btnBack").onclick = () => prompter.seek(-10);
  $("btnFwd").onclick = () => prompter.seek(10);
  $("btnHide").onclick = () => body.classList.add("hide-ui");
  $("stage").addEventListener("click", () => body.classList.remove("hide-ui"));
  $("btnEdit").onclick = () => {
    // pure mode toggle: edit <-> read, whatever the playback state
    if (body.classList.contains("mode-edit")) {
      setMode("present");
    } else {
      prompter.pause();
      cancelCd();
      setMode("edit");
    }
    updateLabels();
  };

  return { play, stop, setMode, updateLabels, get counting() { return !!cdTimer; } };
}
