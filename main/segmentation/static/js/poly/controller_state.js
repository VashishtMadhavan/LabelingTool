// Holds UI state; when something is modified, any dirty items are returned.
// an instance of this is held by ControllerUI
class ControllerState {
  constructor(ui, args) {
    this.get_submit_data = this.get_submit_data.bind(this);
    this.draw = this.draw.bind(this);
    this.mouse_pos = this.mouse_pos.bind(this);
    this.zoom_delta = this.zoom_delta.bind(this);
    this.zoom_reset = this.zoom_reset.bind(this);
    this.update_zoom = this.update_zoom.bind(this);
    this.get_zoom_factor = this.get_zoom_factor.bind(this);
    this.translate_delta = this.translate_delta.bind(this);
    this.can_close = this.can_close.bind(this);
    this.unselect_poly = this.unselect_poly.bind(this);
    this.ui = ui;
    this.loading = true;

    // save id for get_submit_data
    if (args.photo_id != null) { this.photo_id = args.photo_id; }

    // action log and undo/redo
    this.undoredo = new UndoRedo(this.ui, args);
    this.log = new ActionLog();
    this.log.action($.extend(true, {name:'init'}, args));

    // true: draw, false: adjust
    this.draw_mode = true;

    // enabled when shift is held to drag the viewport around
    this.panning = false;

    // mouse state (w.r.t document page)
    this.mousedown = false;
    this.mousepos = null;

    // if true, the user was automagically zoomed in
    // after clicking on a polygon
    this.zoomed_adjust = false;

    // if nonzero, a modal is visible
    this.modal_count = 0;

    // buttons
    this.btn_draw = (args.btn_draw != null) ? args.btn_draw : '#btn-draw';
    this.btn_edit = (args.btn_edit != null) ? args.btn_edit : '#btn-edit';
    this.btn_close = (args.btn_close != null) ? args.btn_close : '#btn-close';
    this.btn_submit = (args.btn_submit != null) ? args.btn_submit : '#btn-submit';
    this.btn_reject = (args.btn_reject != null) ? args.btn_reject : '#btn-reject';
    this.btn_delete = (args.btn_delete != null) ? args.btn_delete : '#btn-delete';
    this.btn_zoom_reset = (args.btn_zoom_reset != null) ? args.btn_zoom_reset : '#btn-zoom-reset';

    // gui elements
    this.stage_ui = new StageUI(this.ui, args);
    this.closed_polys = [];  // PolygonUI elements
    this.open_poly = null;
    this.sel_poly = null;
    this.saved_point = null;  // start of drag

    //if this is the review module and we have labels
    this.labs = window.labels.slice();
    window.labels = [];
    for (let lab of Array.from(this.labs)) {
      let temp = $('<li align="center">').text(lab);
      $("#labels").append(temp);
      window.labels.push(temp);
    }


    //for review module --> if there are already segmented items add them to the canvas
    for (let coords of Array.from(window.coords)) {
      for (let index = 0; index < coords.length; index++) {
        let value = coords[index];
        coords[index]['x'] = coords[index]['x'] * template_args.width;
        coords[index]['y'] = coords[index]['y'] * template_args.height;
      }
      this.create_poly(coords);
      this.open_poly.time_ms = this.open_poly.timer.time_ms();
      this.open_poly.time_active_ms = this.open_poly.timer.time_active_ms();
      let poly = this.open_poly;
      this.open_poly.poly.close();
      this.open_poly.remove_anchors();
      this.closed_polys.push(this.open_poly);
      this.open_poly = null;
      this.update_buttons();
    }
    this.zoom_reset();
  }
  // return data that will be submitted
  get_submit_data() {
    let p;
    let results_list = [];
    let label_list = [];
    for (let poly of Array.from(this.closed_polys)) {
      let points_scaled = [];
      for (p of Array.from(poly.poly.points)) {
        points_scaled.push(Math.max(0, Math.min(1,
          p.x / this.stage_ui.size.width)));
        points_scaled.push(Math.max(0, Math.min(1,
          p.y / this.stage_ui.size.height)));
      }
      results_list.push(points_scaled);
    }

    for (let lab of Array.from(window.labels)) {
      label_list.push(lab[0].innerText);
    }

    let results = {};
    let labs  = {};
    let time_ms = {};
    let time_active_ms = {};
    results[this.photo_id] = results_list;
    labs[this.photo_id] = label_list;
    time_ms[this.photo_id] = ((() => {
      let result = [];
      for (p of Array.from(this.closed_polys)) {         result.push(p.time_ms);
      }
      return result;
    })());
    time_active_ms[this.photo_id] = ((() => {
      let result1 = [];
      for (p of Array.from(this.closed_polys)) {         result1.push(p.time_active_ms);
      }
      return result1;
    })());

    return {
      version: '1.0',
      results: JSON.stringify(results),
      labs: JSON.stringify(labs),
      time_ms: JSON.stringify(time_ms),
      time_active_ms: JSON.stringify(time_active_ms),
      action_log: this.log.get_submit_data()
    };
  }

