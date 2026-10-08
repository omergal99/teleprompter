import { sanitize } from "../storage.js";

const PALETTE = [
  "#ffffff", "#000000", "#ffd400", "#ff3b30",
  "#ff9500", "#ffcc00", "#34c759", "#00c7be",
  "#32ade6", "#0a84ff", "#6c8cff", "#bf5af2",
  "#ff375f", "#ac8e68", "#8e8e93", "#c7c7cc",
  "#fff3b0", "#ffe08a", "#ffb340", "#ff7a1a",
  "#ff5c5c", "#ff9f0a", "#ffd60a", "#e6f400",
  "#7ddf64", "#30d158", "#64d2ff", "#0a84ff",
  "#5e5ce6", "#bf5af2", "#ff6482", "#f5f5f7",
  "#1c1c1e", "#2c2c2e", "#48484a", "#636366",
  "#30b0c7", "#66d4cf", "#ffd60a", "#ff453a",
];

export function mountEditor({ text, titleInput, onChange, getStore, setStore }) {
  let t = 0;
  const fire = () => {
    clearTimeout(t);
    t = setTimeout(() => onChange(text.innerHTML, titleInput.value), 300);
  };
  text.addEventListener("input", fire);
  titleInput.addEventListener("input", fire);
  text.addEventListener("paste", (e) => {
    e.preventDefault();
    const h = e.clipboardData.getData("text/html"),
      p = e.clipboardData.getData("text/plain");
    document.execCommand(
      "insertHTML",
      false,
      h
        ? sanitize(h)
        : p
            .replace(/[&<]/g, (c) => (c === "&" ? "&amp;" : "&lt;"))
            .replace(/\n/g, "<br>"),
    );
  });
  document.querySelectorAll("[data-cmd]").forEach((b) => {
    b.onmousedown = (e) => e.preventDefault();
    b.onclick = () => {
      document.execCommand(b.dataset.cmd);
      fire();
    };
  });
  const hl = document.getElementById("hlColor");
  const colorPop = document.getElementById("colorPop");
  const swatches = document.getElementById("colorSwatches");
  const btnFg = document.getElementById("btnFg");
  const btnBg = document.getElementById("btnBg");
  const fgDot = document.getElementById("fgDot");
  const bgDot = document.getElementById("bgDot");
  let colorMode = "foreColor";
  let lastFg = hl?.value || "#ffd400";
  let lastBg = "#fff3b0";

  const paintDots = () => {
    if (fgDot) fgDot.style.background = lastFg;
    if (bgDot) bgDot.style.background = lastBg;
  };
  paintDots();

  const applyColor = (color, mode = colorMode) => {
    text.focus();
    if (mode === "hilite") {
      document.execCommand("hiliteColor", false, color);
      // fallback for browsers mapping hilite->backColor
      try { document.execCommand("backColor", false, color); } catch {}
      lastBg = color;
    } else {
      document.execCommand("foreColor", false, color);
      lastFg = color;
    }
    paintDots();
    fire();
  };

  if (swatches && !swatches.children.length) {
    PALETTE.slice(0, 40).forEach((c) => {
      const b = document.createElement("button");
      b.style.background = c;
      b.title = c;
      b.setAttribute("aria-label", c);
      b.onclick = () => {
        applyColor(c);
      };
      swatches.appendChild(b);
    });
  }
  const toggleColorPop = (mode) => {
    if (!colorPop) return;
    if (colorMode === mode && !colorPop.hidden) {
      colorPop.hidden = true;
      return;
    }
    colorMode = mode;
    const sp = document.getElementById("speedPop");
    if (sp) sp.hidden = true;
    const fp = document.getElementById("formatPop");
    if (fp) fp.hidden = true;
    colorPop.hidden = false;
    if (hl) hl.value = mode === "hilite" ? lastBg : lastFg;
  };
  if (btnFg) btnFg.onclick = () => toggleColorPop("foreColor");
  if (btnBg) btnBg.onclick = () => toggleColorPop("hilite");
  if (hl) hl.oninput = () => applyColor(hl.value);

  // ---- single "Text formatting" popover on the edit bar ----
  const fmtPop = document.getElementById("formatPop");
  const btnFmt = document.getElementById("btnFormat");
  if (btnFmt && fmtPop) {
    btnFmt.onmousedown = (e) => e.preventDefault();
    btnFmt.onclick = () => {
      if (colorPop) colorPop.hidden = true;
      const sp = document.getElementById("speedPop");
      if (sp) sp.hidden = true;
      fmtPop.hidden = !fmtPop.hidden;
    };
  }

  // quick text tools moved into editbar (kept in dlgText for full settings too)
  const ALIGN_ICON = { center: "#i-align-center", start: "#i-align-start", end: "#i-align-end" };
  const syncAlignSeg = () => {
    const cur = getStore?.().align || "center";
    document.querySelectorAll("[data-align]").forEach((b) =>
      b.classList.toggle("on", b.dataset.align === cur),
    );
    const ba = document.getElementById("btnAlign");
    ba?.querySelector("use")?.setAttribute("href", ALIGN_ICON[cur] || ALIGN_ICON.center);
  };
  syncAlignSeg();
  document.querySelectorAll("[data-align]").forEach((b) => {
    b.onmousedown = (e) => e.preventDefault();
    b.onclick = () => {
      setStore?.({ align: b.dataset.align });
      syncAlignSeg();
    };
  });
  const stepFont = (d) => {
    const cur = getStore?.().fontSize ?? 56;
    setStore?.({ fontSize: Math.min(140, Math.max(20, cur + d)) });
  };
  const fp = document.getElementById("btnFontPlus");
  const fm = document.getElementById("btnFontMinus");
  if (fp) fp.onclick = () => stepFont(2);
  if (fm) fm.onclick = () => stepFont(-2);
  const ba = document.getElementById("btnAlign");
  if (ba) ba.onclick = () => {
    const order = ["center", "start", "end"];
    const cur = getStore?.().align || "center";
    const nxt = order[(order.indexOf(cur) + 1) % order.length];
    setStore?.({ align: nxt });
    syncAlignSeg();
  };
  const selAll = document.getElementById("btnSelectAll");
  if (selAll) selAll.onclick = () => {
    text.focus();
    const r = document.createRange();
    r.selectNodeContents(text);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  };
  // view zoom (display only, does not change saved font size)
  const zl = document.getElementById("zoomLabel");
  const syncZoom = () => {
    if (zl) zl.textContent = Math.round((getStore?.().viewZoom ?? 1) * 100) + "%";
  };
  syncZoom();
  const zi = document.getElementById("btnZoomIn");
  const zo = document.getElementById("btnZoomOut");
  if (zi) zi.onclick = () => {
    const z = Math.min(2.5, (getStore?.().viewZoom ?? 1) + 0.1);
    setStore?.({ viewZoom: Math.round(z * 100) / 100 });
    syncZoom();
  };
  if (zo) zo.onclick = () => {
    const z = Math.max(0.5, (getStore?.().viewZoom ?? 1) - 0.1);
    setStore?.({ viewZoom: Math.round(z * 100) / 100 });
    syncZoom();
  };

  const pop = document.getElementById("speedPop");
  let blk = null;
  document.getElementById("btnBlockSpeed").onclick = () => {
    const sel = getSelection();
    let n = sel.anchorNode;
    if (!n || !text.contains(n)) return;
    while (n && n.parentElement !== text) n = n.parentElement;
    if (!n || n.nodeType !== 1) return;
    blk = n;
    if (colorPop) colorPop.hidden = true;
    pop.hidden = !pop.hidden;
  };
  pop.onclick = (e) => {
    const v = parseFloat(e.target.dataset.v);
    if (!v || !blk) return;
    v === 1 ? delete blk.dataset.speed : (blk.dataset.speed = v);
    pop.hidden = true;
    fire();
  };
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("#speedPop,#btnBlockSpeed") && pop) pop.hidden = true;
    if (!e.target.closest("#colorPop,#btnFg,#btnBg")) {
      if (colorPop) colorPop.hidden = true;
    }
    if (!e.target.closest("#formatPop,#btnFormat") && fmtPop) fmtPop.hidden = true;
  });
  return {
    load(s) {
      text.innerHTML = s.html;
      titleInput.value = s.title;
    },
    setEditable(b) {
      text.contentEditable = b;
    },
    syncAlign: syncAlignSeg,
    syncZoom,
  };
}
