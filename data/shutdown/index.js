/* globals Parser, defaultPrefs, locale */
'use strict';

var delay, id;
var prefs = defaultPrefs;

function error (response) {
  window.alert(`Something went wrong!

-----
Code: ${response.code}
Output: ${response.stdout}
Error: ${response.stderr}`);
}

function response (res) {
  // windows batch returns 1
  if (res && (res.code !== 0 && (res.code !== 1 || res.stderr !== ''))) {
    error(res);
  }
  else if (!res) {
    chrome.tabs.create({
      url: '/data/helper/index.html'
    });
  }
}

function command () {
  let cmd = prefs[prefs.active.os][prefs.active.name];
  let parser = new Parser();
  let termref = {
    lineBuffer: cmd
  };
  parser.parseLine(termref);
  chrome.runtime.sendNativeMessage('com.add0n.node', {
    cmd: 'exec',
    command: termref.argv[0],
    arguments: termref.argv.slice(1),
  }, response);
}

function update () {
  delay -= 1;
  if (delay === 0) {
    window.clearInterval(id);
    command();
  }
  document.getElementById('number').textContent = ('0' + delay).substr(-2);
}

chrome.storage.local.get(prefs, p => {
  prefs = p;
  delay = prefs.delay;
  update();
  id = window.setInterval(update, 1000);
  document.getElementById('info-1').textContent = locale[prefs.active.os] + ' -> ' + locale[prefs.active.name];
  document.getElementById('info-2').textContent = prefs[prefs.active.os][prefs.active.name];
});
