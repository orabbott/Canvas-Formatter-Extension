const listEl = document.getElementById('list');
const addBtn = document.getElementById('add');
const originInput = document.getElementById('origin');
const grantRow = document.getElementById('grantRow');
const grantMsg = document.getElementById('grantMsg');
const grantBtn = document.getElementById('grant');

function patternFor(origin) {
  return origin + '/*';
}

function render(list) {
  listEl.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No Canvas sites added yet.';
    listEl.appendChild(li);
  }
  list.forEach((o, i) => {
    const li = document.createElement('li');
    li.dataset.origin = o;

    const status = document.createElement('span');
    status.className = 'status';
    li.appendChild(status);

    const name = document.createElement('span');
    name.className = 'origin';
    name.textContent = o;
    li.appendChild(name);

    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      list.splice(i, 1);
      save(list);
      chrome.permissions.remove({origins: [patternFor(o)]}, () => {
        render(list);
        refreshGrantRow();
      });
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
    refreshGrantRow();
  });
}

// collect the stored origins the extension does NOT yet have host access for
function withMissingAccess(done) {
  chrome.storage.sync.get({origins: []}, (res) => {
    const list = res.origins || [];
    const missing = [];
    let pending = list.length;
    if (!pending) return done([], list);
    list.forEach((o) => {
      chrome.permissions.contains({origins: [patternFor(o)]}, (has) => {
        if (!has) missing.push(o);
        if (--pending === 0) done(missing, list);
      });
    });
  });
}

function refreshGrantRow() {
  withMissingAccess((missing, list) => {
    if (!list.length) {
      grantRow.hidden = true;
      return;
    }
    grantRow.hidden = false;
    if (missing.length) {
      grantRow.classList.remove('ok');
      grantBtn.hidden = false;
      grantMsg.textContent = missing.length === 1
        ? 'Formatting is off for ' + missing[0] + ' until you grant access.'
        : 'Formatting is off for ' + missing.length + ' sites until you grant access.';
    } else {
      grantRow.classList.add('ok');
      grantBtn.hidden = true;
      grantMsg.textContent = list.length === 1
        ? 'Access granted. Formatting is active.'
        : 'Access granted for all ' + list.length + ' sites.';
    }
    grantBtn.dataset.origins = JSON.stringify(missing);
    // per-entry status symbol
    listEl.querySelectorAll('li[data-origin]').forEach((li) => {
      const has = !missing.includes(li.dataset.origin);
      const status = li.querySelector('.status');
      status.textContent = has ? '\u2713' : '\u26a0';
      status.className = 'status ' + (has ? 'ok' : 'warn');
      status.title = has ? 'Access granted' : 'Access not granted';
    });
  });
}

// must be called synchronously from a user gesture (click / Enter keypress)
function requestOrigins(origins, done) {
  if (!origins.length) return done && done(true);
  chrome.permissions.request({origins: origins.map(patternFor)}, (granted) => {
    if (!granted) {
      console.warn('Permission NOT granted for', origins);
      alert('Permission not granted. To enable formatting, open the extension Details → Site access and add the site.');
    }
    if (done) done(granted);
  });
}

function addOrigin() {
  let v = originInput.value.trim();
  if (!v) return;
  // normalize: allow users to enter hostnames without scheme
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  let originOnly;
  try {
    originOnly = new URL(v).origin; // store canonical origin
  } catch (e) {
    alert('Please enter a valid URL or hostname.');
    return;
  }
  // Both calls start in this tick. The permission prompt closes the popup, so
  // the worker owns the storage write — a callback here would never fire.
  chrome.runtime.sendMessage({type: 'addOrigin', origin: originOnly}, (res) => {
    if (chrome.runtime.lastError || !res) return;
    render(res.origins);
    refreshGrantRow();
  });
  requestOrigins([originOnly]);
  originInput.value = '';
}

addBtn.addEventListener('click', addOrigin);
originInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addOrigin();
  }
});

// grants every stored origin that is still missing access, in one prompt
grantBtn.addEventListener('click', () => {
  const origins = JSON.parse(grantBtn.dataset.origins || '[]');
  requestOrigins(origins, () => refreshGrantRow());
});

loadAndRender();

// the worker may write origins while this page is open (or on reopen)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.origins) {
    render(changes.origins.newValue || []);
    refreshGrantRow();
  }
});
