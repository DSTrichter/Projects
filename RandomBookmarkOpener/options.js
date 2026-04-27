const DEFAULTS = {
  includeKeywords: [],
  includeTags: [],
  includeFolders: [],
  excludeKeywords: [],
  excludeTags: [],
  excludeFolders: [],
  openInNewTab: true,
  matchMode: "any"
};

const LIST_FIELDS = [
  "includeKeywords",
  "includeTags",
  "includeFolders",
  "excludeKeywords",
  "excludeTags",
  "excludeFolders"
];

function parseList(value) {
  return value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function formatList(list) {
  return (list || []).join(", ");
}

async function load() {
  const stored = await browser.storage.local.get("settings");
  const settings = { ...DEFAULTS, ...(stored.settings || {}) };

  for (const field of LIST_FIELDS) {
    document.getElementById(field).value = formatList(settings[field]);
  }
  document.getElementById("openInNewTab").checked = !!settings.openInNewTab;
  const mode = settings.matchMode === "all" ? "all" : "any";
  const radio = document.querySelector(`input[name="matchMode"][value="${mode}"]`);
  if (radio) radio.checked = true;
}

async function save() {
  const settings = { ...DEFAULTS };
  for (const field of LIST_FIELDS) {
    settings[field] = parseList(document.getElementById(field).value);
  }
  settings.openInNewTab = document.getElementById("openInNewTab").checked;
  const checked = document.querySelector('input[name="matchMode"]:checked');
  settings.matchMode = checked ? checked.value : "any";

  await browser.storage.local.set({ settings });
  flashStatus("Saved.");
}

async function resetDefaults() {
  await browser.storage.local.set({ settings: { ...DEFAULTS } });
  await load();
  flashStatus("Reset to defaults.");
}

function flashStatus(message) {
  const el = document.getElementById("status");
  el.textContent = message;
  clearTimeout(flashStatus._t);
  flashStatus._t = setTimeout(() => { el.textContent = ""; }, 2000);
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("reset").addEventListener("click", resetDefaults);
document.addEventListener("DOMContentLoaded", load);
