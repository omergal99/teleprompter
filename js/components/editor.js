import { sanitize } from "../storage.js";
export function mountEditor({ text, titleInput, onChange }) {
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
  hl.oninput = () => {
    text.focus();
    document.execCommand("foreColor", false, hl.value);
    fire();
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
    if (!e.target.closest("#speedPop,#btnBlockSpeed")) pop.hidden = true;
  });
  return {
    load(s) {
      text.innerHTML = s.html;
      titleInput.value = s.title;
    },
    setEditable(b) {
      text.contentEditable = b;
    },
  };
}
