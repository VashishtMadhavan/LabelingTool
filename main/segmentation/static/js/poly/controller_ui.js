// Main control logic for the UI.  Actions in this class delegate through
// undo/redo and check whether something is feasible.
class ControllerUI {
  constructor(args) {
    this.get_submit_data = this.get_submit_data.bind(this);
    this.set_photo = this.set_photo.bind(this);
    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);
    this.blur = this.blur.bind(this);
    this.wheel = this.wheel.bind(this);
    this.zoom_reset = this.zoom_reset.bind(this);
    this.click = this.click.bind(this);
    this.mousedown = this.mousedown.bind(this);
    this.mouseup = this.mouseup.bind(this);
    this.mousemove = this.mousemove.bind(this);
    this.update = this.update.bind(this);
    this.close_poly = this.close_poly.bind(this);
    this.select_poly = this.select_poly.bind(this);
    this.unselect_poly = this.unselect_poly.bind(this);
    this.remove_open_poly = this.remove_open_poly.bind(this);
    this.delete_sel_poly = this.delete_sel_poly.bind(this);
    this.start_drag_point = this.start_drag_point.bind(this);
    this.revert_drag_point = this.revert_drag_point.bind(this);
    this.progress_drag_point = this.progress_drag_point.bind(this);
    this.finish_drag_point = this.finish_drag_point.bind(this);
    this.drag_valid = this.drag_valid.bind(this);
    this.toggle_mode = this.toggle_mode.bind(this);
    this.on_photo_loaded = this.on_photo_loaded.bind(this);
    this.s = new ControllerState(this, args);

    // disable right click
    $(document).on('contextmenu', e => {
      this.click(e);
      return false;
    });

    // capture all clicks and disable text selection
    $(document)
      .on('click', this.click)
      .on('mousedown', this.mousedown)
      .on('mouseup', this.mouseup)
      .on('mousemove', this.mousemove)
      .on('selectstart', () => false);

    // init buttons
    $(this.s.btn_draw).on('click', () => {
      if (!this.s.draw_mode) { return this.toggle_mode(); }
  });
    $(this.s.btn_edit).on('click', () => {
      if (this.s.draw_mode) { return this.toggle_mode(); }
  });
    $(this.s.btn_close).on('click', () => {
      if (!this.s.loading) { return this.close_poly(); }
  });
    $(this.s.btn_delete).on('click', () => {
      if (!this.s.loading) { return this.delete_sel_poly(); }
  });
    $(this.s.btn_zoom_reset).on('click', () => {
      if (!this.s.loading) { return this.zoom_reset(); }
  });

    // log instruction viewing
    $('#modal-instructions').on('show', () => {
      return this.s.log.action({name: "ShowInstructions"});
    });
    $('#modal-instructions').on('hide', () => {
      return this.s.log.action({name: "HideInstructions"});
    });

    // keep track of modal state
    // (since we want to allow scrolling)
    $('.modal').on('show', () => {
      this.s.modal_count += 1;
      return true;
    });
    $('.modal').on('hide', () => {
      this.s.modal_count -= 1;
      return true;
    });

    // listen for scrolling
    $(window).on('mousewheel DOMMouseScroll', this.wheel);

    // listen for translation
    $(window)
      //.on('keydown', @keydown)
      .on('keyup', this.keyup)
      .on('blur', this.blur);

    // keep track of invalid close attempts to show a
    // popup explaining the problem
    this.num_failed_closes = 0;

