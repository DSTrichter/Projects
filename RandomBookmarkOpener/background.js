const DEFAULT_SETTINGS = {
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
  openInNewTab: true
};

async function getSettings() {
  const stored = await browser.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

function extractTags(title) {
  if (!title) return [];
  const matches = title.match(/#[\p{L}\p{N}_-]+/gu) || [];
  return matches.map(t => t.slice(1).toLowerCase());
}

function normalizeList(list) {
  return (list || [])
    .map(s => String(s).trim().toLowerCase())
    .filter(Boolean);
}

function normalizeTagList(list) {
  return normalizeList(list).map(t => t.replace(/^#/, ""));
}

async function walkTree() {
  const tree = await browser.bookmarks.getTree();
  const bookmarks = [];
  const walk = (node, path) => {
    const here = node.title ? [...path, node.title] : path;
    if (node.url) {
      bookmarks.push({ node, folderPath: path });
    }
    if (node.children) {
      for (const child of node.children) walk(child, here);
    }
  };
  for (const root of tree) walk(root, []);
  return { bookmarks };
}

function combine(values, predicate, mode) {
  if (mode === "all") return values.every(predicate);
  return values.some(predicate);
}

function folderMatches(folderPath, patterns, mode) {
  if (!patterns.length) return false;
  const pathStr = folderPath.join("/").toLowerCase();
  const hit = p => {
    const needle = p.toLowerCase();
    if (needle.includes("/")) return pathStr.includes(needle);
    return folderPath.some(seg => seg.toLowerCase() === needle);
  };
  return combine(patterns, hit, mode);
}

function keywordMatches(haystack, keywords, mode) {
  if (!keywords.length) return false;
  const hay = haystack.toLowerCase();
  return combine(keywords, k => hay.includes(k), mode);
}

function tagMatches(tags, wanted, mode) {
  if (!wanted.length) return false;
  return combine(wanted, t => tags.includes(t), mode);
}

function passesIncludeFilters(bookmark, folderPath, settings) {
  const haystack = `${bookmark.title || ""} ${bookmark.url || ""}`;
  const tags = extractTags(bookmark.title);

  if (settings.includeKeywords.length &&
      !keywordMatches(haystack, settings.includeKeywords, settings.includeKeywordsMode)) {
    return false;
  }
  if (settings.includeTags.length &&
      !tagMatches(tags, settings.includeTags, settings.includeTagsMode)) {
    return false;
  }
  if (settings.includeFolders.length &&
      !folderMatches(folderPath, settings.includeFolders, settings.includeFoldersMode)) {
    return false;
  }
  return true;
}

function passesExcludeFilters(bookmark, folderPath, settings) {
  const haystack = `${bookmark.title || ""} ${bookmark.url || ""}`;
  const tags = extractTags(bookmark.title);

  if (settings.excludeKeywords.length &&
      keywordMatches(haystack, settings.excludeKeywords, settings.excludeKeywordsMode)) {
    return false;
  }
  if (settings.excludeTags.length &&
      tagMatches(tags, settings.excludeTags, settings.excludeTagsMode)) {
    return false;
  }
  if (settings.excludeFolders.length &&
      folderMatches(folderPath, settings.excludeFolders, settings.excludeFoldersMode)) {
    return false;
  }
  return true;
}

async function collectCandidates(settings) {
  const { bookmarks } = await walkTree();
  const candidates = [];
  for (const { node, folderPath } of bookmarks) {
    if (!/^https?:|^ftp:|^file:/i.test(node.url)) continue;
    if (!passesIncludeFilters(node, folderPath, settings)) continue;
    if (!passesExcludeFilters(node, folderPath, settings)) continue;
    candidates.push(node);
  }
  return candidates;
}

const browserAction = browser.browserAction || browser.action;

async function openRandomBookmark() {
  const raw = await getSettings();
  const settings = {
    ...raw,
    includeKeywords: normalizeList(raw.includeKeywords),
    includeTags: normalizeTagList(raw.includeTags),
    includeFolders: normalizeList(raw.includeFolders),
    excludeKeywords: normalizeList(raw.excludeKeywords),
    excludeTags: normalizeTagList(raw.excludeTags),
    excludeFolders: normalizeList(raw.excludeFolders)
  };

  const candidates = await collectCandidates(settings);
  if (!candidates.length) {
    await browserAction.setBadgeBackgroundColor({ color: "#c0392b" });
    await browserAction.setBadgeText({ text: "0" });
    setTimeout(() => browserAction.setBadgeText({ text: "" }), 2000);
    return;
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  if (settings.openInNewTab) {
    await browser.tabs.create({ url: pick.url, active: true });
  } else {
    await browser.tabs.update({ url: pick.url });
  }
}

console.log("[RandomBookmark] background loaded; using",
  browser.browserAction ? "browserAction" : "action");

browserAction.onClicked.addListener(() => {
  console.log("[RandomBookmark] toolbar clicked");
  openRandomBookmark().catch(err => console.error("[RandomBookmark] error", err));
});

if (browser.commands && browser.commands.onCommand) {
  browser.commands.onCommand.addListener(name => {
    console.log("[RandomBookmark] command", name);
  });
}
