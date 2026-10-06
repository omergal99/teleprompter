export class Prompter {
  constructor(vp, text, get, { onTick, onEnd } = {}) {
    Object.assign(this, {
      vp,
      text,
      get,
      onTick,
      onEnd,
      running: false,
      pos: 0,
      elapsed: 0,
      userPaused: false,
      timer: 0,
    });
    const stop = () => this.interrupt(),
      rel = () => this.release();
    vp.addEventListener("touchstart", stop, { passive: true });
    vp.addEventListener("touchend", rel);
    vp.addEventListener("touchcancel", rel);
    vp.addEventListener("mousedown", stop);
    window.addEventListener("mouseup", rel);
    vp.addEventListener(
      "wheel",
      () => {
        this.interrupt();
        this.release();
      },
      { passive: true },
    );
  }
  pxPerSec(s) {
    return (s.speed * s.fontSize) / 60;
  }
  mult() {
    const y = this.pos + this.vp.clientHeight * 0.4;
    for (const b of this.text.children) {
      if (b.offsetTop <= y && y < b.offsetTop + b.offsetHeight)
        return parseFloat(b.dataset.speed) || 1;
    }
    return 1;
  }
  max() {
    return this.vp.scrollHeight - this.vp.clientHeight;
  }
  start() {
    if (this.running) return;
    const s = this.get();
    if (s.direction === "down" && this.vp.scrollTop <= 0)
      this.vp.scrollTop = this.max();
    this.pos = this.vp.scrollTop;
    this.running = true;
    this.userPaused = false;
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }
  loop = (ts) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (ts - this.last) / 1000);
    this.last = ts;
    const s = this.get(),
      dir = s.direction === "down" ? -1 : 1;
    this.pos = Math.max(
      0,
      Math.min(
        this.max(),
        this.pos + dir * this.pxPerSec(s) * this.mult() * dt,
      ),
    );
    this.vp.scrollTop = this.pos;
    this.elapsed += dt;
    this.onTick?.(this.elapsed);
    if ((dir > 0 && this.pos >= this.max() - 1) || (dir < 0 && this.pos <= 0)) {
      this.running = false;
      this.onEnd?.();
      return;
    }
    requestAnimationFrame(this.loop);
  };
  pause() {
    this.running = false;
    this.userPaused = false;
    clearTimeout(this.timer);
  }
  toggle() {
    this.running ? this.pause() : this.start();
  }
  seek(sec) {
    const s = this.get(),
      d = (s.direction === "down" ? -1 : 1) * sec * this.pxPerSec(s);
    this.pos = Math.max(0, Math.min(this.max(), this.vp.scrollTop + d));
    this.vp.scrollTop = this.pos;
  }
  reset() {
    this.pause();
    this.elapsed = 0;
    this.vp.scrollTop = 0;
    this.pos = 0;
  }
  interrupt() {
    clearTimeout(this.timer);
    if (this.running) {
      this.running = false;
      this.userPaused = true;
    }
  }
  release() {
    if (!this.userPaused) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.userPaused) this.start();
    }, this.get().resumeDelay * 1000);
  }
}
