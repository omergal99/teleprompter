import { toggleFullscreen, rotateScreen } from "./fullscreen.js";

// All dialog open/close wiring lives here so app.js stays orchestration-only.
export function initDialogs({ $, store, cam, pip, list, applyStyle, onCamera, onRecord }) {
  // ---------- anchored non-modal text popup near #btnText ----------
  const dlgText = $("dlgText");
  function positionDlgText() {
    const btn = $("btnText");
    if (!btn || !dlgText.open) return;
    const r = btn.getBoundingClientRect();
    const w = Math.min(420, innerWidth - 16);
    const rtl = document.documentElement.dir === "rtl";
    let left = rtl ? r.right - w : r.left;
    left = Math.max(8, Math.min(innerWidth - w - 8, left));
    const h = dlgText.offsetHeight || 420;
    let top = r.bottom + 8;
    if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 8);
    dlgText.style.left = left + "px";
    dlgText.style.top = top + "px";
    dlgText.style.right = "auto";
    dlgText.style.maxHeight = Math.min(640, innerHeight - top - 8) + "px";
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

  // ---------- settings: on phones open NON-modal so the prompter stays
  // visible/interactive behind it (you can watch every change live) ----------
  const dlgSettings = $("dlgSettings");
  const isPhone = () => matchMedia("(max-width: 640px)").matches;
  function openSettings() {
    if (dlgSettings.open) return;
    if (isPhone()) {
      dlgSettings.classList.add("peek");
      dlgSettings.show(); // non-modal: background stays visible & usable
    } else {
      dlgSettings.classList.remove("peek");
      dlgSettings.showModal();
    }
  }
  const closeSettings = () => dlgSettings.open && dlgSettings.close();

  // ---------- menu ----------
  $("btnMenu").onclick = () => $("dlgMenu").showModal();
  const via = (id, f) =>
    ($(id).onclick = () => {
      $("dlgMenu").close();
      f();
    });
  via("mCam", () => onCamera(!cam.on));
  via("mSet", openSettings);
  via("mFs", () => toggleFullscreen());
  via("mRot", () => rotateScreen());
  via("mPip", () => pip.toggle());
  if ($("mRec")) $("mRec").onclick = () => { $("dlgMenu").close(); onRecord?.(); };
  // record entry lives in the More menu now (wired in record.js so the
  // recording indicator can toggle even with no footer button)
  // footer transport-bar fullscreen toggle (same action as menu)
  if ($("btnFs")) $("btnFs").onclick = () => toggleFullscreen();
  $("btnSettings").onclick = openSettings;
  $("btnScripts").onclick = () => {
    list.render();
    $("dlgScripts").showModal();
  };

  // ---------- outside-click dismissal for the non-modal dialogs ----------
  document.addEventListener("pointerdown", (e) => {
    if (
      dlgText.open &&
      !e.target.closest("#dlgText,#btnText,#colorPop,#speedPop,#formatPop")
    )
      dlgText.close();
    if (
      dlgSettings.classList.contains("peek") &&
      dlgSettings.open &&
      !e.target.closest("#dlgSettings,#btnSettings,#mSet")
    )
      closeSettings();
  });

  addEventListener("resize", () => {
    document.documentElement.style.setProperty(
      "--pt",
      Math.round(($("viewport")?.clientHeight || 0) * 0.4) + "px",
    );
    positionDlgText();
  });

  return { positionDlgText, openSettings };
}
