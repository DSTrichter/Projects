const DEFAULTS = {
  includeKeywords: [],
  includeTags: [],
  includeFolders: [],
  excludeKeywords: [],
  excludeTags: [],
  excludeFolders: [],
  includeKeywordsMode: "any",
  includeTagsMode: "all",
  includeFoldersMode: "any",
  excludeKeywordsMode: "any",
  excludeTagsMode: "any",
  excludeFoldersMode: "any",
  openInNewTab: true,
  skipPhrases: ["has been disabled"]
};

const LIST_FIELDS = [
  "includeKeywords",
  "includeTags",
  "includeFolders",
  "excludeKeywords",
  "excludeTags",
  "excludeFolders"
];

const MODE_FIELDS = LIST_FIELDS.map(f => `${f}Mode`);

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
  for (const field of MODE_FIELDS) {
    const el = document.getElementById(field);
    if (el) el.value = settings[field] === "all" ? "all" : "any";
  }
  document.getElementById("openInNewTab").checked = !!settings.openInNewTab;
  document.getElementById("skipPhrases").value = (settings.skipPhrases || []).join("\n");
}

async function save() {
  const settings = { ...DEFAULTS };
  for (const field of LIST_FIELDS) {
    settings[field] = parseList(document.getElementById(field).value);
  }
  for (const field of MODE_FIELDS) {
    const el = document.getElementById(field);
    settings[field] = el && el.value === "all" ? "all" : "any";
  }
  settings.openInNewTab = document.getElementById("openInNewTab").checked;
  settings.skipPhrases = document.getElementById("skipPhrases").value
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

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
