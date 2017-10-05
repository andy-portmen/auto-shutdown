/* globals defaultPrefs, locale */
'use strict';

var prefs = defaultPrefs;

var select = document.getElementById('select');

function restore() {
  chrome.storage.local.get(prefs, p => {
    Object.assign(prefs, p);

    document.getElementById('delay').value = prefs.delay;
    document.getElementById('reset').checked = prefs.reset;
    document.getElementById('exit').checked = prefs.exit;
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
  const option = select.selectedOptions[0];
  prefs[option.dataset.os][option.dataset.name] = option.value =
    document.getElementById('command').value || option.value;
  prefs.active = {
    os: option.dataset.os,
    name: option.dataset.name
  };
  chrome.storage.local.set(prefs, () => {
    const info = document.getElementById('info');
    info.textContent = 'Options saved';
    window.setTimeout(() => info.textContent = '', 750);
  });
});

document.getElementById('test').addEventListener('click', () => {
  chrome.tabs.create({
    url: '/data/helper/index.html'
  });
});
