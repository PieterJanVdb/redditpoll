var infoCard = $('.info-card');
var generateResultCard = $('.generate-result-card');
var downloadCSVCard = $('.download-csv-card');

$(document).ready(function() {
    for (var i = 1; i < 51; i++) {
      $('.limit-select').append($('<option>', {
          value: i,
          text : i
      }));
    }

    $('select:not([multiple])').material_select();
});

$('.header').click(function (event) {
  window.location.href = '';
});

$('.generate-result').submit(function (event) {
  event.preventDefault();

  var $form = $(this);
  var $generateResultError = $('.generate-result-error');
  var $generateResultButton = $('.generate-result-button');

  $generateResultButton.prop('disabled', true);
  $generateResultError.text('');

  $.ajax({
     type: 'POST',
     url: '/generate_result',
     data: $form.serialize(),
  })
    .done(function (data) {
      document.cookie = 'result=' + JSON.stringify(data.result);

      $generateResultButton.prop('disabled', false);
      generateResultCard.hide(300);
      infoCard.hide(300);
      downloadCSVCard.show(300);
      fillUnprocessedIds(data.unparsedIds);
    })
    .fail(function (err) {
      $generateResultError.text(err.responseText);
      $generateResultButton.prop('disabled', false);
    })

  return false;
});

$('.download-csv-button').click(function (event) {
  var $button = $(this);

  $button.prop('disabled', true);

  window.location.href = '/download_csv';
})

var fillUnprocessedIds = function fillUnprocessedIds (ids) {
  var $unprocessedIds = $('.unprocessed-ids');

  $(ids).each(function (idx, id) {
    var item = '<li>' + id + '</li>';

    $unprocessedIds.append(item);
  });

  $unprocessedIds.show(500);
}
