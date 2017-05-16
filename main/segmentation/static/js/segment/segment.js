$( function() {
  template_args.width = $("#mt-image").width();
  template_args.height = (720/1280) * $('#mt-image').width();
  template_args.container_id = 'mt-image';
  $('#poly-container').width(template_args.width).height(template_args.height);
  window.controller_ui = new ControllerUI(template_args);
});

let btn_submit = () => window.mt_submit(window.controller_ui.get_submit_data);

let btn_reject = () => window.mt_reject(window.controller_ui.get_submit_data);

 // wait for everything to load before allowing submit
$(window).on('load', function() {
  $('#btn-submit').on('click', btn_submit);
  $('#btn-reject').on('click', btn_reject);
});