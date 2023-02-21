
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
        setCurrentTime(0);
      }
    };
  }
});

// Sharing
$().ready(function () {
  var canonicalURL =
    $('link[rel=canonical]').attr('href') || window.location.toString();

  if ('share' in navigator) {
    $('.share-button-group').removeClass('d-none');
    $('.share-button').on('click', function () {
      var sharingURL = new URL(canonicalURL);
      sharingURL.searchParams.delete('t');
      navigator.share({
        url: sharingURL.toString(),
      });
    });

    $('.share-timestamp-button').on('click', function () {
      var sharingURL = new URL(canonicalURL);
      var timestamp = parseInt($('audio').prop('currentTime'), 10);
      if (!isNaN(timestamp)) {
        sharingURL.searchParams.set('t', timestamp);
      }
      navigator.share({
        url: sharingURL.toString(),
      });
    });
  }
});

// Localization
$().ready(function () {
  moment.locale('zh-cn');
  $('[data-date]').each(function (index, element) {
    $(element).text(
      moment($(element).attr('data-date')).calendar({
        sameDay: '[今天]A h 点 mm 分',
        nextDay: '[明天]A h 点 mm 分',
        nextWeek: '[下]ddddA h 点 mm 分',
        lastDay: '[昨天]A h 点 mm 分',
        lastWeek: '[上]ddddA h 点 mm 分',
        sameElse: 'YYYY 年 M 月 D 日A h 点 mm 分',
      }),
    );
  });
});

// Logging
$().ready(function () {
  var canonicalURL =
    $('link[rel=canonical]').attr('href') || window.location.toString();

  function logGoogleEvent(
    category,
    action,
    label,
    value,
    interaction,
    customDimensions,
  ) {
    if (interaction === undefined) {
      interaction = true;
    }
    var dimensions = {
      non_interaction: !interaction,
      event_category: category,
      event_label: label,
      value: value,
    };
    if (customDimensions !== undefined) {
      for (var key in customDimensions) {
        dimensions[key] = customDimensions[key];
      }
    }
    window.gtag('event', action, dimensions);
  }

  function logFacebookEvent(name, parameters) {
    if (window.fbq) {
      window.fbq('track', name, parameters);
    }
  }

  logGoogleEvent('page', 'view');

  $('audio')
    .on('play', function (event) {
      logGoogleEvent('audio', 'play', event.target.currentSrc);
      logFacebookEvent('ViewContent', {
        content_ids: canonicalURL,
        content_name: ($('h1.episode-title').text() || '').replace(
          /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
          '',
        ),
      });
    })
    .on('pause', function (event) {
      logGoogleEvent('audio', 'pause');
    })
    .on('loadedmetadata', function (event) {
      logGoogleEvent(
        'audio',
        'loadedmetadata',
        event.target.currentSrc,
        undefined,
        false,
      );
    })
    .on('loadeddata', function (event) {
      logGoogleEvent(
        'audio',
        'loadeddata',
        event.target.currentSrc,
        undefined,
        false,
      );
    })
    .on('canplay', function (event) {
      logGoogleEvent(
        'audio',
        'canplay',
        event.target.currentSrc,
        undefined,
        false,
      );
    })
    .on('canplaythrough', function (event) {
      logGoogleEvent(
        'audio',
        'canplaythrough',
        event.target.currentSrc,
        undefined,
        false,
      );
    })
    .on('waiting', function (event) {
      logGoogleEvent(
        'audio',
        'waiting',
        event.target.currentSrc,
        undefined,
        false,
      );
    })
    .on('playing', function (event) {
      logGoogleEvent(
        'audio',
        'playing',
        event.target.currentSrc,
        undefined,
        false,
      );
    })
    .on('seeking', function (event) {
      logGoogleEvent(
        'audio',
        'seeking',
        event.target.currentSrc,
        undefined,
        false,
      );
    })
    .on('seeked', function (event) {
      logGoogleEvent(
        'audio',
        'seeked',
        event.target.currentSrc,
        undefined,
        false,
      );
    })
    .on('ended', function (event) {
      logGoogleEvent(
        'audio',
        'ended',
        event.target.currentSrc,
        undefined,
        false,
      );
    });

  window.addEventListener(
    'error',
    function (event) {
      if (event.target && event.target.tagName === 'SOURCE') {
        logGoogleEvent('source', 'error', event.target.src, undefined, false, {
          platform: event.target.getAttribute('data-platform'),
        });
      }
    },
    true,
  );

  $('.share-button').on('click', function () {
    logGoogleEvent('share', 'click', canonicalURL);
  });
  $('.share-timestamp-button').on('click', function () {
    logGoogleEvent('share', 'click', canonicalURL);
  });
  $('.subscribe-button').on('click', function () {
    logGoogleEvent('subscribe', 'click', canonicalURL);
  });
  $('.subscription-links a').on('click', function () {
    logGoogleEvent('link', 'click', $(this).attr('href'));
  });
});