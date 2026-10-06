export const defaults = {
  speed: 40,
  fontSize: 56,
  lineHeight: 1.6,
  letterSpacing: 0,
  width: 80,
  font: "sans",
  align: "center",
  theme: "dark",
  bgColor: "#000000",
  fgColor: "#ffffff",
  direction: "up",
  countdown: 3,
  countdownOn: true,
  resumeDelay: 2,
  overlay: 100,
  mirrorH: false,
  mirrorV: false,
  guide: true,
  voice: false,
  lang: "he",
  facing: "user",
  current: null,
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
