'use strict';

const defaultPrefs = {
  delay: 30,
  reset: true,
  exit: false,
  focus: true,
  keepawake: Boolean(chrome.power && chrome.power.requestKeepAwake),
  active: {
    os: navigator.platform.startsWith('Win') ? 'windows' : (navigator.platform.startsWith('Mac') ? 'darwin' : 'linux'),
    name: 'shutdown'
  },
  tokens: [],
  windows: {
    shutdown: 'shutdown /s /f /t 0',
    restart: 'shutdown /r /f /t 0',
    suspend: 'rundll32.exe powrprof.dll,SetSuspendState 0 1 0',
    hibernate: 'rundll32.exe powrprof.dll,SetSuspendState 1 1 0',
    logout: 'shutdown /l /f'
  },
  linux: {
    shutdown: 'shutdown -h now',
    restart: 'shutdown -r now',
    suspend: 'dbus-send --system --print-reply --dest="org.freedesktop.login1" /org/freedesktop/login1 org.freedesktop.login1.Manager.Suspend boolean:false',
    hibernate: 'dbus-send --system --print-reply --dest="org.freedesktop.login1" /org/freedesktop/login1 org.freedesktop.login1.Manager.Hibernate boolean:false'
  },
  darwin: {
    shutdown: 'osascript -e "tell application \\"System Events\\" to shut down"',
    restart: 'osascript -e "tell application \\"System Events\\" to restart"',
    suspend: 'osascript -e "tell application \\"System Events\\" to sleep"'
  }
};
const locale = {
  windows: 'Windows XP/Vista/7/8/10',
  linux: 'GNU/Linux (systemd)',
  darwin: 'Mac OS X',
  shutdown: 'Shutdown',
  restart: 'Restart',
  suspend: 'Suspend',
  hibernate: 'Hibernate',
  logout: 'Logout'
};
