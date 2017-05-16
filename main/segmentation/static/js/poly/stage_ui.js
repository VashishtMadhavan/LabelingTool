// Wrapper for Kinetic.Stae
class StageUI {
  constructor(ui, args) {
    // maximum possible size
    this.bbox = {width: args.width, height: args.height};
    // actual size
    this.size = {width: args.width, height: args.height};

    // zoom information
    this.origin = {x: 0, y: 0};
    this.zoom_exp = 0;
    this.zoom_exp_max = 7;

    this.stage = new Kinetic.Stage({
      container: args.container_id,
      width: this.size.width,
      height: this.size.height});
    this.layer = new Kinetic.Layer();
    this.stage.add(this.layer);

    this.stage.on('mouseout', () => this.layer.draw());
    this.stage.on('mousemove', function() {
      if (!ui.s.panning) {
        return ui.update();
      }
    });
  }

  add(o, opacity, duration) {
    if (opacity == null) { opacity = 1.0; }
    if (duration == null) { duration = 0.4; }
    this.layer.add(o);
    if (duration > 0) {
      o.setOpacity(0);
      return o.add_trans = o.transitionTo({opacity, duration});
    } else {
      return o.setOpacity(opacity);
    }
  }

  remove(o, duration) { if (duration == null) { duration = 0.4; } if (o != null) {
    if (o.add_trans != null) {
      o.add_trans.stop();
    }
    if (duration > 0) {
      o.removing = true;
      return o.transitionTo({
        opacity: 0,
        duration,
        callback: (o => () => o.remove())(o)
      });
    } else {
      return o.remove();
    }
  } }

  draw() { return this.layer.draw(); }

  mouse_pos() {
    let p = this.stage.getMousePosition();
    if ((p == null)) {
      return p;
    } else {
      let scale = Math.pow(2, -this.zoom_exp);
      return {
        x: Math.min(Math.max(0, (p.x * scale) + this.origin.x), this.size.width),
        y: Math.min(Math.max(0, (p.y * scale) + this.origin.y), this.size.height)
      };
    }
  }

  zoom_reset(redraw) {
    if (redraw == null) { redraw = true; }
    this.zoom_exp = 0;
    this.origin = {x: 0, y: 0};
    this.stage.setOffset(this.origin.x, this.origin.y);
    this.stage.setScale(1.0);
    if (redraw) {
      return this.stage.draw();
    }
  }

  // zoom in/out by delta (in log_2 units)
  zoom_delta(delta, p) {
    if (p == null) { p = this.stage.getMousePosition(); }
    if (delta != null) {
      return this.zoom_set(this.zoom_exp + (delta * 0.001), p);
    }
  }

  get_zoom_factor() {
    return Math.pow(2, this.zoom_exp);
  }

  // set the zoom level (in log_2 units)
  zoom_set(new_zoom_exp, p) {
    if (p == null) { p = this.stage.getMousePosition(); }
    if ((this.k_loading != null) || (new_zoom_exp == null) || (p == null)) { return; }
    let old_scale = Math.pow(2, this.zoom_exp);
    this.zoom_exp = Math.min(this.zoom_exp_max, new_zoom_exp);
    if (this.zoom_exp <= 0) {
      return this.zoom_reset();
    } else {
      let new_scale = Math.pow(2, this.zoom_exp);
      let f = ((1.0 / old_scale) - (1.0 / new_scale));
      this.origin.x += f * p.x;
      this.origin.y += f * p.y;
      this.stage.setOffset(this.origin.x, this.origin.y);
      this.stage.setScale(new_scale);
      return this.stage.draw();
    }
  }

  // zoom to focus on a box
  zoom_box(aabb) {
    let min = {x: aabb.min.x - 50, y: aabb.min.y - 50};
    let max = {x: aabb.max.x + 50, y: aabb.max.y + 50};
    let obj = {width: max.x - min.x, height: max.y - min.y};
    let b = compute_dimensions(obj, this.bbox, INF);
    this.zoom_exp = Math.max(0, Math.min(this.zoom_exp_max,
      Math.log(b.scale) / Math.log(2)));
    if (this.zoom_exp <= 0) {
      return this.zoom_reset();
    } else {
      this.origin = min;
      this.stage.setOffset(this.origin.x, this.origin.y);
      this.stage.setScale(Math.pow(2, this.zoom_exp));
      return this.stage.draw();
    }
  }

  // translate the zoomed in view by some amount
  translate_delta(x, y, transition) {
    if (transition == null) { transition = true; }
    if (!this.k_loading) {
      this.origin.x += x;
      this.origin.y += y;
      if (transition) {
        this.stage.transitionTo({
          offset: clone_pt(this.origin),
          duration: 0.1
        });
      } else {
        this.stage.setOffset(this.origin.x, this.origin.y);
      }
      return this.stage.draw();
    }
  }

  // translate the view if near the edge
  translate_mouse_click() {
    if ((this.zoom_exp > 0) && !this.k_loading) {
      let p = this.stage.getMousePosition();
      p = {
        x: p.x / this.stage.getWidth(),
        y: p.y / this.stage.getHeight()
      };
      console.log('p:', p);
      let delta = { x: 0, y: 0 };
      let factor = this.get_zoom_factor();
      if (p.x < 0.05) {
        delta.x = -200 / this.get_zoom_factor();
      } else if (p.x > 0.95) {
        delta.x = 200 / this.get_zoom_factor();
      }
      if (p.y < 0.05) {
        delta.y = -200 / this.get_zoom_factor();
      } else if (p.y > 0.95) {
        delta.y = 200 / this.get_zoom_factor();
      }
      if ((delta.x !== 0) || (delta.y !== 0)) {
        return this.translate_delta(delta.x, delta.y);
      }
    }
  }

  error_line(p1, p2) {
    let el = new Kinetic.Line({
      points: [clone_pt(p1), clone_pt(p2)], opacity: 0.5,
      stroke: "#F00", strokeWidth: 10 / this.get_zoom_factor(),
      lineCap: "round"});
    this.layer.add(el);
    return this.remove(el);
  }

  add_loading() { if ((this.k_loading == null)) {
    this.k_loading = new Kinetic.Text({
      x: 30, y: 30, text: "Loading...", align: "left",
      fontSize: 32, fontFamily: "Helvetica,Verdana,Ariel",
      textFill: "#000"});
    this.add(this.k_loading);
    return this.draw();
  } }

  remove_loading() { if (this.k_loading != null) {
    this.remove(this.k_loading);
    this.k_loading = null;
    return this.draw();
  } }

  set_photo(photo_url, ui, on_load) {
    this.add_loading();
    this.photo_obj = new Image();
    this.photo_obj.src = photo_url;
    return this.photo_obj.onload = (() => () => {
      this.remove_loading();
      this.size = compute_dimensions(this.photo_obj, this.bbox);
      //@stage.setWidth(@size.width)
      //@stage.setHeight(@size.height)
      this.photo = new Kinetic.Image({
        x: 0, y: 0, image: this.photo_obj,
        width: this.size.width, height:this.size.height});
      this.layer.add(this.photo);
      this.photo.moveToBottom();
      this.ready = true;
      this.photo.on('mousedown', function() {
        if (!ui.s.panning) {
          return ui.unselect_poly();
        }
      });
      return (typeof on_load === 'function' ? on_load() : undefined);
    })();
  }
}
