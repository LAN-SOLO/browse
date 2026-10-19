// Toolbar button -> open the handbook page in a tab (focus it if already open).
//
// chrome.tabs.query({ url }) is NOT usable here: matching tabs by URL needs
// the "tabs" permission (or host permissions), without it the query silently
// returns [] — every click opened one more handbook tab. runtime.getContexts()
// lists the extension's own pages permission-free (Chromium >= 116).

const PAGE = chrome.runtime.getURL('handbook.html');

async function findHandbookTab() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['TAB'] });
  // documentUrl carries the #section the user last jumped to → compare without it
  return contexts.find((c) => c.tabId >= 0 && (c.documentUrl || '').split('#')[0] === PAGE) || null;
}

let opening = null; // double-clicks must not race into two new tabs

async function openHandbook() {
  const existing = await findHandbookTab();
  if (existing) {
    try {
      await chrome.tabs.update(existing.tabId, { active: true });
      await chrome.windows.update(existing.windowId, { focused: true });
      return existing.tabId;
    } catch {
      // tab closed in between → fall through and open a fresh one
    }
  }
  const tab = await chrome.tabs.create({ url: PAGE });
  return tab.id;
}

function openHandbookOnce() {
  if (!opening) opening = openHandbook().finally(() => { opening = null; });
  return opening;
}

chrome.action.onClicked.addListener(() => {
  openHandbookOnce().catch((e) => console.error('browse handbook: could not open the page', e));
});

// for scripts/test-handbook.mjs (service-worker global, no extra permission)
globalThis.browseHandbook = { openHandbook: openHandbookOnce, findHandbookTab };
