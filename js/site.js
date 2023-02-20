
'use strict';

// Audio
$().ready(function () {
  // All these are a workaround for iOS because iOS can't set currentTime before first play event
  var hasPlayed = false;
  var pendingCurrentTime = 0;
  $('audio').one('play', function () {
    $(this)
      .trigger('pause')
      .prop('currentTime', pendingCurrentTime)
      .trigger('play');
    hasPlayed = true;
  });
  function setCurrentTime(timestamp) {
    if (hasPlayed) {
      $('audio').prop('currentTime', timestamp);
    } else {
      pendingCurrentTime = timestamp;
    }
  }

  var timestamp = parseInt(new URL(window.location).searchParams.get('t'), 10);
  if (!isNaN(timestamp)) {
    setCurrentTime(timestamp);
  }

  $('.summary ul > li').each(function () {
    // Try to match m:ss and mm:ss formats at the beginning of each bulletpoint
    var text = $(this).text();
    var matches =
      text.match(/^(?<hour>\d{1,2}):(?<minute>\d{2}):(?<second>\d{2})\b/) ||
      text.match(/^(?<minute>\d{1,2}):(?<second>\d{2})\b/);
    if (matches) {
      var hour = parseInt(matches.groups.hour, 10) || 0;
      var minute = parseInt(matches.groups.minute, 10) || 0;
      var second = parseInt(matches.groups.second, 10) || 0;
      var timestamp = hour * 3600 + minute * 60 + second;
      var url = new URL(window.location);
      url.searchParams.set('t', timestamp.toString());
      $(this).html(
        $('<a>')
          .attr('href', url.toString())
          .html($(this).html())
          .click(function (event) {
            if ('pushState' in history) {
              setCurrentTime(timestamp);
              history.pushState({ t: timestamp }, '', url.toString());
              event.preventDefault();
            }
          }),
      );
    }
  });

  if ('pushState' in history) {
    window.onpopstate = function (event) {
      var timestamp = parseInt(event.state && event.state.t);
      if (!isNaN(timestamp)) {
        setCurrentTime(timestamp);
      } else {