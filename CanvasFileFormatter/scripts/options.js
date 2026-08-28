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
    // request host permission now (must be called during this user gesture)
    const pattern = originOnly + '/*';
    chrome.permissions.request({origins: [pattern]}, (granted) => {
      if (granted) {
        console.log('Permission granted for', pattern);
      } else {
        console.warn('Permission NOT granted for', pattern);
        alert('Permission not granted. To enable injection, open the extension Details → Site access and add the site.');
      }
    });
  } catch (e) {
    alert('Please enter a valid URL or hostname.');
  }
});

loadAndRender();

// no deferred permission requests — requests must be initiated by a user gesture