'use strict';

var defaultPrefs = {
  delay: 30,
  reset: true,
  active: {
    os: navigator.platform.indexOf('Windows') !== -1 ? 'windows' : (navigator.platform.indexOf('Mac') !== -1 ? 'darwin' : 'linux'),
    name: 'shutdown'
  },
  windows: {
    shutdown: 'shutdown /s /f /t 0',
    restart: 'shutdown /r /f /t 0',
    suspend: 'CALL:PowrProf.dll SetSuspendState 0 1 0',
    hibernate: 'CALL:PowrProf.dll SetSuspendState 1 1 0',
    logout: 'shutdown /l /f'
  },
  linux: {
    shutdown: 'dbus-send --system --print-reply --dest="org.freedesktop.login1" /org/freedesktop/login1 org.freedesktop.login1.Manager.PowerOff boolean:false',
    restart: 'dbus-send --system --print-reply --dest="org.freedesktop.login1" /org/freedesktop/login1 org.freedesktop.login1.Manager.Reboot boolean:false',
    suspend: 'dbus-send --system --print-reply --dest="org.freedesktop.login1" /org/freedesktop/login1 org.freedesktop.login1.Manager.Suspend boolean:false',
    hibernate: 'dbus-send --system --print-reply --dest="org.freedesktop.login1" /org/freedesktop/login1 org.freedesktop.login1.Manager.Hibernate boolean:false'
  },
  darwin: {
    shutdown: 'osascript -e "tell application \\"System Events\\" to shut down"',
    restart: 'osascript -e "tell application \\"System Events\\" to restart"',
    suspend: 'osascript -e "tell application \\"System Events\\" to sleep"'
  }
};
var locale = {
  windows: 'Windows XP/Vista/7/8/10',
  linux: 'GNU/Linux (systemd)',
  darwin: 'Mac OS X',
  shutdown: 'Shutdown',
  restart: 'Restart',
  suspend: 'Suspend',
  hibernate: 'Hibernate',
  logout: 'Logout'
};
