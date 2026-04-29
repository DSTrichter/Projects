# Random Bookmark Opener

A Firefox extension that opens a random bookmark with a single click on the
toolbar icon. Includes configurable include/exclude filters for tags,
keywords, and subfolders.

## Features

- **One click, one random bookmark.** Click the toolbar button and a random
  eligible bookmark opens in a new tab (configurable).
- **Include filters** — restrict the candidate pool by:
  - **Keywords** (substring match against title + URL)
  - **Tags** (uses Firefox's `bookmarks.search()` — matches your real Firefox
    tags as well as bookmark titles and URLs)
  - **Folders** (by name, e.g. `Work`, or by path fragment, e.g. `Toolbar/Docs`)
- **Per-field match mode.** Each filter field has its own *match any* /
  *match all* toggle. Set Tags to *match all* to require a bookmark to have
  every tag you list (e.g. `travel, germany` → must have both `#travel` and
  `#germany`). Tags default to *match all*; keywords and folders default to
  *match any*.
- **Cross-field combination** is always AND: a bookmark must satisfy every
  populated include field.
- **Exclude filters** with the same three dimensions (keywords, tags, folders),
  each with its own match mode (default *match any* — drop on a single match).
  Exclusions always override includes.
- **Whole-word matches.** Keywords match against title/URL using word
  boundaries — `mars` won't match `marsupial.com`. Tag search results are
  post-filtered the same way (with a fall-through that keeps results that
  must have come from the actual tag, since the API doesn't expose tag
  text).
- **Skip dead pages.** Before opening, the chosen page is fetched and its
  HTML scanned for configurable phrases (default `"has been disabled"`).
  If any match, a different bookmark is picked instead. Configurable in the
  options page; leave blank to disable the network check.
- **Empty-pool feedback.** When no bookmarks match, a desktop notification
  fires and the toolbar shows a brief `0` badge.
- **Keyboard shortcut.** Default `Alt+Shift+R`. Customize at `about:addons` →
  gear icon (top right) → **Manage Extension Shortcuts**.

## Installation (temporary / development)

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` inside this folder.

The toolbar button will appear. Right-click it → **Manage Extension → Options**
to configure filters (or use `about:addons` → Preferences).

## Packaging

To build a distributable `.xpi`, zip the contents of this folder (not the
folder itself):

```bash
cd RandomBookmarkOpener
zip -r ../random-bookmark-opener.xpi . -x "*.DS_Store" "README.md"
```

For signed distribution, submit to
[addons.mozilla.org](https://addons.mozilla.org/developers/).

## How filters work

### Keywords
Case-insensitive substring match against the bookmark's title combined with
its URL. Any one listed keyword that appears is a match.

### Tags
Each value is fed to `browser.bookmarks.search(value)` — the same search
the awesomebar performs. That means it honors your real Firefox tags (set
via the Edit Bookmark UI) **and** matches bookmark titles and URLs. The
WebExtensions API doesn't expose the underlying tag list, so we can't
distinguish a tag-match from a title/URL-match.

With *match all*, the result is the intersection of each value's search
result, so `travel, germany` selects bookmarks where both terms appear
somewhere (title, URL, or tag).

### Folders
- A plain folder name (`Work`) matches any ancestor folder with that name.
- A path fragment with slashes (`Toolbar/Work/Docs`) matches if that fragment
  appears anywhere in the bookmark's folder path.
- Both are case-insensitive.

### Include vs exclude
- If **no** include filters are set, every bookmark is eligible.
- If any include field is populated, the bookmark must pass that field
  (using the field's own *match any* / *match all* mode), AND it must
  pass every other populated include field.
- If a bookmark matches any populated exclude field (per that field's mode),
  the bookmark is dropped regardless of include matches.

## File layout

```
RandomBookmarkOpener/
├── manifest.json     # MV3 manifest
├── background.js     # click handler + filter logic
├── options.html      # settings UI
├── options.js        # settings load/save
├── options.css       # settings styling
└── icons/
    ├── icon-32.png
    ├── icon-48.png
    └── icon-96.png
```

## Permissions

- `bookmarks` — read the bookmark tree to pick a candidate.
- `storage` — persist your filter settings.
- `tabs` — open the picked bookmark in a new or current tab.
- `notifications` — show a desktop notification when no bookmarks match.
- `<all_urls>` — fetch the chosen page in the background to check it for
  the skip phrases (e.g. `has been disabled`). The fetch is only made on the
  one bookmark you're about to open. No telemetry; nothing is sent off-machine.
