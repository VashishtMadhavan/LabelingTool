class UndoRedo {
  constructor(ui, args) {
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.ui = ui;
    this.btn_undo = (args.btn_undo != null) ? args.btn_undo : '#btn-undo';
    this.btn_redo = (args.btn_redo != null) ? args.btn_redo : '#btn-redo';

    this.undo_stack = [];
    this.redo_stack = [];

    // map events
    if (this.btn_undo != null) { $(this.btn_undo).on('click', () => this.undo()); }
    if (this.btn_redo != null) { $(this.btn_redo).on('click', () => this.redo()); }
    $(document).bind('keydown.ctrl_z', () => this.undo());
    $(document).bind('keydown.meta_z', () => this.undo());
    $(document).bind('keydown.ctrl_y', () => this.redo());
    $(document).bind('keydown.meta_y', () => this.redo());
  }

  run(e) { if (e != null) {
    e.run(this.ui);
    this.undo_stack.push(e);
    this.redo_stack = [];
    this.ui.s.log.action(e.entry());
    this.update_buttons();
  } }

  undo() {
    if (this.can_undo()) {
      let e = this.undo_stack.pop();
      e.undo(this.ui);
      this.redo_stack.push(e);
      this.ui.s.log.action({name: 'UndoRedo.undo', event: e});
      this.update_buttons();
    } else {
      this.ui.s.log.attempted({name: 'UndoRedo.undo'});
    }
  }

  redo() {
    if (this.can_redo()) {
      let e = this.redo_stack.pop();
      e.redo(this.ui);
      this.undo_stack.push(e);
      this.ui.s.log.action({name: 'UndoRedo.redo', event: e});
      this.update_buttons();
    } else {
      this.ui.s.log.attempted({name: 'UndoRedo.redo'});
    }
  }

  can_undo() { return this.undo_stack.length > 0; }
  can_redo() { return this.redo_stack.length > 0; }

  update_buttons() {
    this.ui.s.update_buttons();
    if (this.btn_undo != null) { set_btn_enabled(this.btn_undo, this.can_undo()); }
    if (this.btn_redo != null) { set_btn_enabled(this.btn_redo, this.can_redo()); }
  }
}


class ActionLog {
  constructor() {
    this.action = this.action.bind(this);
    this.attempted = this.attempted.bind(this);
    this.get_submit_data = this.get_submit_data.bind(this);
    this.entries = [];
  }

  // successfully performed action
  action(args) {
    let entry = $.extend(true, {time: new Date(), done: true}, args);
    this.entries.push(entry);
  }

  // invalid action
  attempted(args) {
    let entry = $.extend(true, {time: new Date(), done: false}, args);
    this.entries.push(entry);
  }

  get_submit_data() {
    return JSON.stringify(this.entries);
  }
}
