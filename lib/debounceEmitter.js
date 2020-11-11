'use strict';

class DebounceEmitter {
  constructor(listener, timeout = 100) {
    this.events = new Set();
    this.listener = listener;
    this.timeout = timeout;
  }

  runListener(event, ...args) {
    this.events.add(event);
    setTimeout(() => {
      this.listener(...args);
      this.events.delete(event);
    }, this.timeout);
  }

  emit(event, ...args) {
    if (!this.events.has(event)) {
      this.runListener(event, ...args);
    }
  }
}

module.exports = DebounceEmitter;
