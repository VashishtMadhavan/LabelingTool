// handy constants
const INF = Number.POSITIVE_INFINITY;
const NINF = Number.NEGATIVE_INFINITY;

// Axis-aligned bounding box (2D)
class AABB {
  constructor(min, max) {
    if (min == null) { min = {x:INF,y:INF}; }
    if (max == null) { max = {x:NINF,y:NINF}; }
    this.min = clone_pt(min);
    this.max = clone_pt(max);
  }

  // sets this to the empty AABB
  reset() {
    this.min={x:INF,y:INF};
    return this.max={x:NINF,y:NINF};
  }

  // clone this AABB
  clone() {
    return new AABB(this.min, this.max);
  }

  midpoint() {
    return {
      x: 0.5 * (this.min.x + this.max.x),
      y: 0.5 * (this.min.y + this.max.y)
    };
  }

  // returns true if this contains point p
  contains_pt(p) {
    return (p.x >= this.min.x) && (p.x <= this.max.x) && (p.y >= this.min.y) && (p.y <= this.max.y);
  }

  // returns true if this intersects b
  intersects_bbox(b) {
    return ((this.max.x >= b.min.x) && (this.min.x <= b.max.x) &&
     (this.max.y >= b.min.y) && (this.min.y <= b.max.y));
  }

  // returns true if this entirely contains b
  contains_bbox(b) {
    return ((this.max.x >= b.max.x) && (this.min.x <= b.min.x) &&
     (this.max.y >= b.max.y) && (this.min.y <= b.min.y));
  }

  // expand the AABB to include a new point
  extend_pt(p) {
    this.min = {x: Math.min(this.min.x, p.x), y: Math.min(this.min.y, p.y)};
    return this.max = {x: Math.max(this.max.x, p.x), y: Math.max(this.max.y, p.y)};
  }

  // compute a new AABB from the given points
  recompute_from_points(points) {
    this.reset();
    return Array.from(points).map((p) =>
      this.extend_pt(p));
  }

  normalize_pt(p) {
    return {
      x: (p.x - this.min.x) / (this.max.x - this.min.x),
      y: (p.y - this.min.y) / (this.max.y - this.min.y)
    };
  }
}


// Mathematical polygon (2D)
class Polygon {
  constructor(pts, open) {
    if (open == null) { open = true; }
    this.open = open;
    this.aabb = new AABB();
    this.points = [];
    if (pts != null) { this.push_points(pts); }
  }

  // add point (make sure to check can_push_point first)
  push_point(p) { if (p != null) {
    this.points.push(clone_pt(p));
    return this.aabb.extend_pt(p);
  } }

  push_points(pts) {
    return Array.from(pts).map((p) =>
      this.push_point(p));
  }

  // remove last point
  pop_point(p) {
    if (this.points.length > 0) {
      let ret = this.points.pop();
      this.aabb.recompute_from_points(this.points);
      return ret;
    }
  }

  // move point index i to position p
  set_point(i, p) { if (p != null) {
    this.points[i].x = p.x;
    this.points[i].y = p.y;
    this.aabb.recompute_from_points(this.points);
    return p;
  } }

  // change close state (make sure to check can_close first)
  close() { return this.open = false; }
  unclose() { return this.open = true; }
  empty() { return this.points.length === 0; }

  // point accessors
  get_pt(i) { return clone_pt(this.points[i]); }
  num_points() { return this.points.length; }
  clone_points() { return (Array.from(this.points).map((p) => clone_pt(p))); }
  get_aabb() { return this.aabb.clone(); }

  // returns true if p can be added
  can_push_point(p) {
    if (!this.open) { return false; }
    if (this.points.length < 3) { return true; }
    return !this.intersects_segment(
      this.points[this.points.length - 1], p, [this.points.length - 2]);
  }

  // returns true if this poly can close without self-intersecting
  can_close() {
    if (!this.open || (this.points.length < 3)) { return false; }
    if (this.points.length === 3) { return true; }
    return !this.intersects_segment(this.points[0],
      this.points[this.points.length - 1], [0, this.points.length - 2]);
  }

  // return the average vertex position
  midpoint() {
    let y;
    if (this.points.length < 1) { return undefined; }
    let x = (y = 0);
    for (let p of Array.from(this.points)) {
      x += p.x;
      y += p.y;
    }
    return {x: x/this.points.length, y: y/this.points.length};
  }

