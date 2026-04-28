const DEFAULT_SETTINGS = {
  includeKeywords: [],
  includeTags: [],
  includeFolders: [],
  excludeKeywords: [],
  excludeTags: [],
  excludeFolders: [],
  openInNewTab: true,
  matchMode: "any"
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
  const idToPath = new Map();
  const bookmarks = [];
  const walk = (node, path) => {
    const here = node.title ? [...path, node.title] : path;
    idToPath.set(node.id, here);
    if (node.url) {
      bookmarks.push({ node, folderPath: path });
    }
    if (node.children) {
      for (const child of node.children) walk(child, here);
    }
  };
  for (const root of tree) walk(root, []);
  return { idToPath, bookmarks };
}

function folderMatches(folderPath, patterns) {
  if (!patterns.length) return false;
  const pathStr = folderPath.join("/").toLowerCase();
  return patterns.some(p => {
    const needle = p.toLowerCase();
    if (needle.includes("/")) return pathStr.includes(needle);
    return folderPath.some(seg => seg.toLowerCase() === needle);
  });
}

function keywordMatches(haystack, keywords) {
  if (!keywords.length) return false;
  const hay = haystack.toLowerCase();
  return keywords.some(k => hay.includes(k));
}

function tagMatches(tags, wanted) {
  if (!wanted.length) return false;
  return wanted.some(t => tags.includes(t));
}

function passesIncludeFilters(bookmark, folderPath, settings) {
  const hasAnyInclude =
    settings.includeKeywords.length ||
    settings.includeTags.length ||
    settings.includeFolders.length;

  if (!hasAnyInclude) return true;

  const haystack = `${bookmark.title || ""} ${bookmark.url || ""}`;
  const tags = extractTags(bookmark.title);

  const kwHit = keywordMatches(haystack, settings.includeKeywords);
  const tagHit = tagMatches(tags, settings.includeTags);
  const folderHit = folderMatches(folderPath, settings.includeFolders);

  const activeHits = [];
  if (settings.includeKeywords.length) activeHits.push(kwHit);
  if (settings.includeTags.length) activeHits.push(tagHit);
  if (settings.includeFolders.length) activeHits.push(folderHit);

  if (settings.matchMode === "all") return activeHits.every(Boolean);
  return activeHits.some(Boolean);
}

function passesExcludeFilters(bookmark, folderPath, settings) {
  const haystack = `${bookmark.title || ""} ${bookmark.url || ""}`;
  const tags = extractTags(bookmark.title);

  if (keywordMatches(haystack, settings.excludeKeywords)) return false;
  if (tagMatches(tags, settings.excludeTags)) return false;
  if (folderMatches(folderPath, settings.excludeFolders)) return false;
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
    await browser.action.setBadgeBackgroundColor({ color: "#c0392b" });
    await browser.action.setBadgeText({ text: "0" });
    setTimeout(() => browser.action.setBadgeText({ text: "" }), 2000);
    return;
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  if (settings.openInNewTab) {
    await browser.tabs.create({ url: pick.url, active: true });
  } else {
    await browser.tabs.update({ url: pick.url });
  }
}

browser.action.onClicked.addListener(() => {
  openRandomBookmark().catch(err => console.error("RandomBookmark error", err));
});
