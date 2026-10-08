// Localized hover/aria titles for icon-only controls.
export function syncTooltips(lang) {
  const he = lang === "he";
  const map = {
    btnScripts: he ? "סקריפטים" : "Scripts",
    btnText: he ? "הגדרות טקסט" : "Text settings",
    btnFormat: he ? "עיצוב טקסט: גודל, מרווחים, רוחב" : "Text formatting: size, spacing, width",
    btnAlign: he ? "יישור טקסט" : "Text alignment",
    btnFs: he ? "מסך מלא" : "Fullscreen",
    btnSettings: he ? "הגדרות" : "Settings",
    btnMenu: he ? "עוד" : "More",
    btnFg: he ? "צבע טקסט — על הנבחר" : "Text color — selected text",
    btnBg: he ? "צבע הדגשה לנבחר" : "Highlight color — selected text",
    btnSelectAll: he ? "בחר את כל הטקסט" : "Select all text",
    btnBlockSpeed: he ? "מהירות פסקה" : "Paragraph speed",
    btnZoomIn: he ? "הגדל תצוגה (לא שומר)" : "Zoom in (view only)",
    btnZoomOut: he ? "הקטן תצוגה (לא שומר)" : "Zoom out (view only)",
    btnStop: he ? "עצור" : "Stop",
    btnEdit: he ? "ערוך / קריאה" : "Edit / Read",
    btnBack: he ? "10 שניות אחורה" : "Back 10 seconds",
    btnFwd: he ? "10 שניות קדימה" : "Forward 10 seconds",
    mRec: he ? "הקלט" : "Record",
    btnHide: he ? "הסתר ממשק" : "Hide controls",
    btnPlay: he ? "הפעל / השהה" : "Play / Pause",
  };
  for (const [id, tip] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) {
      el.title = tip;
      el.setAttribute("aria-label", tip);
    }
  }
  document.querySelectorAll("[data-cmd]").forEach((b) => {
    const c = b.dataset.cmd;
    const tip = c === "bold" ? (he ? "מודגש" : "Bold") : he ? "קו תחתון" : "Underline";
    b.title = tip;
    b.setAttribute("aria-label", tip);
  });
  document.querySelectorAll("[data-align]").forEach((b) => {
    const a = b.dataset.align;
    const tip = he
      ? `יישור ${a === "center" ? "מרכז" : a === "start" ? "התחלה" : "סוף"}`
      : `Align ${a}`;
    b.title = tip;
    b.setAttribute("aria-label", tip);
  });
}
