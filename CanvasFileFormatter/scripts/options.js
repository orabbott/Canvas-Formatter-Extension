const listEl = document.getElementById('list');
const addBtn = document.getElementById('add');
const originInput = document.getElementById('origin');

function render(list) {
  listEl.innerHTML = '';
  list.forEach((o, i) => {
    const li = document.createElement('li');
    li.textContent = o;
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.style.marginLeft = '8px';
    remove.addEventListener('click', () => {
      list.splice(i, 1);
      save(list);
      render(list);
    });
    li.appendChild(remove);
    listEl.appendChild(li);
  });
}

function save(list) {
  chrome.storage.sync.set({origins: list});
}

function loadAndRender() {
  chrome.storage.sync.get({origins: []}, (res) => {
    render(res.origins || []);
  });
}

addBtn.addEventListener('click', () => {
  let v = originInput.value.trim();
  if (!v) return;
  // normalize: allow users to enter hostnames without scheme
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  try {
    const u = new URL(v);
    const originOnly = u.origin; // store canonical origin
    chrome.storage.sync.get({origins: []}, (res) => {
      const list = res.origins || [];
      if (!list.includes(originOnly)) list.push(originOnly);
      save(list);
      render(list);
      originInput.value = '';
    });
    // open a full tab to request host permission there (more reliable than requesting from popup)
    const url = chrome.runtime.getURL('options.html') + '?request=' + encodeURIComponent(originOnly);
    chrome.tabs.create({url}, (tab) => {
      try { window.close(); } catch (e) {}
    });
  } catch (e) {
    alert('Please enter a valid URL or hostname.');
  }
});

loadAndRender();

// If this page was opened with ?request=<origin>, perform the permissions.request here
(() => {
  const params = new URLSearchParams(location.search);
  const toReq = params.get('request');
  if (toReq) {
    const pattern = toReq + '/*';
    chrome.permissions.request({origins: [pattern]}, (granted) => {
      if (granted) {
        console.log('Permission granted for', pattern);
        // remove the query param from the URL for cleanliness
        history.replaceState({}, document.title, 'options.html');
        // update UI
        chrome.storage.sync.get({origins: []}, (res) => render(res.origins || []));
      } else {
        console.warn('Permission NOT granted for', pattern);
        alert('Permission not granted. To enable injection, open the extension Details → Site access and add the site.');
      }
    });
  }
})();