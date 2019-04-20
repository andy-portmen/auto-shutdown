/* globals Parser, defaultPrefs, locale */
'use strict';

var delay;
var id;
var prefs = defaultPrefs;
chrome.runtime.connect({
  name: 'me'
});

function error(response) {
  window.alert(`Something went wrong!

-----
Code: ${response.code}
Output: ${response.stdout}
Error: ${response.stderr}`);
}

function response(res) {
  // windows batch returns 1
  if (res && (res.code !== 0 && (res.code !== 1 || res.stderr !== ''))) {
    error(res);
  }
  else if (!res) {
    chrome.tabs.create({
      url: '/data/helper/index.html'
    });
  }
  else if (prefs.exit) {
    chrome.runtime.sendMessage({
      method: 'close-me'
    });
  }
}

function command() {
  const cmd = prefs[prefs.active.os][prefs.active.name];
  const parser = new Parser();
  const termref = {
    lineBuffer: cmd
  };
  parser.parseLine(termref);
  chrome.runtime.sendNativeMessage('com.add0n.node', {
    cmd: 'exec',
    command: termref.argv[0],
    arguments: termref.argv.slice(1)
  }, response);
}

function update() {
  delay -= 1;
  if (delay === 0) {
    window.clearInterval(id);
    // make sure there is no download job
    chrome.downloads.search({
      state: 'in_progress',
      limit: 1
    }, ds => {
      if (ds.length === 0) {
        command();
      }
      else {
        window.close();
      }
    });
  }
  document.getElementById('number').textContent = ('0' + delay).substr(-2);
}

chrome.storage.local.get(prefs, p => {
  Object.assign(prefs, p);
  delay = prefs.delay;
  update();
  id = window.setInterval(update, 1000);
  document.getElementById('info-1').textContent = locale[prefs.active.os] + ' -> ' + locale[prefs.active.name];
  document.getElementById('info-2').textContent = prefs[prefs.active.os][prefs.active.name];
});

document.addEventListener('click', e => {
  const cmd = e.target.dataset.cmd;
  if (cmd === 'cancel') {
    window.close();
  }
  else if (cmd === 'execute') {
    delay = 2;
  }
});

window.addEventListener('blur', () => delay !== 0 && chrome.storage.local.get({
  'focus': true
}, prefs => prefs.focus && chrome.runtime.sendMessage({
  method: 'focus-me'
})));
