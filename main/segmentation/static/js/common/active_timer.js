// Timer that stops counting when the user leaves the window
class ActiveTimer {
  constructor() {
    this.started = false;
    this.total_start = null;
    this.active_start = null;
    this.partial_time_ms = 0;

    $(window).on('focus', () => {
      if (this.started) {
        this.active_start = Date.now();
      }
    });

    $(window).on('blur', () => {
      if (this.started && (this.active_start != null)) {
        this.partial_time_ms += Date.now() - this.active_start;
      }
      this.active_start = null;
    });
  }

  start() {
    this.total_start = Date.now();
    this.active_start = Date.now();
    this.partial_time_ms = 0;
    this.started = true;
  }

  ensure_started() {
    if (!this.started) {  this.start(); }
  }

  time_ms() {
    if (this.started) {
      return Date.now() - this.total_start;
    } else {
      return 0;
    }
  }

  time_active_ms() {
    if (this.started) {
      if (this.active_start != null) {
        return this.partial_time_ms + (Date.now() - this.active_start);
      } else {
        return this.partial_time_ms;
      }
    } else {
      return 0;
    }
  }
}