  // returns the exact centroid
  centroid() {
    let Cx, Cy;
    if (this.points.length < 1) { return undefined; }
    let A = (Cx = (Cy = 0));
    for (let i = 0; i < this.points.length; i++) {
      let v0 = this.points[i];
      let v1 = this.points[(i + 1) % this.points.length];
      let t = (v0.x * v1.y) - (v1.x * v0.y);
      A += t;
      Cx += (v0.x + v1.x) * t;
      Cy += (v0.y + v1.y) * t;
    }
    if (Math.abs(A) < 0.001) { return this.midpoint(); }
    return {x: Cx / (3 * A), y: Cy / (3 * A)};
  }

  // return the midpoint of the axis-aligned bounding box
  aabb_midpoint() {
    return this.aabb.midpoint();
  }

  // returns exact area
  area() {
    let A = 0;
    for (let i = 0; i < this.points.length; i++) {
      let v0 = this.points[i];
      let v1 = this.points[(i + 1) % this.points.length];
      A += (v0.x * v1.y) - (v1.x * v0.y);
    }
    return Math.abs(A / 2);
  }

  // returns a good position to place a label
  // requires: delaunay.js
  labelpos() {
    // if the centroid is good enough, use it
    let best_d2;
    let best_m = this.centroid();
    if (this.contains_pt(best_m)) {
      best_d2 = this.dist2_to_edge(best_m);
      if (best_d2 > 2000) { // good enough already
        return best_m;
      }
    } else {
      best_d2 = 0;
    }

    // delaunay triangulation (O(n^2) worst case)
    let del_tri = delaunay_triangulate(this.clone_points());

    // find the triangle midpoint that is inside the poly
    // and furthest from the edges
    for (let t of Array.from(del_tri)) {
      let m = t.midpoint();
      if (this.contains_pt(m)) {
        let d2 = this.dist2_to_edge(m);
        if (d2 > best_d2) {
          best_d2 = d2;
          best_m = m;
        }
      }
    }

    return best_m;
  }

  // returns true iff this polygon is complex
  // (assumes non-self-intersecting)
  is_convex() {
    let s = true;
    for (let i = 0; i < this.points.length; i++) {
      let v0 = this.points[i];
      let v1 = this.points[(i + 1) % this.points.length];
      let v2 = this.points[(i + 2) % this.points.length];
      if (i === 0) {
        s = ccw(v1, v0, v2);
      } else if (s !== ccw(v1, v0, v2)) {
        return false;
      }
    }
    return true;
  }

