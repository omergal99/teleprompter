export class Prompter {
  constructor(vp, text, get, { onTick, onEnd, onChange } = {}) {
    Object.assign(this, {
      vp,
      text,
      get,
      onTick,
      onEnd,
      onChange, // fires on every running-state change -> keeps play icon in sync
      running: false,
      pos: 0,
      elapsed: 0,
      userPaused: false,
      timer: 0,
      holdTimer: 0,
      hx: 0,
      hy: 0,
    });
    // Manual scrolling (wheel / touch / scrollbar / keyboard) only *moves* the
    // text — it never stops playback. The loop adopts the new position and
    // keeps going: UX goal = "moving the text while running doesn't halt it".
    vp.addEventListener(
      "scroll",
      () => {
        if (this.running) this.pos = vp.scrollTop;
      },
      { passive: true },
    );
    // Press-and-hold (finger/mouse stays still ~250ms) is the deliberate
    // "hold to pause" gesture; releasing resumes after resumeDelay seconds.
    const hold = (x, y) => {
      this.hx = x;
      this.hy = y;
      clearTimeout(this.holdTimer);
      if (!this.running) return;
      this.holdTimer = setTimeout(() => {
        if (this.running) this.interrupt();
      }, 250);
    };
    const moved = (x, y) => {
      // moving = scrolling/dragging, not holding -> never pause
      if (Math.abs(x - this.hx) + Math.abs(y - this.hy) > 10)
        clearTimeout(this.holdTimer);
    };
    vp.addEventListener("touchstart", (e) => hold(e.touches[0].clientX, e.touches[0].clientY), {
      passive: true,
    });
    vp.addEventListener("touchmove", (e) => moved(e.touches[0].clientX, e.touches[0].clientY), {
      passive: true,
    });
    vp.addEventListener("touchend", () => this.release());
    vp.addEventListener("touchcancel", () => this.release());
    vp.addEventListener("mousedown", (e) => hold(e.clientX, e.clientY));
    vp.addEventListener("mousemove", (e) => moved(e.clientX, e.clientY));
    window.addEventListener("mouseup", () => this.release());
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
    clearTimeout(this.timer);
    clearTimeout(this.holdTimer);
    const s = this.get();
    if (s.direction === "down" && this.vp.scrollTop <= 0)
      this.vp.scrollTop = this.max();
    this.pos = this.vp.scrollTop;
    this.running = true;
    this.userPaused = false;
    this.last = performance.now();
    this.onChange?.();
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
      this.onChange?.();
      this.onEnd?.();
      return;
    }
    requestAnimationFrame(this.loop);
  };
  pause() {
    this.running = false;
    this.userPaused = false;
    clearTimeout(this.timer);
    clearTimeout(this.holdTimer);
    this.onChange?.();
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
  // hold-to-pause: stop the scroll while the finger stays down
  interrupt() {
    clearTimeout(this.timer);
    clearTimeout(this.holdTimer);
    if (this.running) {
      this.running = false;
      this.userPaused = true;
      this.onChange?.();
    }
  }
  // release resumes automatically after resumeDelay (unless explicitly paused)
  release() {
    clearTimeout(this.holdTimer);
    if (!this.userPaused) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.userPaused) this.start();
    }, this.get().resumeDelay * 1000);
  }
}
