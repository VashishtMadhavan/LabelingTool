//
// ENDLESS PAGINATION
//

$(function() {
  $("a.endless_more").live("click", function() {
    let container = $(this).closest(".endless_container");
    let get_url = $(this).attr("href");
    $(this).remove();

    container.find(".endless_loading").show();
    let get_data = `querystring_key=${$(this).attr("rel").split(" ")[0]}`;
    $.get(get_url, get_data, function(data) {
      container.before(data);
      container.remove();
      return $(document).trigger("items-added");
    });
    return false;
  });

  $("a.endless_page_link").live("click", function() {
    let page_template = $(this).closest(".endless_page_template");
    if (!page_template.hasClass("endless_page_skip")) {
      let data = `querystring_key=${$(this).attr("rel").split(" ")[0]}`;
      page_template.load($(this).attr("href"), data);
      return false;
    }
  });

  let on_scroll = function() {
    let delta = $(document).height() - $(window).height() - $(window).scrollTop();
    if (delta <= 3200) { return $("a.endless_more").click(); }
  };
  $(window).on('scroll', on_scroll);
  on_scroll();
  return setTimeout((() => $("a.endless_more").click()), 1000);
});


//
// SUBNAV
//

$(function() {
  let isFixed = false;
  let $nav = $("#subnav");
  if (!$nav.length) { return; }
  let navTop = $nav.offset().top - $(".navbar").first().height() - 20;
  let on_scroll = function() {
    let $after = $("#subnav-after");
    let scrollTop = $(window).scrollTop();
    if ((scrollTop >= navTop) && !isFixed) {
      isFixed = true;
      $nav.addClass("subnav-fixed");
      return $after.addClass("subnav-after-fixed");
    } else if ((scrollTop <= navTop) && isFixed) {
      isFixed = false;
      $nav.removeClass("subnav-fixed");
      return $after.removeClass("subnav-after-fixed");
    }
  };
  $(window).on("scroll", on_scroll);
  return on_scroll();
});


//
// TOOLTIPS, POPOVERS, HOVERS, ETC
//

$(function() {
  let on_items_added = function() {
    $(".nav-tabs").button();
    $(".tool").removeClass("tool").tooltip({
      placement: "bottom",
      trigger: "hover"
    });
    return $(".pop").removeClass("pop").popover({
      placement: "bottom",
      trigger: "hover"
    });
  };
  $(document).on("items-added", on_items_added);
  on_items_added();

  return $("body").delegate(".entry-thumb", "mouseover", function() {
    return $(this).addClass("entry-thumb-hover");
  }).delegate(".entry-thumb", "mouseout", function() {
    return $(this).removeClass("entry-thumb-hover");
  });
});
