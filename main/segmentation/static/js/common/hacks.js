//# BROWSER HACKS

// Browser: IE
// Problem: doesn't implement vector-effect: non-scaling-stroke
// Hack solution: replace with stroke-width: 0.2%
if ($.browser.msie) {
  console.log('detected: IE');
  (function() {
    let fix_ie = () =>
      $('.nss').css('vector-effect', '') 
        .css('stroke-width', '0.2%') 
        .css('stroke-linecap', 'round')
    ;
    fix_ie();
    return $(document).on('items-added', fix_ie);
  })();
  if (Number($.browser.version) < 10) {
    $('#outdated-browser-alert').show();
  }
}

// Browser: Firefox and IE
// Problem: inline SVG height doesn't scale properly
// Hack solution: store aspect in tag and manually enforce aspect ratio
if (!($.browser.webkit || $.browser.opera)) {
  let fix_aspect = () =>
    $('svg.fix-aspect').each( function() {
      let t = $(this);
      let aspect = t.attr('data-aspect');
      //console.log aspect
      if (aspect != null) {
        return t.height(t.width() / aspect);
      }
    })
  ;
  fix_aspect();
  $(document).on('items-added', fix_aspect);
  $(window).on('resize', fix_aspect);
}

// to show if not webkit
if (!$.browser.webkit) {
  $('.if-not-webkit').show();
}
