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
  earliestDate: "",
  latestDate: "",
  openInNewTab: true,
  openCount: 1,
  skipPhrases: ["has been disabled"],
  skipFetchTimeoutMs: 5000
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

function dateStringToMs(s, endOfDay) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  const dt = endOfDay
    ? new Date(y, mo - 1, d, 23, 59, 59, 999)
    : new Date(y, mo - 1, d, 0, 0, 0, 0);
  const t = dt.getTime();
  return Number.isFinite(t) ? t : null;
}

function dateInRange(node, earliestMs, latestMs) {
  if (earliestMs === null && latestMs === null) return true;
  if (typeof node.dateAdded !== "number") return true;
  if (earliestMs !== null && node.dateAdded < earliestMs) return false;
  if (latestMs !== null && node.dateAdded > latestMs) return false;
  return true;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wholeWord(haystack, term) {
  if (!term) return false;
  const re = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
  return re.test(haystack);
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
  return combine(keywords, k => wholeWord(haystack, k), mode);
}

function tagResultPasses(node, term) {
  const title = (node.title || "").toLowerCase();
  const url = (node.url || "").toLowerCase();
  const t = term.toLowerCase();
  const inTitleSubstr = title.includes(t);
  const inUrlSubstr = url.includes(t);
  if (!inTitleSubstr && !inUrlSubstr) return true;
  return wholeWord(title, t) || wholeWord(url, t);
}

async function tagSearchSet(tagValues, mode) {
  if (!tagValues.length) return null;
  const sets = await Promise.all(
    tagValues.map(async value => {
      const results = await browser.bookmarks.search(value);
      return new Set(
        results
          .filter(r => r.url && tagResultPasses(r, value))
          .map(r => r.id)
      );
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

  const earliestMs = dateStringToMs(settings.earliestDate, false);
  const latestMs = dateStringToMs(settings.latestDate, true);

  const candidates = [];
  let totalUrls = 0;
  let droppedByDate = 0;
  for (const { node, folderPath } of bookmarks) {
    if (!/^https?:|^ftp:|^file:/i.test(node.url)) continue;
    totalUrls++;
    if (!dateInRange(node, earliestMs, latestMs)) { droppedByDate++; continue; }
    if (!passesIncludeFilters(node, folderPath, settings, includeTagSet)) continue;
    if (!passesExcludeFilters(node, folderPath, settings, excludeTagSet)) continue;
    candidates.push({ node, folderPath });
  }
  return {
    candidates,
    totalUrls,
    droppedByDate,
    dateRange: {
      earliestMs,
      latestMs,
      active: earliestMs !== null || latestMs !== null
    },
    includeTagSetSize: includeTagSet ? includeTagSet.size : null,
    excludeTagSetSize: excludeTagSet ? excludeTagSet.size : null
  };
}

async function pageContainsAny(url, phrases, timeoutMs) {
  if (!phrases.length) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    if (!res.ok) return false;
    const text = await res.text();
    const lower = text.toLowerCase();
    return phrases.some(p => lower.includes(p.toLowerCase()));
  } catch (e) {
    console.warn("[RandomBookmark] fetch check failed for", url, e.message || e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function pickLivePicks(candidates, want, settings) {
  const skipPhrases = (settings.skipPhrases || [])
    .map(s => String(s).trim())
    .filter(Boolean);
  const timeoutMs = settings.skipFetchTimeoutMs | 0 || 5000;

  const pool = [...candidates];
  const picks = [];

  while (picks.length < want && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    const c = pool.splice(idx, 1)[0];
    if (skipPhrases.length) {
      const dead = await pageContainsAny(c.node.url, skipPhrases, timeoutMs);
      if (dead) {
        console.log("[RandomBookmark] skipping (matched skip phrase):", c.node.url);
        continue;
      }
    }
    picks.push(c);
  }
  return picks;
}

const browserAction = browser.browserAction || browser.action;

async function notifyEmpty() {
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

  console.log("[RandomBookmark] active settings:", JSON.stringify(settings, null, 2));

  const result = await collectCandidates(settings);
  const { candidates, totalUrls, droppedByDate, dateRange, includeTagSetSize, excludeTagSetSize } = result;
  console.log(
    `[RandomBookmark] ${candidates.length} candidate(s) of ${totalUrls} bookmarks` +
    (dateRange.active ? ` (${droppedByDate} dropped by date range)` : "") +
    (includeTagSetSize !== null ? ` (include-tag search matched ${includeTagSetSize})` : "") +
    (excludeTagSetSize !== null ? ` (exclude-tag search matched ${excludeTagSetSize})` : "")
  );

  if (!candidates.length) {
    await notifyEmpty();
    return;
  }

  const want = Math.max(1, Math.min(50, settings.openCount | 0 || 1));
  const picks = await pickLivePicks(candidates, want, settings);
  if (!picks.length) {
    await notifyEmpty();
    return;
  }

  console.log(`[RandomBookmark] opening ${picks.length} of ${want} requested`);
  for (let i = 0; i < picks.length; i++) {
    const { node: pick, folderPath } = picks[i];
    console.log("[RandomBookmark] picked:", {
      title: pick.title,
      folder: folderPath.join("/"),
      url: pick.url
    });
    const isFirst = i === 0;
    if (settings.openInNewTab || !isFirst) {
      await browser.tabs.create({ url: pick.url, active: isFirst });
    } else {
      await browser.tabs.update({ url: pick.url });
    }
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
