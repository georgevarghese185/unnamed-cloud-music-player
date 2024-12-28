/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

import EventEmitter from 'events';

const emitter = new EventEmitter();
const mainEvents = {};

module.exports = {
  ipcRenderer: {
    invoke(channel, ...args) {
      return mainEvents[channel](
        {
          sender: {
            send: emitter.emit.bind(emitter),
          },
        },
        ...args,
      );
    },
    off: emitter.off.bind(emitter),
    on(channel, handler) {
      emitter.on(channel, (...args) => {
        handler({}, ...args);
      });
    },
    send: emitter.emit.bind(emitter),
  },
  ipcMain: {
    handle(channel, handler) {
      mainEvents[channel] = handler;
    },
    off: emitter.off.bind(emitter),
    on(channel, handler) {
      emitter.on(channel, (...args) => {
        handler({}, ...args);
      });
    },
    once(channel, handler) {
      emitter.once(channel, (...args) => {
        handler({}, ...args);
      });
    },
  },
};
