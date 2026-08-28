// background service worker: inject content script and css into tabs whose origin matches stored origins

async function getStoredOrigins() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({origins: []}, (res) => resolve(res.origins || []));
  });
}

function originFromUrl(url) {
  try {
    const u = new URL(url);
    return u.origin;
  } catch (e) {
    return null;
  }
}

async function handleTab(tabId, changeInfo, tab) {
  if (!tab.url) return;
  const origin = originFromUrl(tab.url);
  if (!origin) return;
  const origins = await getStoredOrigins();
  if (origins.includes(origin)) {
    console.log('Canvas Formatter: matching origin', origin, 'for tab', tabId);
    // ensure we have host permission for this origin before injecting
    const pattern = origin + '/*';
    chrome.permissions.contains({origins: [pattern]}, (has) => {
      console.log('Permissions.contains for', pattern, '=>', has);
      if (!has) {
        // permissions.request requires a user gesture, so it can't happen here.
        console.warn('No host permission for', pattern, '- add the site on the options page.');
        return;
      }
      chrome.scripting.insertCSS({target: {tabId}, files: ['style.css']}).catch((e) => console.error('insertCSS failed', e));
      chrome.scripting.executeScript({target: {tabId}, files: ['scripts/content.js']}).catch((e) => console.error('executeScript failed', e));
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') handleTab(tabId, changeInfo, tab);
});

chrome.runtime.onInstalled.addListener(() => {
  // initialize with the existing example domain to keep previous behavior
  chrome.storage.sync.get({origins: []}, (res) => {
    if (!res.origins || res.origins.length === 0) {
      chrome.storage.sync.set({origins: ['https://canvas.ku.edu']});
    }
  });
});