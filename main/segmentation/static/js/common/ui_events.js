//# Common UI helpers

// Helper for hover items
$(document).on('mouseover', '.hover-toggle', function() {
  let out = $(this).find('.show-on-mouseout');
  let over = $(this).find('.show-on-mouseover');
  let w = out.width();
  let h = out.height();
  out.hide();
  over.width(w);
  over.height(h);
  over.show();
});
$(document).on('mouseout', '.hover-toggle', function() {
  $(this).find('.show-on-mouseout').show();
  $(this).find('.show-on-mouseover').hide();
});

// Speedup for categories pages
(function() {
  let handle_nav = id =>
    $(`div#${id}`).on('click', 'li > a', function() {
      $('.loading-spinner').remove();
      $(`div#${id} li.active`).removeClass('active');
      $(this).closest('li').addClass('active');
      $(this).append(' <i class="icon-spinner icon-spin loading-spinner"></i>');
      let timer = setTimeout(( () => {
        return $('div#content').html('<i class="icon-spinner icon-spin icon-2x"></i>');
      }
      ), 1000);
      return window.on('beforeunload', function() {
        clearTimeout(timer);
        return null;
      });
    })
  ;

  handle_nav('subnav');
  handle_nav('sidenav');
})();
