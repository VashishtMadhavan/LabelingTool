// UI for one polygon
class PolygonUI {
  constructor(id, poly, stage) {
    // @stage is an instance of StageUI
    this.id = id;
    this.poly = poly;
    this.stage = stage;
    this.line = null;
    this.fill = null;
    this.text = null;
    this.hover_line = null;
    this.hover_fill = null;
    this.anchors = null;
    this.temp_anchors = null;
    this.stroke_scale = 1.0 / this.stage.get_zoom_factor();
    this.radius = 4;
  }

  // update stroke scale
  update_zoom(ui, inv_zoom_factor, redraw) {
    if (redraw == null) { redraw = true; }
    this.stroke_scale = inv_zoom_factor;
    return this.update(ui, redraw);
  }

  // update UI elements
  update(ui, redraw) {
    if (redraw == null) { redraw = true; }
    if (this.poly.open) {
      this.remove_fill();
      this.remove_text();
      this.add_anchors(ui);
      this.add_line();
      let p = this.stage.mouse_pos();
      if ((p != null) && !this.poly.empty()) {
        this.add_hover(p);
      } else {
        this.remove_hover();
      }
    } else {
      this.remove_hover();
      this.remove_line();
      this.add_fill(ui);
      this.add_text();
    }
    if (redraw) {
      return this.stage.draw();
    }
  }

  // remove UI elements
  remove_line() { this.stage.remove(this.line); return this.line = null; }
  remove_fill() { this.stage.remove(this.fill); return this.fill = null; }
  remove_text() { this.stage.remove(this.text); return this.text = null; }
  remove_hover() {
    this.stage.remove(this.hover_fill); this.hover_fill = null;
    this.stage.remove(this.hover_line); return this.hover_line = null;
  }
  remove_anchors() { if (this.anchors != null) {
    let a;
    if (this.anchors.length < 8) {
      for (a of Array.from(this.anchors)) {
        this.stage.remove(a, 0.4);
      }
    } else {
      for (a of Array.from(this.anchors)) {
        this.stage.remove(a, 0);
      }
    }
    this.anchors = null;
    return this.stage.draw();
  } }
  remove_all() {
    this.remove_line();
    this.remove_fill();
    this.remove_text();
    this.remove_hover();
    return this.remove_anchors();
  }

  // add polygon fill
  add_fill(ui){
    if (this.fill != null) {
      this.fill.setPoints(this.poly.points);
      return this.fill.setStrokeWidth(2 * this.stroke_scale);
    } else {
      this.fill = new Kinetic.Polygon({
        points: this.poly.points,
        fill: POLYGON_COLORS[this.id % POLYGON_COLORS.length],
        stroke: '#007', strokeWidth: 2 * this.stroke_scale,
        lineJoin: 'round'});
      this.fill.on('click', () => {
        if (!ui.s.panning) {
          return ui.select_poly(this.id);
        }
      });
      return this.stage.add(this.fill, 0.4);
    }
  }

  // add text label
  add_text() {
    let cen = this.poly.labelpos();
    let label = String(this.id + 1);
    let pos = {
      x: cen.x - (5 * label.length * this.stroke_scale),
      y: cen.y - (5 * this.stroke_scale)
    };
    if (this.text != null) {
      this.text.setPosition(pos);
      this.text.setText(label);
      return this.text.setFontSize(10 * this.stroke_scale);
    } else {
      this.text = new Kinetic.Text({
        text: label, fill: '#000',
        x: pos.x, y: pos.y, align: 'left',
        fontSize: 10 * this.stroke_scale,
        fontFamily: 'Verdana', fontStyle: 'bold'});
      return this.stage.add(this.text, 1.0);
    }
  }

  add_line() {
    if (this.line != null) {
      this.line.setPoints(this.poly.points);
      return this.line.setStrokeWidth(3 * this.stroke_scale);
    } else {
      this.line = new Kinetic.Line({
        points: this.poly.points, opacity: 0, stroke: "#00F",
        strokeWidth: 3 * this.stroke_scale, lineJoin: "round"});
      return this.stage.add(this.line, 0.5);
    }
  }

