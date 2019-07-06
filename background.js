'use strict';

const ports = [];
chrome.runtime.onConnect.addListener(port => {
  ports.push(port);
  port.onDisconnect.addListener(() => {
    const index = ports.indexOf(port);
    if (index !== -1) {
      ports.splice(index, 1);
    }
  });
});

const shutdown = {
  busy: false,
  action: () => ports.length === 0 ? chrome.windows.getCurrent(win => {
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
  }) : chrome.windows.update(ports[0].sender.tab.windowId, {
    focused: true
  }),
  keepawake(bol) {
    if (chrome.power && chrome.power.requestKeepAwake) {
      if (bol) {
        chrome.storage.local.get({
          keepawake: true,
          awakemethod: 'system'
        }, prefs => {
          if (prefs.keepawake) {
            chrome.power.requestKeepAwake(prefs.awakemethod);
            console.log('keep awake is enabled');
          }
        });
      }
      else {
        chrome.power.releaseKeepAwake();
        console.log('keep awake is disabled');
      }
    }
  },
  observe() {
    if (shutdown.busy) {
      return;
    }
    shutdown.busy = true;
    chrome.downloads.search({
      state: 'in_progress',
      limit: 1
    }, ds => {
      shutdown.busy = false;
      shutdown.keepawake(ds.length !== 0);
      if (ds.length === 0) {
        shutdown.action();
      }
    });
  },
  enable() {
    chrome.downloads.onChanged.removeListener(shutdown.observe);
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
  disable() {
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
    prefs.enabled = false;
  }
  if (prefs.enabled) {
    shutdown.enable();
  }
});

chrome.storage.onChanged.addListener(prefs => {
  if (prefs.enabled) {
    shutdown[prefs.enabled.newValue ? 'enable' : 'disable']();
  }
});

chrome.browserAction.onClicked.addListener(() => chrome.storage.local.get({
  enabled: false
}, prefs => {
  prefs.enabled = !prefs.enabled;
  chrome.storage.local.set(prefs);
}));

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'close-me') {
    chrome.tabs.remove(sender.tab.id);
  }
  else if (request.method === 'focus-me') {
    chrome.windows.update(sender.tab.windowId, {
      focused: true
    });
  }
});

// FAQs & Feedback
{
  const {onInstalled, setUninstallURL, getManifest} = chrome.runtime;
  const {name, version} = getManifest();
  const page = getManifest().homepage_url;
  onInstalled.addListener(({reason, previousVersion}) => {
    chrome.storage.local.get({
      'faqs': true,
      'last-update': 0
    }, prefs => {
      if (reason === 'install' || (prefs.faqs && reason === 'update')) {
        const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
        if (doUpdate && previousVersion !== version) {
          chrome.tabs.create({
            url: page + '?version=' + version +
              (previousVersion ? '&p=' + previousVersion : '') +
              '&type=' + reason,
            active: reason === 'install'
          });
          chrome.storage.local.set({'last-update': Date.now()});
        }
      }
    });
  });
  setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
}
