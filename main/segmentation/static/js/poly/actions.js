// Control encapsulated into UndoableEvent objects
class UEToggleMode {
  constructor() {
    this.open_points = null;
    this.sel_poly_id = null;
  }

  run(ui) {
    if (ui.s.draw_mode) {
      if (ui.s.open_poly != null) {
        this.open_points = ui.s.open_poly.poly.clone_points();
      }
    } else {
      this.sel_poly_id = ui.s.sel_poly != null ? ui.s.sel_poly.id : undefined;
    }
    ui.s.toggle_mode();
    return ui.s.update_buttons();
  }

  redo(ui) {
    ui.s.toggle_mode();
    return ui.s.update_buttons();
  }

  undo(ui) {
    ui.s.toggle_mode();
    if (ui.s.draw_mode) {
      if (this.open_points != null) {
        return __guard__(ui.s.create_poly(this.open_points), x => x.update(ui));
      }
    } else {
      if (this.sel_poly_id != null) {
        return __guard__(ui.s.select_poly(ui, this.sel_poly_id), x1 => x1.update(ui));
      }
    }
  }

  entry() { return { name: "UEToggleMode" }; }
}

class UERemoveOpenPoly {
  constructor() {
    this.open_points = null;
  }

  run(ui) {
    if (ui.s.open_poly != null) {
      this.open_points = ui.s.open_poly.poly.clone_points();
    }
    ui.s.remove_open_poly();
    return ui.s.update_buttons();
  }

  redo(ui) {
    ui.s.remove_open_poly();
    return ui.s.update_buttons();
  }

  undo(ui) {
    if (this.open_points != null) {
      return __guard__(ui.s.create_poly(this.open_points), x => x.update(ui));
    }
  }

  entry() { return { name: "UERemoveOpenPoly" }; }
}

class UEPushPoint {
  constructor(p) { this.p = clone_pt(p); }
  run(ui) { return __guard__(ui.s.push_point(this.p), x => x.update(ui)); }
  undo(ui) { return __guard__(ui.s.pop_point(), x => x.update(ui)); }
  entry() { return { name: "UEPushPoint", args: { p: this.p } }; }
}

class UECreatePolygon {
  constructor(p) { this.p = clone_pt(p); }
  run(ui) { return __guard__(ui.s.create_poly([this.p]), x => x.update(ui)); }
  undo(ui) { return __guard__(ui.s.remove_open_poly(), x => x.update(ui)); }
  entry() { return { name: "UECreatePolygon", args: { p: this.p } }; }
}

class UEClosePolygon {
  run(ui) { return __guard__(ui.s.close_poly(), x => x.update(ui)); }
  undo(ui) { return __guard__(ui.s.unclose_poly(), x => x.update(ui)); }
  entry() { return { name: "UEClosePolygon" }; }
}

class UESelectPolygon {
  constructor(id) {
    this.id = id;
  }
  run(ui) {
    this.sel_poly_id = ui.s.sel_poly != null ? ui.s.sel_poly.id : undefined;
    return ui.s.select_poly(ui, this.id);
  }
  undo(ui) {
    if (this.sel_poly_id != null) {
      return ui.s.select_poly(ui, this.sel_poly_id);
    } else {
      return ui.s.unselect_poly();
    }
  }
  redo(ui) {
    return ui.s.select_poly(ui, this.id);
  }
  entry() { return { name: "UESelectPolygon", args: { id: this.id } }; }
}

class UEUnselectPolygon {
  constructor() {}
  run(ui) {
    this.sel_poly_id = ui.s.sel_poly != null ? ui.s.sel_poly.id : undefined;
    return ui.s.unselect_poly();
  }
  undo(ui) {
    if (this.sel_poly_id != null) {
      return ui.s.select_poly(ui, this.sel_poly_id);
    }
  }
  redo(ui) {
    return ui.s.unselect_poly();
  }
  entry() { return { name: "UEUnselectPolygon" }; }
}

class UEDeletePolygon {
  run(ui) {
    this.points = ui.s.sel_poly.poly.clone_points();
    this.time_ms = ui.s.sel_poly.time_ms;
    this.time_active_ms = ui.s.sel_poly.time_active_ms;
    this.sel_poly_id = ui.s.sel_poly.id;
    ui.s.delete_sel_poly();
    return Array.from(ui.s.closed_polys).map((p, i) =>
      ((p.id = i),
      p.update(ui)));
  }
  undo(ui) {
    ui.s.insert_closed_poly(this.points, this.sel_poly_id,
      this.time_ms, this.time_active_ms);
    for (let i = 0; i < ui.s.closed_polys.length; i++) {
      let p = ui.s.closed_polys[i];
      p.id = i;
      p.update(ui);
    }
    return ui.s.select_poly(ui, this.sel_poly_id);
  }
  entry() { return { name: "UEDeletePolygon" }; }
}

class UEDragVertex {
  constructor(i, p0, p1) {
    this.i = i;
    this.p0 = clone_pt(p0);
    this.p1 = clone_pt(p1);
  }
  run(ui) {
    let sp = ui.s.sel_poly;
    sp.poly.set_point(this.i, this.p1);
    sp.anchors[this.i].setPosition(this.p1.x, this.p1.y);
    return sp.update(ui);
  }
  undo(ui) {
    let sp = ui.s.sel_poly;
    sp.poly.set_point(this.i, this.p0);
    sp.anchors[this.i].setPosition(this.p0.x, this.p0.y);
    return sp.update(ui);
  }
  entry() { return { name: "UEDragVertex", args: { i: this.i, p0: this.p0, p1: this.p1 } }; }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}