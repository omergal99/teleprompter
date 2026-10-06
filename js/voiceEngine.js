const C = {
  start: ["start", "go", "התחל", "תתחיל", "הפעל"],
  stop: ["stop", "עצור", "תעצור"],
  pause: ["pause", "השהה", "תשהה"],
};
export class Voice {
  constructor(onCmd) {
    this.onCmd = onCmd;
    this.active = false;
  }
  static supported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  start(lang) {
    if (!Voice.supported()) return false;
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.active = true;
    const r = (this.r = new R());
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang === "he" ? "he-IL" : "en-US";
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1],
        tx = res[0].transcript.toLowerCase();
      for (const [cmd, words] of Object.entries(C))
        if (words.some((w) => tx.includes(w))) {
          if (res.isFinal || tx.split(" ").length < 3) {
            this.onCmd(cmd);
            r.stop();
          }
          break;
        }
    };
    r.onend = () => {
      if (this.active)
        try {
          r.start();
        } catch {}
    };
    r.onerror = () => {};
    try {
      r.start();
    } catch {}
    return true;
  }
  stop() {
    this.active = false;
    try {
      this.r?.stop();
    } catch {}
  }
}
