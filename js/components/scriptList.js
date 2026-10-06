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
  const render = () => {
    list.innerHTML = "";
    for (const s of getAll()) {
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
          const n = prompt(t("newTitle"), s.title);
          if (n) {
            s.title = n;
            setAll(all);
            if (s.id === getCurrent()) open(s.id);
          }
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
        if (a === "del" && confirm(t("confirmDel"))) {
          setAll(all.filter((x) => x.id !== s.id));
          if (s.id === getCurrent()) open(getAll()[0]?.id);
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