  // redraw the stage
  draw() { return this.stage_ui.draw(); }

  // get mouse position (after taking zoom into account)
  mouse_pos() { return this.stage_ui.mouse_pos(); }

  // zoom in/out by delta
  zoom_delta(delta) {
    this.zoomed_adjust = false;
    this.stage_ui.zoom_delta(delta);
    this.update_buttons();
    return this.update_zoom();
  }

  // reset to 1.0 zoom
  zoom_reset() {
    this.zoomed_adjust = false;
    this.stage_ui.zoom_reset();
    this.update_buttons();
    return this.update_zoom();
  }

  update_zoom(redraw) {
    if (redraw == null) { redraw = true; }
    let inv_f = 1.0 / this.stage_ui.get_zoom_factor();
    for (let poly of Array.from(this.closed_polys)) {
      poly.update_zoom(this.ui, inv_f, false);
    }
    if (this.open_poly != null) {
      this.open_poly.update_zoom(this.ui, inv_f, false);
    }
    if (this.sel_poly != null) {
      this.sel_poly.add_anchors(this.ui);
    }
    if (redraw) {
      return this.draw();
    }
  }

  get_zoom_factor() {
    return this.stage_ui.get_zoom_factor();
  }

  translate_delta(x, y) {
    return this.stage_ui.translate_delta(x, y);
  }

  // add a point to the current polygon at point p
  push_point(p) {
    if (this.open_poly != null) {
      this.open_poly.poly.push_point(p);
    }
    return this.open_poly;
  }

  // delete the last point on the open polygon
  pop_point() {
    if (this.open_poly != null) {
      this.open_poly.poly.pop_point();
    }
    return this.open_poly;
  }

  // get the location of point i on polygon id
  get_pt(id, i) {
    return __guard__(this.get_poly(id), x => x.poly.get_pt(i));
  }

  // add an open polygon using points
  create_poly(points) {
    console.log('create_poly:');
    console.log(points);
    if (this.open_poly != null) { this.open_poly.remove_all(); }
    let poly = new Polygon(points);
    this.open_poly = new PolygonUI(this.closed_polys.length, poly, this.stage_ui);
    this.open_poly.timer = new ActiveTimer();
    this.open_poly.timer.start();
    this.update_buttons();
    return this.open_poly;
  }

  // add a closed polygon in the specified slot
  insert_closed_poly(points, id, time_ms, time_active_ms) {
    let poly = new Polygon(points);
    poly.close();
    let closed_poly = new PolygonUI(id, poly, this.stage_ui);
    closed_poly.time_ms = time_ms;
    closed_poly.time_active_ms = time_active_ms;
    this.closed_polys.splice(id, 0, closed_poly);
    this.update_buttons();
    return closed_poly;
  }

  // return polygon id
  get_poly(id) {
    for (let p of Array.from(this.closed_polys)) {
      if (p.id === id) {
        return p;
      }
    }
    return null;
  }

  // return number of polygons
  num_polys() { return this.closed_polys.length; }

  // delete the open polygon
  remove_open_poly() {
    if (this.open_poly != null) {
      this.open_poly.remove_all();
    }
    return this.open_poly = null;
  }

  // close the open polygon
  close_poly() {
    if (this.open_poly != null) {
      this.open_poly.time_ms = this.open_poly.timer.time_ms();
      this.open_poly.time_active_ms = this.open_poly.timer.time_active_ms();
      let poly = this.open_poly;
      this.open_poly.poly.close();
      this.open_poly.remove_anchors();
      this.closed_polys.push(this.open_poly);
      this.open_poly = null;
      this.update_buttons();
      window.show_modal_form({
        label: "Label this Segment",
        body: window.labelHTML,
        yes() {
          let temp = $('<li align="center">').text($('#label_list :selected').text());
          $("#labels").append(temp);
          return window.labels.push(temp);
        }
      });
      // maybe add some update call buttons here
      return poly;
    } else {
      return null;
    }
  }

