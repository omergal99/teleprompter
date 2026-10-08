export const defaults = {
  speed: 40,
  fontSize: 56,
  lineHeight: 1.6,
  letterSpacing: 0,
  width: 100,
  font: "sans",
  align: "center",
  theme: "dark",
  direction: "up",
  countdown: 0,
  countdownOn: false,
  resumeDelay: 2,
  overlay: 100,
  mirrorH: false,
  mirrorV: false,
  guide: false,
  guideY: 40,
  voice: false,
  lang: "he",
  facing: "user",
  current: null,
  viewZoom: 1,
  sv: 3,
};
export function createStore(init) {
  let s = { ...init };
  const subs = new Set();
  return {
    get: () => s,
    set(p) {
      s = { ...s, ...p };
      subs.forEach((f) => f(s, p));
    },
    subscribe(f) {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}
