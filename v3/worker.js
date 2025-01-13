'use strict';

const shutdown = {
  busy: false,
  action() {
    chrome.runtime.sendMessage({
      method: 'exists'
    }, a => {
      chrome.runtime.lastError;
      if (a !== true) {
        chrome.windows.getCurrent(win => {
          chrome.storage.local.get({
            width: 500,
            height: 350,
            left: win.left + Math.round((win.width - 500) / 2),
            top: win.top + Math.round((win.height - 350) / 2)
          }, prefs => {
            chrome.windows.create({
              url: '/data/shutdown/index.html',
              type: 'panel',
              left: prefs.left,
              top: prefs.top,
              width: Math.max(prefs.width, 200),
              height: Math.max(prefs.height, 200)
            });
          });
        });
      }
    });
  },
  keepawake(bol) {
    if (chrome.power && chrome.power.requestKeepAwake) {
      if (bol) {
        chrome.storage.local.get({
          keepawake: true,
          awakemethod: 'system'
        }, prefs => {
          if (prefs.keepawake) {
            chrome.power.requestKeepAwake(prefs.awakemethod);
          }
        });
      }
      else {
        chrome.power.releaseKeepAwake();
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

    chrome.action.setIcon({
      path: {
        '16': '/data/icons/16.png',
        '32': '/data/icons/32.png',
        '48': '/data/icons/48.png'
      }
    });
    chrome.action.setTitle({
      title: 'Auto Shutdown (enabled)'
    });
  },
  disable() {
    chrome.downloads.onChanged.removeListener(shutdown.observe);
    chrome.action.setIcon({
      path: {
        '16': '/data/icons/disabled/16.png',
        '32': '/data/icons/disabled/32.png',
        '48': '/data/icons/disabled/48.png'
      }
    });
    chrome.action.setTitle({
      title: 'Auto Shutdown (disabled)'
    });
  }
};

// runs when bg is active to register listeners
chrome.storage.local.get({
  enabled: false
}, prefs => {
  shutdown[prefs.enabled ? 'enable' : 'disable']();
});

// startup
{
  const once = () => {
    if (once.done) {
      return;
    }
    once.done = true;

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
    });
  };
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

chrome.storage.onChanged.addListener(prefs => {
  if (prefs.enabled) {
    shutdown[prefs.enabled.newValue ? 'enable' : 'disable']();
  }
});

chrome.action.onClicked.addListener(() => chrome.storage.local.get({
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
  else if (request.method === 'action') {
    shutdown.action();
  }
});

chrome.runtime.onMessageExternal.addListener(request => {
  if (request.method === 'shutdown') {
    shutdown.action();
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
