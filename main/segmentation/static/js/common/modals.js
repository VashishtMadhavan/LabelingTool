//# LOGIC FOR MODAL DIALOGS

//# templates/modal_areyousure.html

window.show_modal_areyousure = function(args) {
  if (args.label != null) { $("#modal-areyousure-label").html(args.label); }
  if (args.message != null) { $("#modal-areyousure-message").html(args.message); }
  if (args.yes_text != null) { $("#modal-areyousure-yes").text(args.yes_text); }
  if (args.no_text != null) { $("#modal-areyousure-no").text(args.no_text); }
  if (args.yes != null) { $("#modal-areyousure-yes").off("click").on("click", args.yes); }
  if (args.no != null) { $("#modal-areyousure-no").off("click").on("click", args.no); }
  if (typeof args.before_show === 'function') {
    args.before_show();
  }
  return $("#modal-areyousure").modal("show");
};


//# templates/modal_error.html

window.show_modal_error = function(message, header) {
  $("#modal-error-label").html((header != null) ? header : "Error!");
  $("#modal-error-message").html(message);
  return $("#modal-error").modal("show");
};

window.hide_modal_error = () => $("#modal-error").modal("hide");


//# templates/modal_form.html

window.show_modal_form = function(args) {
  if (args.label != null) { $("#modal-form-label").html(args.label); }
  if (args.body != null) { $("#modal-form-body").html(args.body); }
  if (args.yes_text != null) { $("#modal-form-yes").text(args.yes_text); }
  if (args.no_text != null) { $("#modal-form-no").text(args.no_text); }
  if (args.yes != null) { $("#modal-form-yes").off("click").on("click", args.yes); }
  if (args.no != null) { $("#modal-form-no").off("click").on("click", args.no); }
  if (typeof args.before_show === 'function') {
    args.before_show();
  }
  $("#modal-form").off("shown").on("shown", () =>
    $("#modal-form-body").find("input").filter(function() {
      return $(this).val() === "";
    }).first().focus()
  );
  return $("#modal-form").modal("show");
};

window.hide_modal_form = () => $("#modal-form").modal("hide");


//# templates/modal_give_up.html

window.show_modal_give_up = function(label_message, prompt_message, submit_message, suggested_reasons) {
  $("#modal-give-up-text").val("");
  $("#modal-give-up-label").text(label_message);
  $("#modal-give-up-prompt").text(prompt_message);
  $("#modal-give-up-submit").text(submit_message);
  $("#modal-give-up-submit").attr("disabled", "disabled");
  let reasons = $("#modal-give-up-suggested-reasons");
  reasons.empty();
  if (suggested_reasons != null) {
    for (var str of Array.from(suggested_reasons)) {
      let r = $(`<button class='btn btn-block' type='button'>${str}</button>`);
      r.on("click", function() {
        $("#modal-give-up-text").val(str);
        return $("#modal-give-up-submit").removeAttr("disabled");
      });
      reasons.append(r);
    }
    reasons.append($("<p style='margin-top:20px;'>Other problem:</p>"));
  }
  return $("#modal-give-up").modal("show");
};

window.hide_modal_give_up = () => $("#modal-give-up").modal("hide");

$(() =>
  $("#modal-give-up-text").on("input propertychange", function() {
    let text = $("#modal-give-up-text").val();
    if (text && (text.length > 10)) {
      return $("#modal-give-up-submit").removeAttr("disabled");
    } else {
      return $("#modal-give-up-submit").attr("disabled", "disabled");
    }
  })
);


//# templates/modal_loading.html

window.show_modal_loading = function(message, timeout) {
  let modal_loading_timeout;
  if (message == null) { message = "Loading..."; }
  if (timeout == null) { timeout = 1000; }
  return modal_loading_timeout = setTimeout(( function() {
    $("#modal-loading-label").text(message);
    return $("#modal-loading").modal({
      backdrop: "static",
      keyboard: false
    }).modal("show");
  }), timeout);
};
window.hide_modal_loading = function(on_hide) {
  if (typeof modal_loading_timeout !== 'undefined' && modal_loading_timeout !== null) { clearTimeout(modal_loading_timeout); }
  let $modal = $("#modal-loading");
  $modal.modal("hide");
  if (on_hide != null) { return $modal.off("hidden").on("hidden", on_hide); }
};
