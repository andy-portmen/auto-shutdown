/* globals defaultPrefs, locale */
'use strict';

var prefs = defaultPrefs;
var info = document.getElementById('info');

var select = document.getElementById('select');

function restore() {
  chrome.storage.local.get(prefs, p => {
    Object.assign(prefs, p);

    document.getElementById('delay').value = prefs.delay;
    document.getElementById('reset').checked = prefs.reset;
    document.getElementById('exit').checked = prefs.exit;
    document.getElementById('focus').checked = prefs.focus;
    ['windows', 'linux', 'darwin'].forEach(os => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = locale[os];
      optgroup.value = os;
      select.appendChild(optgroup);
      Object.keys(prefs[os]).forEach(name => {
        const option = document.createElement('option');
        option.value = prefs[os][name];
        option.dataset.os = os;
        option.dataset.name = name;
        option.textContent = locale[name];
        optgroup.appendChild(option);
      });
    });
    document.getElementById('command').value = select.value =
      prefs[prefs.active.os][prefs.active.name];
  });
}

restore();

select.addEventListener('change', e => {
  document.getElementById('command').value = e.target.value;
});

document.getElementById('save').addEventListener('click', () => {
  prefs.delay = Number(document.getElementById('delay').value);
  prefs.reset = document.getElementById('reset').checked;
  prefs.exit = document.getElementById('exit').checked;
  prefs.focus = document.getElementById('focus').checked;
  const option = select.selectedOptions[0];
  prefs[option.dataset.os][option.dataset.name] = option.value =
    document.getElementById('command').value || option.value;
  prefs.active = {
    os: option.dataset.os,
    name: option.dataset.name
  };
  chrome.storage.local.set(prefs, () => {
    info.textContent = 'Options saved';
    window.setTimeout(() => info.textContent = '', 750);
  });
});

document.getElementById('test').addEventListener('click', () => {
  chrome.tabs.create({
    url: '/data/helper/index.html'
  });
});

// reset
document.getElementById('factroy').addEventListener('click', e => {
  if (e.detail === 1) {
    info.textContent = 'Double-click to reset!';
    window.setTimeout(() => info.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});
// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));
// perform
document.getElementById('perform').addEventListener('click', () => chrome.runtime.getBackgroundPage(bg => {
  bg.shutdown.action();
}));
