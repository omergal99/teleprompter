import { t } from "../i18n.js";

// Camera + video recording UI. Camera engine and prompter are injected so this
// module never imports app.js (keeps the dependency graph one-directional).
export function createMedia({ $, store, cam, prompter, applyStyle, transport }) {
  const toggleCam = async (on) => {
    try {
      on ? await cam.start(store.get().facing) : cam.stop();
      document.body.classList.toggle("cam-on", on);
      applyStyle(store.get());
    } catch {
      alert(t("noCam"));
    }
  };

  $("cam").ondblclick = async () => {
    if (cam.on) {
      store.set({
        facing: store.get().facing === "user" ? "environment" : "user",
      });
      await toggleCam(true);
    }
  };

  // record toggle shared by footer + More-menu entries
  const toggleRec = async () => {
    if (cam.recording) {
      const { blob, ext } = await cam.stopRec();
      transport.updateLabels();
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
      transport.updateLabels();
      if (!prompter.running) transport.play();
    } catch {
      alert(t("noCam"));
    }
  };
  // NOTE: #mRec is wired in dialogs.js via onRecord so the
  // More menu closes first, then recording starts.
  $("dlgRec").addEventListener("close", () => $("recVideo").pause());

  return { toggleCam, toggleRec };
}