  can_close() {
    if (!this.loading && (this.open_poly != null)) {
      if ((window.min_vertices != null) && (this.open_poly.poly.num_points() < window.min_vertices)) {
        return false;
      }
      return this.open_poly.poly.can_close();
    } else {
      return false;
    }
  }

  // re-open the most recently closed polygon
  unclose_poly() {
    if (this.draw_mode && (this.open_poly == null) && (this.num_polys() > 0)) {
      this.open_poly = this.closed_polys.pop();
      window.labels.pop();
      $("#labels").children().eq(-1).remove();
      this.open_poly.poly.unclose();
      this.update_buttons();
      return this.open_poly;
    } else {
      return null;
    }
  }

  // true if the selected polygon can be deleted
  can_delete_sel() {
    return !this.loading && !this.draw_mode && (this.sel_poly != null) && (this.num_polys() > 0);
  }

  // delete the currently selected polygon
  delete_sel_poly() {
    if (this.can_delete_sel()) {
      for (let i = 0; i < this.closed_polys.length; i++) {
        let p = this.closed_polys[i];
        if (p.id === this.sel_poly.id) {
          this.closed_polys.splice(i, 1);
          $("#labels").children().eq(i + 2).remove();
          window.labels.splice(i, 1);
          if (this.sel_poly != null) {
            this.sel_poly.remove_all();
          }
          this.sel_poly = null;
          break;
        }
      }
      if (this.zoomed_adjust) { this.zoom_reset(); }
      this.update_buttons();
      return null;
    } else {
      return null;
    }
  }

  // select the specified polygon
  select_poly(ui, id) {
    if (this.draw_mode) { return; }
    if (this.sel_poly != null) {
      if (this.sel_poly.id === id) { return; }
      this.unselect_poly(false);
    }
    this.sel_poly = this.get_poly(id);
    this.sel_poly.add_anchors(ui);
    this.stage_ui.zoom_box(this.sel_poly.poly.get_aabb());
    this.zoomed_adjust = true;
    this.update_buttons();
    this.update_zoom(false);
    this.draw();
    return this.sel_poly;
  }

  unselect_poly(reset_zoomed_adjust) {
    if (reset_zoomed_adjust == null) { reset_zoomed_adjust = true; }
    if (this.sel_poly != null) {
      this.sel_poly.remove_anchors();
    }
    this.sel_poly = null;
    if (reset_zoomed_adjust && this.zoomed_adjust) {
      this.zoom_reset();
    }
    this.update_buttons();
    return null;
  }

  toggle_mode() {
    this.draw_mode = !this.draw_mode;
    if (this.draw_mode) {
      if (this.sel_poly != null) {
        this.unselect_poly();
      }
    } else {
      if (this.open_poly != null) {
        this.remove_open_poly();
      }
    }
    return this.update_buttons();
  }

  disable_buttons() {
    set_btn_enabled(this.btn_draw, false);
    set_btn_enabled(this.btn_edit, false);
    set_btn_enabled(this.btn_close, false);
    set_btn_enabled(this.btn_submit, false);
    return set_btn_enabled(this.btn_reject, false);
  }

  // update cursor only
  update_cursor() {
    if (this.panning) {
      if ($.browser.webkit) {
        if (this.mousedown) {
          return $('canvas').css('cursor', '-webkit-grabing');
        } else {
          return $('canvas').css('cursor', '-webkit-grab');
        }
      } else {
        if (this.mousedown) {
          return $('canvas').css('cursor', '-moz-grabing');
        } else {
          return $('canvas').css('cursor', '-moz-grab');
        }
      }
    } else if (this.draw_mode) {
      return $('canvas').css('cursor', 'crosshair');
    } else {
      return $('canvas').css('cursor', 'default');
    }
  }

  // update buttons and cursor
  update_buttons() {
    this.update_cursor();
    let enable_submit = ((window.min_shapes == null) ||
      (this.num_polys() >= window.min_shapes));
    set_btn_enabled(this.btn_submit, enable_submit);
    set_btn_enabled(this.btn_reject, enable_submit);
    set_btn_enabled(this.btn_draw, !this.loading);
    set_btn_enabled(this.btn_edit, !this.loading);
    set_btn_enabled(this.btn_delete, this.can_delete_sel());
    set_btn_enabled(this.btn_zoom_reset,
      !this.loading && (this.stage_ui.zoom_exp > 0));
    if (this.draw_mode) {
      $(this.btn_draw).button('toggle');
      return set_btn_enabled(this.btn_close, this.can_close());
    } else {
      $(this.btn_edit).button('toggle');
      return set_btn_enabled(this.btn_close, false);
    }
  }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}