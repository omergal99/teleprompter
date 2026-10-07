import { t } from "../i18n.js";
import * as St from "../storage.js";
export function mountScriptList({
  dlg,
  list,
  getAll,
  setAll,
  getCurrent,
  open,
}) {
  let pendingDel = null;
  const render = () => {
    list.innerHTML = "";
    const all = getAll();
    if (!all.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.innerHTML = `<b>${t("noScripts")}</b><div class="row"><button data-a="new">${t("new")}</button></div>`;
      li.querySelector("[data-a=new]").onclick = () =>
        document.getElementById("newScript").click();
      list.append(li);
      return;
    }
    for (const s of all) {
      const { words, min } = St.stats(s.html),
        li = document.createElement("li");
      if (s.id === getCurrent()) li.className = "active";
      li.innerHTML = `<b></b><small>${words} ${t("words")} · ~${min} ${t("min")}</small><div class="row"><button data-a="open">${t("open")}</button><button data-a="ren">${t("rename")}</button><button data-a="dup">${t("dup")}</button><button data-a="exp">.json</button><button data-a="del">${t("del")}</button></div>`;
      li.querySelector("b").textContent = s.title || t("untitled");
      li.onclick = (e) => {
        const a = e.target.dataset.a;
        if (!a) return;
        const all = getAll();
        if (a === "open") {
          open(s.id);
          dlg.close();
        }
        if (a === "ren") {
          // inline rename, no browser prompt()
          const b = li.querySelector("b");
          const inp = document.createElement("input");
          inp.value = s.title || "";
          inp.className = "rename-inp";
          b.replaceWith(inp);
          inp.focus();
          inp.select();
          let done = false;
          const commit = (save) => {
            if (done) return;
            done = true;
            if (save && inp.value.trim()) {
              s.title = inp.value.trim();
              setAll(all);
              if (s.id === getCurrent()) open(s.id);
            }
            render();
          };
          inp.onkeydown = (ev) => {
            if (ev.key === "Enter") commit(true);
            if (ev.key === "Escape") commit(false);
          };
          inp.onblur = () => commit(true);
        }
        if (a === "dup") {
          all.push({
            ...s,
            id: St.newScript("").id,
            title: s.title + " (2)",
            updated: Date.now(),
          });
          setAll(all);
        }
        if (a === "exp")
          St.download(
            (s.title || "script") + ".json",
            JSON.stringify(s),
            "application/json",
          );
        // no browser confirm(): first click arms, second click deletes
        if (a === "del") {
          if (pendingDel !== s.id) {
            pendingDel = s.id;
            e.target.textContent = `${t("del")} ✓?`;
            e.target.classList.add("danger");
            setTimeout(() => {
              if (pendingDel === s.id) {
                pendingDel = null;
                render();
              }
            }, 3000);
            return;
          }
          pendingDel = null;
          const next = all.filter((x) => x.id !== s.id);
          setAll(next);
          // always keep at least one script so open() never gets undefined
          if (s.id === getCurrent()) {
            if (next.length) open(next[0].id);
            else {
              const fresh = St.newScript(t("untitled"));
              setAll([fresh]);
              open(fresh.id);
              dlg.close();
            }
          }
        }
        render();
      };
      list.append(li);
    }
  };
  document.getElementById("newScript").onclick = () => {
    const s = St.newScript(t("untitled"));
    setAll([...getAll(), s]);
    open(s.id);
    dlg.close();
  };
  document.getElementById("exportAll").onclick = () =>
    St.download("scripts.json", JSON.stringify(getAll()), "application/json");
  document.getElementById("importFile").onchange = async (e) => {
    for (const f of e.target.files) {
      const txt = await f.text();
      let items;
      if (f.name.endsWith(".json")) {
        try {
          const j = JSON.parse(txt);
          items = (Array.isArray(j) ? j : [j]).map((x) =>
            St.newScript(x.title || f.name, St.sanitize(x.html || "")),
          );
        } catch {
          continue;
        }
      } else
        items = [
          St.newScript(f.name.replace(/\.txt$/, ""), St.textToHtml(txt)),
        ];
      setAll([...getAll(), ...items]);
    }
    e.target.value = "";
    render();
  };
  return { render };
}