  // returns the closest squared distance from p to an edge
  dist2_to_edge(p) {
    let n = this.points.length;
    if (n < 2) { return 0; }
    let min_d2 = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.points.length; i++) {
      let v0 = this.points[i];
      let v1 = this.points[(i + 1) % this.points.length];
      min_d2 = Math.min(min_d2, seg_pt_dist2(v0.x, v0.y, v1.x, v1.y, p.x, p.y));
    }
    return min_d2;
  }

  // returns true if this intersects the segment p1--p2
  intersects_segment(p1, p2, excludes) {
    if (excludes == null) { excludes = []; }
    let n = this.points.length;
    if (n < 2) { return false; }
    let max = this.open ? (n-1) : n;
    for (let i = 0, end = max, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      if (!Array.from(excludes).includes(i)) {
        let v1 = this.points[i]; let v2 = this.points[(i+1) % n];
        if (segments_intersect(p1, p2, v1, v2)) { return true; }
      }
    }
    return false;
  }

  // returns true if this polygon contains point p
  // adapted from http://www.ecse.rpi.edu/Homepages/wrf
  // /Research/Short_Notes/pnpoly.html
  contains_pt(p) {
    if ((this.points.length < 3) || !this.aabb.contains_pt(p)) { return false; }
    let n = this.points.length; let c = false; let i = 0; let j = n-1;
    while (i < n) {
      let vi = this.points[i];
      if ((vi.x === p.x) && (vi.y === p.y)) { return true; }
      let vj = this.points[j];
      if (((vi.y > p.y) !== (vj.y > p.y)) &&
          (p.x < ((((vj.x - vi.x) * (p.y - vi.y)) / (vj.y - vi.y)) + vi.x))) {
        c = !c;
      }
      j = i++;
    }
    return c;
  }

  // returns true if the polygon self-intersects at vertex i
  self_intersects_at_index(i) {
    if (this.points.length < 4) { return false; }
    let m2 = mod(i - 2, this.points.length);
    let m1 = mod(i - 1, this.points.length);
    let p1 = mod(i + 1, this.points.length);
    return this.intersects_segment(this.points[i], this.points[p1], [m1, i, p1]) ||
           this.intersects_segment(this.points[i], this.points[m1], [m2, m1, i]);
  }

  // returns true if some segment of this polygon intersects another segment
  self_intersects() {
    let max = this.open ? (this.points.length-1) : this.points.length;
    for (let i = 0, end = max, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      if (this.self_intersects_at_index(i)) {
        return true;
      }
    }
    return false;
  }

  // returns true if some edge of this polygon intersects poly
  // entire containment of one poly with the other returns false
  partially_intersects_poly(poly) {
    if (!this.aabb.intersects_bbox(poly.aabb)) { return false; }
    let n = this.points.length;
    if (n < 2) { return false; }
    let max = this.open ? (n-1) : n;
    for (let i = 0, end = max, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      let v1 = this.points[i]; let v2 = this.points[(i+1) % n];
      if (poly.intersects_segment(v1, v2)) { return true; }
    }
    return false;
  }

  // returns true if this polygon entirely contains poly
  contains_poly(poly) {
    if (!this.aabb.contains_bbox(poly.aabb)) { return false; }
    for (let p of Array.from(poly.points)) {
      if (!this.contains_pt(p)) { return false; }
    }
    return true;
  }

  // returns true if this polygon intersects poly
  intersects_poly(poly) {
    return this.contains_poly(poly) || this.partially_intersects_poly(poly);
  }
}


// Mathematical complex polygon (2D).
// Representation: list of vertices, triangles, and unorganized segments.
// Triangles and segments are indices into the list of vertices.
// Triangles are length-3 arrays, vertices are length-2 integer arrays.
class ComplexPolygon {
  constructor(vertices, triangles, segments) {
    // clone the input arrays
    this.vertices = vertices.splice(0);
    this.triangles = triangles.splice(0);
    this.segments = segments.splice(0);

    this.aabb = new AABB();
    for (let p of Array.from(this.vertices)) {
      this.aabb.extend_pt(p);
    }
  }

  // computes the centroid of this polygon
  centroid() {
    let sum_x = 0;
    let sum_y = 0;
    let sum_a = 0;
    for (let t of Array.from(this.triangles_points())) {
      let m = mean_pt(t);
      let a = tri_area(t[0], t[1], t[2]);
      sum_x += m.x * a;
      sum_y += m.y * a;
      sum_a += a;
    }
    return {
      x: sum_x / sum_a,
      y: sum_y / sum_a
    };
  }

  get_aabb() { return this.aabb.clone(); }

  aabb_midpoint() {
    return this.aabb.midpoint();
  }

  contains_pt(p) {
    if (!this.aabb.contains_pt(p)) { return false; }
    for (let t of Array.from(this.triangles_points())) {
      if (pt_in_tri(t[0], t[1], t[2], p)) {
        return true;
      }
    }
    return false;
  }

  // returns a good position to place a label
  labelpos() {
    let best_d2, best_m;
    let centroid = this.centroid();
    if (this.contains_pt(centroid)) {
      best_m = centroid;
      best_d2 = this.dist2_to_edge(centroid);
    } else {
      best_d2 = NINF;
    }
    for (let t of Array.from(this.triangles_points())) {
      let m = mean_pt(t);
      let d2 = this.dist2_to_edge(m);
      if (d2 > best_d2) {
        best_d2 = d2;
        best_m = m;
      }
    }
    return best_m;
  }

  // returns the smallest squared distance from p to an edge
  dist2_to_edge(p) {
    let min_d2 = Number.POSITIVE_INFINITY;
    for (let s of Array.from(this.segments)) {
      let v0 = this.vertices[s[0]];
      let v1 = this.vertices[s[1]];
      min_d2 = Math.min(min_d2, seg_pt_dist2(v0.x, v0.y, v1.x, v1.y, p.x, p.y));
    }
    return min_d2;
  }

