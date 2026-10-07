// Fullscreen helpers — works in desktop & phone browsers (with webkit fallback
// for iOS/older Safari where the standard API is missing).
export const fsActive = () =>
  !!(document.fullscreenElement || document.webkitFullscreenElement);

export const fsSupported = () =>
  !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen
  );

export async function toggleFullscreen() {
  const el = document.documentElement;
  try {
    if (fsActive()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else document.webkitExitFullscreen?.call(document);
    } else if (el.requestFullscreen) {
      // navigationUI:"hide" keeps the phone URL bar out of the way when supported
      await el.requestFullscreen({ navigationUI: "hide" }).catch(
        () => el.requestFullscreen(),
      );
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else return false;
  } catch {}
  return fsActive();
}

// Rotate = make sure we are fullscreen first, then flip orientation (Android).
// iOS Safari cannot lock orientation — it silently stays put.
export async function rotateScreen() {
  try {
    if (!fsActive()) await toggleFullscreen();
    const o = screen.orientation;
    if (o?.lock)
      await o.lock(o.type.startsWith("landscape") ? "portrait" : "landscape");
  } catch {}
}
