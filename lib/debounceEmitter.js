'use strict';

class DebounceEmitter {
  constructor(listener, timeout = 100) {
    this.events = new Set();
    this.listener = listener;
    this.timeout = timeout;
  }

  runListener(uniqueEvent, fileEvent, ...args) {
    this.events.add(uniqueEvent);
    setTimeout(() => {
      this.listener(fileEvent, ...args);
      this.events.delete(uniqueEvent);
    }, this.timeout);
  }

  emit(uniqueEvent, fileEvent, ...args) {
    if (!this.events.has(uniqueEvent)) {
      this.runListener(uniqueEvent, fileEvent, ...args);
    }
  }
}

module.exports = DebounceEmitter;