  // returns a list of line segments as nested point arrays
  segments_points() {
    return (Array.from(this.segments).map((s) => [this.vertices[s[0]], this.vertices[s[1]]]));
  }

  // returns a list of triangles as nested point arrays
  triangles_points() {
    return (Array.from(this.triangles).map((t) => [this.vertices[t[0]], this.vertices[t[1]], this.vertices[t[2]]]));
  }
}


// Represents a pinhole camera model but without a transform (located at the
// origin)
class Perspective {
  constructor(args) {
    if (args.focal != null) {
      this.f = args.focal;
    } else if ((args.width != null) && (args.fov != null)) {
      this.f = args.width / (2 * Math.tan(args.fov / 2));
    } else {
      console.log(args);
      throw ({name: "error: bad arguments", args});
    }
  }

  project(p) {
    return {x: (this.f * p.x) / p.z, y: (this.f * p.y) / p.z};
  }

  unproject(p, z) {
    if (z == null) { ({ z } = p); }
    return {x: (p.x * p.z) / this.f, y: (p.y * p.z) / this.f, z};
  }
}


// returns true if AB intersects CD (2D)
var segments_intersect = (A, B, C, D) => (ccw(A, C, D) !== ccw(B, C, D)) && (ccw(A, B, C) !== ccw(A, B, D));
var ccw = (A, B, C) => ((C.y - A.y) * (B.x - A.x)) > ((B.y - A.y) * (C.x - A.x));

// squared point-segment distance
var seg_pt_dist2 = function(x1, y1, x2, y2, px, py) {
  let x, y;
  let pd2 = ((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2));

  if (pd2 === 0) {
    // Points are coincident.
    x = x1;
    y = y2;
  } else {
    // parameter of closest point on the line
    let u = (((px - x1) * (x2 - x1)) + ((py - y1) * (y2 - y1))) / pd2;
    if (u < 0) { // off the end
      x = x1;
      y = y1;
    } else if (u > 1.0) { // off the end
      x = x2;
      y = y2;
    } else { // interpolate
      x = x1 + (u * (x2 - x1));
      y = y1 + (u * (y2 - y1));
    }
  }

  return ((x - px) * (x - px)) + ((y - py) * (y - py));
};

// converts an object having an x and y attribute (possibly z) into a point
var clone_pt = function(o) {
  if (o != null) {
    if (o.z != null) {
      return {x: o.x, y: o.y, z: o.z};
    } else {
      return {x: o.x, y: o.y};
    }
  } else {
    return null;
  }
};


// distance between p and q
let dist_pt = function(p, q) {
  let dx = p.x - q.x;
  let dy = p.y - q.y;
  return Math.sqrt((dx * dx) + (dy * dy));
};


// subtract two points
let sub_pt = (p, q) => ({x: p.x - q.x, y: p.y - q.y});


// computes the mean position of a list of points
var mean_pt = function(points) {
  let x = 0;
  let y = 0;
  for (let p of Array.from(points)) {
    x += p.x;
    y += p.y;
  }
  return {x: x/points.length, y: y/points.length};
};


// computes the area of the triangle a,b,c
var tri_area = (a, b, c) => 0.5 * Math.abs((a.x * (b.y - c.y)) + (b.x * (c.y - a.y)) + (c.x * (a.y - b.y)));


// return whether v is in the triangle a,b,c
// (from http://mathworld.wolfram.com/TriangleInterior.html)
var pt_in_tri = function(a, b, c, v) {
  let det = (u, v) => (u.x * v.y) - (u.y * v.x);
  let v0 = a;
  let v1 = sub_pt(b, a);
  let v2 = sub_pt(c, a);
  let det_v1v2 = det(v1, v2);
  a = (det(v, v2) - det(v0, v2)) / det_v1v2;
  if ((a < 0) || (a > 1)) { return false; }
  b = -(det(v, v1) - det(v0, v1)) / det_v1v2;
  return (b >= 0) && ((a + b) <= 1);
};

// computes mod, wrapping around negative numbers properly
var mod = (x,n) => ((x % n) + n) % n;
