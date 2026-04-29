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

async function tagSearchSet(tagValues, mode) {
  if (!tagValues.length) return null;
  const sets = await Promise.all(
    tagValues.map(async value => {
      const results = await browser.bookmarks.search(value);
      return new Set(results.filter(r => r.url).map(r => r.id));
    })
  );
  if (mode === "all") {
    let acc = sets[0];
    for (let i = 1; i < sets.length; i++) {
      const next = new Set();
      for (const id of acc) if (sets[i].has(id)) next.add(id);
      acc = next;
    }
    return acc;
  }
  const union = new Set();
  for (const s of sets) for (const id of s) union.add(id);
  return union;
}

function passesIncludeFilters(bookmark, folderPath, settings, includeTagSet) {
  const haystack = `${bookmark.title || ""} ${bookmark.url || ""}`;

  if (settings.includeKeywords.length &&
      !keywordMatches(haystack, settings.includeKeywords, settings.includeKeywordsMode)) {
    return false;
  }
  if (includeTagSet && !includeTagSet.has(bookmark.id)) {
    return false;
  }
  if (settings.includeFolders.length &&
      !folderMatches(folderPath, settings.includeFolders, settings.includeFoldersMode)) {
    return false;
  }
  return true;
}

function passesExcludeFilters(bookmark, folderPath, settings, excludeTagSet) {
  const haystack = `${bookmark.title || ""} ${bookmark.url || ""}`;

  if (settings.excludeKeywords.length &&
      keywordMatches(haystack, settings.excludeKeywords, settings.excludeKeywordsMode)) {
    return false;
  }
  if (excludeTagSet && excludeTagSet.has(bookmark.id)) {
    return false;
  }
  if (settings.excludeFolders.length &&
      folderMatches(folderPath, settings.excludeFolders, settings.excludeFoldersMode)) {
    return false;
  }
  return true;
}

async function collectCandidates(settings) {
  const [{ bookmarks }, includeTagSet, excludeTagSet] = await Promise.all([
    walkTree(),
    tagSearchSet(settings.includeTags, settings.includeTagsMode),
    tagSearchSet(settings.excludeTags, settings.excludeTagsMode)
  ]);

  const candidates = [];
  let totalUrls = 0;
  for (const { node, folderPath } of bookmarks) {
    if (!/^https?:|^ftp:|^file:/i.test(node.url)) continue;
    totalUrls++;
    if (!passesIncludeFilters(node, folderPath, settings, includeTagSet)) continue;
    if (!passesExcludeFilters(node, folderPath, settings, excludeTagSet)) continue;
    candidates.push({ node, folderPath });
  }
  return {
    candidates,
    totalUrls,
    includeTagSetSize: includeTagSet ? includeTagSet.size : null,
    excludeTagSetSize: excludeTagSet ? excludeTagSet.size : null
  };
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

  console.log("[RandomBookmark] active settings:", JSON.stringify(settings, null, 2));

  const result = await collectCandidates(settings);
  const { candidates, totalUrls, includeTagSetSize, excludeTagSetSize } = result;
  console.log(
    `[RandomBookmark] ${candidates.length} candidate(s) of ${totalUrls} bookmarks` +
    (includeTagSetSize !== null ? ` (include-tag search matched ${includeTagSetSize})` : "") +
    (excludeTagSetSize !== null ? ` (exclude-tag search matched ${excludeTagSetSize})` : "")
  );

  if (candidates.length) {
    const sample = candidates.slice(0, 5).map(c => ({
      title: c.node.title,
      folder: c.folderPath.join("/"),
      url: c.node.url
    }));
    console.log("[RandomBookmark] first up to 5 candidates:", sample);
  }

  if (!candidates.length) {
    await browserAction.setBadgeBackgroundColor({ color: "#c0392b" });
    await browserAction.setBadgeText({ text: "0" });
    setTimeout(() => browserAction.setBadgeText({ text: "" }), 2000);
    if (browser.notifications) {
      try {
        await browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/icon-96.png"),
          title: "Random Bookmark Opener",
          message: "No bookmarks match the current filters. Open the options page to adjust them."
        });
      } catch (e) {
        console.warn("[RandomBookmark] notification failed", e);
      }
    }
    return;
  }

  const { node: pick, folderPath } = candidates[Math.floor(Math.random() * candidates.length)];
  console.log("[RandomBookmark] picked:", {
    title: pick.title,
    folder: folderPath.join("/"),
    url: pick.url
  });
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
