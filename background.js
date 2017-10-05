'use strict';

var shutdown = {
  action: () => {
    chrome.windows.getCurrent(win => {
      chrome.storage.local.get({
        width: 500,
        height: 350,
        left: win.left + Math.round((win.width - 500) / 2),
        top: win.top + Math.round((win.height - 350) / 2)
      }, prefs => {
        chrome.windows.create({
          url: chrome.extension.getURL('data/shutdown/index.html'),
          type: 'panel',
          left: prefs.left,
          top: prefs.top,
          width: Math.max(prefs.width, 200),
          height: Math.max(prefs.height, 200)
        });
      });
    });
  },
  observe: () => {
    chrome.downloads.search({
      state: 'in_progress',
      limit: 1
    }, ds => {
      if (ds.length === 0) {
        shutdown.action();
      }
    });
  },
  enable: () => {
    chrome.downloads.onChanged.addListener(shutdown.observe);
    chrome.browserAction.setIcon({
      path: {
        '16': 'data/icons/16.png',
        '32': 'data/icons/32.png'
      }
    });
    chrome.browserAction.setTitle({
      title: 'Auto Shutdown (enabled)'
    });
  },
  disable: () => {
    chrome.downloads.onChanged.removeListener(shutdown.observe);
    chrome.browserAction.setIcon({
      path: {
        '16': 'data/icons/disabled/16.png',
        '32': 'data/icons/disabled/32.png'
      }
    });
    chrome.browserAction.setTitle({
      title: 'Auto Shutdown (disabled)'
    });
  }
};

chrome.storage.local.get({
  enabled: false,
  reset: true
}, prefs => {
  if (prefs.reset && prefs.enabled) {
    chrome.storage.local.set({
      enabled: false
    });
  }
  if (!prefs.reset && prefs.enabled) {
    shutdown.enable();
  }
});

chrome.storage.onChanged.addListener(prefs => {
  if (prefs.enabled) {
    shutdown[prefs.enabled.newValue ? 'enable' : 'disable']();
  }
});

chrome.browserAction.onClicked.addListener(() => {
  chrome.storage.local.get({
    enabled: false
  }, prefs => {
    prefs.enabled = !prefs.enabled;
    chrome.storage.local.set(prefs);
  });
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'close-me') {
    chrome.tabs.remove(sender.tab.id);
  }
});

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.indexOf('Firefox') === -1
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/auto-shutdown.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
});
{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
}