  add_hover(p) {
    this.add_hover_fill(p);
    return this.add_hover_line(p);
  }

  add_hover_fill(p) {
    let hover_points = this.poly.points.concat([clone_pt(p)]);
    if (this.hover_fill != null) {
      return this.hover_fill.setPoints(hover_points);
    } else {
      this.hover_fill = new Kinetic.Polygon({
        points: hover_points, opacity: 0, fill: "#00F"});
      return this.stage.add(this.hover_fill, 0.15);
    }
  }

  add_hover_line(p) {
    let hover_points = [clone_pt(p), this.poly.points[this.poly.num_points() - 1]];
    if (this.hover_line != null) {
      this.hover_line.setPoints(hover_points);
      this.hover_line.setStrokeWidth(3 * this.stroke_scale);
    } else {
      this.hover_line = new Kinetic.Line({
        points: hover_points, opacity: 0, stroke: "#00F",
        strokeWidth: 3 * this.stroke_scale, lineCap: "round"});
      this.stage.add(this.hover_line, 0.5);
    }

    if (this.poly.can_push_point(p)) {
      this.hover_line.setStroke("#00F");
      return this.hover_line.setStrokeWidth(3 * this.stroke_scale);
    } else {
      this.hover_line.setStroke("#F00");
      return this.hover_line.setStrokeWidth(10 * this.stroke_scale);
    }
  }

  add_anchors(ui) {
    //if ui.s.draw_mode then return
    let i, p;
    if (this.anchors != null) {
      if (this.anchors.length === this.poly.points.length) {
        for (i = 0; i < this.poly.points.length; i++) {
          p = this.poly.points[i];
          this.anchors[i].setPosition(p.x, p.y);
          this.anchors[i].setStrokeWidth(2 * this.stroke_scale);
          this.anchors[i].setRadius(this.radius * this.stroke_scale);
        }
        return;
      }
      this.remove_anchors();
    }

    this.anchors = [];
    return (() => {
      let result = [];
      for (i = 0; i < this.poly.points.length; i++) {
        p = this.poly.points[i];
        var v = new Kinetic.Circle({
          x: p.x, y: p.y,
          radius: 8 * this.stroke_scale,
          strokeWidth: 2 * this.stroke_scale,
          stroke: "#666", fill: "#ddd",
          opacity: 0, draggable: true});

        v.on('mouseover', (v => () => {
          if (v.removing !== true) {
            $('canvas').css('cursor', 'pointer');
            v.setStrokeWidth(4 * this.stroke_scale);
            return this.stage.draw();
          }
        })(v)
        );
        v.on('mouseout',  (v => () => {
          if (v.removing !== true) {
            $('canvas').css('cursor', 'default');
            v.setStrokeWidth(2 * this.stroke_scale);
            return this.stage.draw();
          }
        })(v)
        );
        v.on('mousedown', (i => () => {
          if (v.removing !== true) {
            return ui.start_drag_point(i);
          }
        })(i)
        );

        v.on('dragmove', (i => () => {
          ui.progress_drag_point(i, this.anchors[i].getPosition());
          if (this.fill) {
            if (ui.drag_valid(i)) {
              this.fill.setStrokeWidth(2 * this.stroke_scale);
              return this.fill.setStroke("#007");
            } else {
              this.fill.setStrokeWidth(10 * this.stroke_scale);
              return this.fill.setStroke("#F00");
            }
          }
        })(i)
        );

        v.on('dragend', (i => () => {
          if (ui.drag_valid(i)) {
            ui.finish_drag_point(i, this.anchors[i].getPosition());
          } else {
            let ps = ui.revert_drag_point(i);
            if (ps != null) { this.anchors[i].setPosition(ps.x, ps.y); }
          }
          this.fill.setStrokeWidth(2 * this.stroke_scale);
          this.fill.setStroke("#007");
          return this.update(ui);
        })(i)
        );

        if (this.poly.points.length < 8) {
          this.stage.add(v, 0.5, 0.4);
        } else {
          this.stage.add(v, 0.5, 0);
        }
        result.push(this.anchors.push(v));
      }
      return result;
    })();
  }
}