    // init photo
    if (args.photo_url != null) { this.set_photo(args.photo_url); }
  }

  get_submit_data() {
    return this.s.get_submit_data();
  }

  set_photo(photo_url) {
    this.s.disable_buttons();
    this.s.loading = true;
    return this.s.stage_ui.set_photo(photo_url, this, () => {
      console.log(`loaded photo_url: ${photo_url}`);
      this.s.loading = false;
      return this.s.update_buttons();
    });
  }

  keydown(e) {
    if (this.s.modal_count > 0) { return true; }
    switch (e.keyCode) {
      case 37: // left
        this.s.translate_delta(-20, 0);
        return false;
      case 38: // up
        this.s.translate_delta(0, -20);
        return false;
      case 39: // right
        this.s.translate_delta(20, 0);
        return false;
      case 40: // down
        this.s.translate_delta(0, 20);
        return false;
      case 32: // space
        this.s.panning = true;
        this.s.update_cursor();
        return false;
      case 68: // D
        if (!this.s.draw_mode) { this.toggle_mode(); }
        return false;
      case 65: // A
        if (this.s.draw_mode) { this.toggle_mode(); }
        return false;
      case 46:case 8: // delete,backspace
        if (this.s.draw_mode) {
          this.remove_open_poly();
        } else {
          this.delete_sel_poly();
        }
        return false;
      case 27: // esc
        if (this.s.draw_mode) {
          this.s.zoom_reset();
        } else {
          this.unselect_poly();
        }
        return false;
      default:
        return true;
    }
  }

  keyup(e) {
    this.s.panning = false;
    if (this.s.modal_count > 0) { return true; }
    this.s.update_cursor();
    return true;
  }

  blur(e) {
    this.s.panning = false;
    this.s.mousedown = false;
    if (this.s.modal_count > 0) { return true; }
    this.s.update_cursor();
    return true;
  }

  wheel(e) {
    if (this.s.modal_count > 0) { return true; }
    let oe = e.originalEvent;
    if (oe.wheelDelta != null) {
      this.s.zoom_delta(oe.wheelDelta);
    } else {
      this.s.zoom_delta(oe.detail * -60);
    }
    window.scrollTo(0, 0);
    return stop_event(e);
  }

  zoom_reset(e) {
    return this.s.zoom_reset();
  }

  click(e) {
    if (this.s.panning) { return; }
    let p = this.s.mouse_pos();
    if ((p == null)) { return; }
    if (!this.s.loading && this.s.draw_mode) {
      if (e.button > 1) {
        return this.close_poly();
      } else {
        if (this.s.open_poly != null) {
          let ue = new UEPushPoint(p);
          if (this.s.open_poly.poly.can_push_point(p)) {
            this.s.undoredo.run(ue);
          } else {
            this.s.log.attempted(ue.entry());
          }
        } else {
          this.s.undoredo.run(new UECreatePolygon(
            this.s.stage_ui.mouse_pos()));
        }
        return this.s.stage_ui.translate_mouse_click();
      }
    }
  }

  mousedown(e) {
    if (this.s.modal_count > 0) { return true; }
    this.s.mousedown = true;
    this.s.mousepos = {x: e.pageX, y: e.pageY};
    this.s.update_cursor();
    return !this.s.panning;
  }

  mouseup(e) {
    this.s.mousedown = false;
    if (this.s.modal_count > 0) { return true; }
    this.s.update_cursor();
    return !this.s.panning;
  }

  mousemove(e) {
    if (this.s.modal_count > 0) { return true; }
    if (this.s.mousedown && this.s.panning) {
      let scale = 1.0 / this.s.stage_ui.get_zoom_factor();
      this.s.stage_ui.translate_delta(
        scale * (this.s.mousepos.x - e.pageX),
        scale * (this.s.mousepos.y - e.pageY),
        false);
      this.s.mousepos = {x: e.pageX, y: e.pageY};
    }
    return true;
  }

  update() {
    if (this.s.open_poly != null) {
      this.s.open_poly.update(this);
    }
    return (this.s.sel_poly != null ? this.s.sel_poly.update(this) : undefined);
  }

  close_poly() { if (!this.s.loading) {
    let ue = new UEClosePolygon();
    if (this.s.can_close()) {
      return this.s.undoredo.run(ue);
    } else {
      this.s.log.attempted(ue.entry());
      if (this.s.open_poly != null) {
        let pts = this.s.open_poly.poly.points;
        if (pts.length >= 2) {
          this.s.stage_ui.error_line(pts[0], pts[pts.length - 1]);
          this.num_failed_closes += 1;
        }
      }

      if (this.num_failed_closes >= 3) {
        this.num_failed_closes = 0;
        return $('#poly-modal-intersect').modal('show');
      }
    }
  } }

  select_poly(id) {
    return this.s.undoredo.run(new UESelectPolygon(id));
  }

  unselect_poly(id) {
    return this.s.undoredo.run(new UEUnselectPolygon());
  }

  remove_open_poly(id) {
    return this.s.undoredo.run(new UERemoveOpenPoly());
  }

  delete_sel_poly() {
    let ue = new UEDeletePolygon();
    if (this.s.can_delete_sel()) {
      return this.s.undoredo.run(ue);
    } else {
      return this.s.log.attempted(ue.entry());
    }
  }

  start_drag_point(i) {
    let p = this.s.sel_poly.poly.get_pt(i);
    this.s.drag_valid_point = clone_pt(p);
    return this.s.drag_start_point = clone_pt(p);
  }

  revert_drag_point(i) {
    return this.s.undoredo.run(new UEDragVertex(i,
      this.s.drag_start_point, this.s.drag_valid_point));
  }

  progress_drag_point(i, p) {
    this.s.sel_poly.poly.set_point(i, p);
    if (this.drag_valid(i)) { return this.s.drag_valid_point = clone_pt(p); }
  }

  finish_drag_point(i, p) {
    this.s.undoredo.run(new UEDragVertex(i, this.s.drag_start_point, p));
    this.s.drag_valid_point = null;
    return this.s.drag_start_point = null;
  }

  drag_valid(i) {
    return !this.s.sel_poly.poly.self_intersects_at_index(i);
  }

  toggle_mode() {
    return this.s.undoredo.run(new UEToggleMode());
  }

  on_photo_loaded() {
    this.s.update_buttons();
    return this.s.stage_ui.init_events();
  }
}
