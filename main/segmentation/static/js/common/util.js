// polygon fill colors
let POLYGON_COLORS = [
  '#5D8AA8', '#3B7A57', '#915C83', '#A52A2A', '#FFE135',
  '#2E5894', '#3D2B1F', '#FE6F5E', '#ACE5EE', '#006A4E',
  '#873260', '#CD7F32', '#BD33A4', '#1E4D2B', '#DE6FA1',
  '#965A3E', '#002E63', '#FF3800', '#007BBB', '#6F4E37',
  '#0F4D92', '#9F1D35', '#B78727', '#8878C3', '#30D5C8',
  '#417DC1', '#FF6347'
];

// sets the button state
let set_btn_enabled = function(selector, enabled) {
  //console.log "set_btn_enabled(#{selector}, #{enabled})"
  if (enabled == null) { enabled = true; }
  if (enabled) {
    return $(selector).removeAttr('disabled');
  } else {
    return $(selector).attr('disabled', 'disabled');
  }
};


let select_image_url = function(urls, size) {
  let best_k = 65536;
  let best_v = urls.orig;
  for (let k in urls) {
    let v = urls[k];
    if (k !== 'orig') {
      k = Number(k);
      if ((k >= size) && (k < best_k)) {
        best_k = k;
        best_v = v;
      }
    }
  }
  //console.log "size: #{size}, best_k: #{best_k}"
  return best_v;
};

// add a GET parameter to the URL to ensure that we aren't served a cached
// non-CORS version
let get_cors_url = function(url) {
  if (url.indexOf('?') === -1) {
    return url + '?origin=' + window.location.host;
  } else {
    if ((url.indexOf("?origin=") === -1) && (url.indexOf("&origin=") === -1)) {
      return url + '&origin=' + window.location.host;
    } else {
      return url;
    }
  }
};

// load a cross-origin image
let load_cors_image = function(url, onload) {
  if (onload == null) { onload = null; }
  let img = new Image();
  img.crossOrigin = '';
  if (onload) {
    img.onload = onload;
  }
  img.src = get_cors_url(url);
  return img;
};

// compute width, height so that obj fills a box.
// the object is only blown up by at most max_scale.
// there is no limit to how much it must be shrunk to fit.
let compute_dimensions = function(obj, bbox, max_scale) {
  if (max_scale == null) { max_scale = 2; }
  let scale_x = bbox.width / obj.width;
  let scale_y = bbox.height / obj.height;
  if (scale_x < scale_y) {
    if (scale_x < max_scale) {
      return {
        width: bbox.width,
        height: obj.height * scale_x,
        scale: scale_x
      };
    }
  } else {
    if (scale_y < max_scale) {
      return {
        width: obj.width * scale_y,
        height: bbox.height,
        scale: scale_y
      };
    }
  }

  return {
    width: obj.width * max_scale,
    height: obj.height * max_scale,
    scale: max_scale
  };
};

// stops an event from propagating
let stop_event = function(e) {
  if (e == null) { e = window.event; }
  if (typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }
  if (typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  e.cancelBubble = true;
  e.returnValue = false;
  e.cancel = true;
  return false;
};


// from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
// assumes r, g, b are in [0, 255] and h, s, v are in [0, 1]
let rgb_to_hsv = function(r, g, b) {
  let h;
  r = r / 255;
  g = g / 255;
  b = b / 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let v = max;
  let d = max - min;
  let s = (max === 0 ? 0 : d / max);
  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r:
        h = ((g - b) / d) + ((g < b ? 6 : 0));
        break;
      case g:
        h = ((b - r) / d) + 2;
        break;
      case b:
        h = ((r - g) / d) + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, v];
};

// from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
// assumes r, g, b are in [0, 255] and h, s, v are in [0, 1]
let hsv_to_rgb = function(h, s, v) {
  let b, g, r;
  let i = Math.floor(h * 6);
  let f = (h * 6) - i;
  let p = v * (1 - s);
  let q = v * (1 - (f * s));
  let t = v * (1 - ((1 - f) * s));
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return [r * 255, g * 255, b * 255];
};
