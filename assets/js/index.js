var ctx, mnc;

$(function() {
  var canvas = document.getElementById('conversion');
  if (!canvas || !canvas.getContext) return false;

  canvas.width = canvas.height = 660 * window.devicePixelRatio;

  ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  var miniMap = document.getElementById('miniMap');
  miniMap.addEventListener("mousedown", mouseDownListner, false);
  if (!miniMap || !miniMap.getContext) return false;

  miniMap.width = 280 * window.devicePixelRatio;
  miniMap.height = 270 * window.devicePixelRatio;

  mnc = miniMap.getContext('2d');
  mnc.scale(window.devicePixelRatio, window.devicePixelRatio);

  var design, imgData, jcrop_api, myDesign, thumbnail, palette_data, pltPage, sheet, palette_select,

  save_option = {
    'minimap': true,
  },

  myDesign = {
    'size': {'width': 32, 'height': 32},
    'maxColor': 15,
    'autoSize': 0,
    'palette': null,
    'coordinates': null
  },

  miniMapPos = {};

  if(localStorage.getItem('design')) {
    design = JSON.parse(localStorage.getItem('design'));
    $('#convert').css('visibility', 'visible');

    initializationCanvas();
    draw();
    lineDrawing();
    numDrawing();
    miniMapClear();
    miniMapDraw();
    paletteDraw();

    //console.log(design);
  } else {
    $('#dialogBox').fadeIn();
  }

  if($.cookie('tobimy_info') != 2) {
    $.cookie('tobimy_info', null, { expires: -1, path: '/' });
    $.cookie('tobimy_info', 2, { expires: 730, path: '/' });
    tobimy_info();
  }

  $('#language').change(function() {
    $.cookie('language', $('option:selected', this).val(), { expires: 1825, path: '/' });
    location.reload();
    //document.location = 'http://app.nicofinder.net/tobimy/?la='+ $('option:selected', this).val();
  });

  $('img').lazyload({
    effect: 'fadeIn',
    effectspeed: 1000
  });

  new Dropzone(".stage", {
    url: "/api/upload-status.php",
    paramName: "file",
    previewsContainer: '.picker-area',
    parallelUploads: 1,
    maxThumbnailFilesize: 5,
    maxFilesize: 5,
    createImageThumbnails : true,
    init: function() {
      this.on("addedfile", function(file) {
        $('.dialogBox-pre').addClass('loader');
        $('.picker-area').empty();
        panelChange();
      });
      this.on("success", function(file, data) {
        imgData = $.parseJSON(data);
        switch (imgData.status) {
          case 0:
            $('.picker-area').empty();
            $('.topicPass').html('<li>'+ msg[0] +'</li><li>'+ file.name +'</li>');
            $('.picker-area').html('<img id="imageData" src="data:'+ imgData.type +';base64,'+ imgData.data +'">');
            previewSet();
            break;
          case 1:
          case 2:
            dialogBoxClear();
            alert(msg[1]);
            break;
          case 3:
            dialogBoxClear();
            alert(msg[2]);
            break;
          case 4:
            dialogBoxClear();
            alert(msg[3]);
            break;
          case 6:
          case 7:
          case 8:
            dialogBoxClear();
            alert(msg[4]);
            break;
          case 100:
            dialogBoxClear();
            alert(msg[5]);
            break;
          default:
            dialogBoxClear();
            alert('Undefined Error');
            break;
        }
        $('.dialogBox-pre').removeClass('loader');

      });
      this.on("error", function(file) {
        dialogBoxClear();
        alert(data);
      });
    }
  });

  // URL取得
  $('.obtain-img-button').click(function() {
    if($('.obtain-img-url').val().length >= 12) {
      $('.dialogBox-pre').addClass('loader');
      $('.picker-area').empty();
      panelChange();

      $.ajax({
        type: 'POST',
        url: '/api/obtain-img.php',
        dataType: 'json',
        data: { url: $('.obtain-img-url').val() }
      }).done(function(data) {
        imgData = data;

        if(imgData.status == 0) {
          $('.topicPass').append('<li>'+ $('.obtain-img-url').val() +'</li>');
          $('.picker-area').html('<img id="imageData" src="data:'+ data.type +';base64,'+ data.data +'">');
          previewSet();
          $('.dialogBox-pre').removeClass('loader');
        } else if(imgData.status == 1) {
          dialogBoxClear();
          alert(msg[6]);
        }
      }).fail(function(XMLHttpRequest, textStatus, errorThrown) {
        dialogBoxClear();
        alert(errorThrown);
      });
    }
  });

  // 位置調整
  $('.dialogBoxContent').children('div, nav').css('minHeight', $('#dialogBox').height() - $('.dialogBoxHeader').outerHeight());
  $('.dialogBox-pre').css('minHeight', $('#dialogBox').height() - ($('.dialogBoxHeader').outerHeight(true) + $('.topicPass').outerHeight(true) + $('.picker-footer').outerHeight(true)));

  setCenter("#dialogBox");

  $(window).resize(function(){
    setCenter("#dialogBox");
  });

  // dialogBoxを閉じる
  $('.closeButton').click(function() {
    $('#dialogBox').fadeOut();
  });

  $('.dialogBox-changer').click(function(event) {
    $('#dialogBox').fadeToggle();
    event.stopPropagation();
  });

  $('.delete').click(function(event) {
    $('#dialogBox').fadeIn();
    $('#convert').css('visibility', 'hidden');
    localStorage.removeItem('design');
    event.stopPropagation();
  });

  $('.about').click(function() {
    $('html, body').scrollTop(0);
    if ($('#about').isVisible()) {
      $('#content').children('div').fadeOut(100);
      $('#convert').fadeIn(100);
      if(!localStorage.getItem('design')) {
        $('#dialogBox').fadeIn();
      }
    } else {
      $('#content').children('div').fadeOut(100);
      $('#about').fadeIn(100);
    }
  });

  // サイドナビ
  $('.dialogBox-nav').children('ul').children('li').click(function() {
    var index = $('.dialogBox-nav').children('ul').children('li').index(this);
    $('.dialogBox-nav').children('ul').children('li').removeClass('selected');
    $(this).addClass('selected');
    $('.dialogBoxContent').children('.panel').addClass('hide').eq(index).removeClass('hide');
  });

  $(document).on('click', '.nav-img-data', function() {
    panelChange();
  });

  // 特に意味は無い
  $('h1').children('a').hover(
    function() {
      $('h1').append('<span style="background-color: #f33;"></span><span style="background-color: #39f;"></span><span style="background-color: #0ac90a;"></span>');
      $('h1').children('span').eq(0).animate({
        'top': '42px',
        'right': '40px'
      },{
        'duration': 100,
        'easing': 'linear'
      });
      $('h1').children('span').eq(1).animate({
        'top': '43px',
        'right': '26px',
      },{
        'duration': 100,
        'easing': 'linear'
      });
      $('h1').children('span').eq(2).animate({
        'top': '41px',
        'right': '33px'
      },{
        'duration': 100,
        'easing': 'linear'
      });
    }, function() {
      $('h1').children('span').remove();
    }
  );

  // 決定
  $('.imageSet').click(function() {
    myDesign.autoSize = 0;

    if(myDesign.coordinates != null) {
      $('.convertBtton').removeAttr("disabled");
      $('.dialogBoxContent').children('nav, div').addClass('hide');
      $('.dialogBox-nav, .dialogBox-opt').removeClass('hide');
      $('.dialogBox-nav').children('ul').children('li').removeClass('selected');
      $('.dialogBox-nav').children('ul').children('li').eq(2).addClass('selected');
    } else {
      alert(msg[7]);
    }
  });

  $('.autoSize').click(function() {
    myDesign.autoSize = 1;

    $('.convertBtton').removeAttr("disabled");
    $('.dialogBoxContent').children('nav, div').addClass('hide');
    $('.dialogBox-nav, .dialogBox-opt').removeClass('hide');
    $('.dialogBox-nav').children('ul').children('li').removeClass('selected');
    $('.dialogBox-nav').children('ul').children('li').eq(2).addClass('selected');
  });

  // 変換実行
  $('.convertBtton').click(function() {
    if(imgData == null) {
      console.log(msg[8]);
    } else if($('.convertBtton').is(':disabled') == true) {
      alert(msg[9]);
    } else if(imgData.status != 0) {
      console.log('error');
    } else {
      $('#content').addClass('loader').children('div').fadeOut();
      $('#convert').fadeIn();
      $('#dialogBox').fadeOut();

      if(localStorage.getItem('design')) {
        $('#convert').css('visibility', 'hidden');
        initializationCanvas();
        miniMapClear();
        $('.palette-all').html(palette_data);
        $('.palette-ext').empty();
      }

      $.ajax({
        type: 'POST',
        url: '/api/convert.php',
        dataType: 'json',
        data: {
          id: imgData.id,
          token: imgData.token,
          accessToken: imgData.accessToken,
          myDesign: $.param(myDesign)
        }
      }).done(function(data) {
        $('.nav-img-data').remove();
        $('.obtain-img-url').val('');
        $('.topicPass').html('<li>'+ msg[0] +'</li>');
        $('#convert').css('visibility', 'visible').fadeIn();
        $('#content').removeClass('loader');
        imgData = null;
        design = data;
        localStorage.setItem('design', JSON.stringify(data));

        //console.log(design);

        initializationCanvas();
        draw();
        lineDrawing();
        numDrawing();
        miniMapClear();
        miniMapDraw();
        paletteDraw();
      }).fail(function(XMLHttpRequest, textStatus, errorThrown) {
        $('#content').removeClass('loader');
        $('#dialogBox').fadeIn();
        alert(errorThrown);
      });
    }
  });

  // CheckBox
  $('.option').find('input:checkbox').click(function() {
    if(this.checked) {
      $(this).next().addClass('checked');
    } else {
      $(this).next().removeClass('checked');
    }
  });

  $('.selectAll').click(function() {
    jcrop_api.animateTo(getRandom());
  });

  $('.pltSelect').click(function() {
    if($(this).is(':checked')) {
      $('.pltSelection').removeClass('hide');

      if(!$('.sizeSelection').hasClass('hide')) {
        $('.sizeSelection').addClass('hide');
      }

      if(!$('.paletteSelectContainer').children('div').hasClass('plt')) {
        $.ajax({
          type: 'GET',
          url: 'assets/html/palette.htm',
          dataType: 'html',
          success: function(data) {
            $('.paletteSelectContainer').html(data);

            pltPage = 0;
            $('.paletteOption').children('.submit-a').click(function() {
              var index = $('.paletteOption').children('input:button').index(this);
              var total = $('.paletteSelectContainer').children('.plt').length - 1;
              if(index == 0) {
                var page = (--pltPage < 0) ? pltPage = total : pltPage;
              } else {
                var page = (++pltPage > total) ? pltPage = 0 : pltPage;
              }
              myDesign.palette = page;
              $('.paletteSelectContainer').children('.plt').hide();
              $('.paletteSelectContainer').children('.plt').eq(page).show();
            });
          }
        });
      }
    } else {
      $('.pltSelection').addClass('hide');
      $('.paletteBox').find('.plt').hide();
      $('.paletteBox').find('.plt').eq(0).show();
      pltPage = 0;
      myDesign.palette = null;
    }
  });

  // 任意サイズ
  $('.select-size').change(function() {
    if($('option:selected', this).data('change') == 'randomSize') {
      $('.sizeSelection').removeClass('hide');

      if(!$('.pltSelection').hasClass('hide')) {
        $('.pltSelection').addClass('hide');
      }

      if(!$('#designBox').children().hasClass('design-sheet')) {
        for(var i = 0; i < 81; i++) {
          $('#designBox').append('<div class="design-sheet"></div>');
        }
      }
    } else {
      $('.sizeSelection').addClass('hide');

      var size = $('option:selected', this).val().split(',');
      myDesign.size.width = size[0];
      myDesign.size.height = size[1];

      if(typeof(jcrop_api) != "undefined") {
        jcrop_api.setOptions({ aspectRatio: myDesign.size.width/myDesign.size.height });
      }
    }
  });

  $('.select-max-color').change(function() {
    myDesign.maxColor = $('option:selected', this).text();
  });

  // Grid
  $('.sheet').draggable({
    grid: [26, 26],
    opacity: 0.9,
    containment: "#designBox"
  }).resizable({
    grid: [26, 26],
    minHeight: 25,
    minWidth: 25,
    handles: 'all',
    containment: "#designBox",
    stop: function (event, ui) {
      if(((((ui.size.width % 25)+1)*32)/32)*((((ui.size.height % 25)+1)*32)/32) <= 9) {
        var x = ((((ui.size.width % 25)+1)*32)/32);
        var y = ((((ui.size.height % 25)+1)*32)/32);

        myDesign.size.width = x * 32;
        myDesign.size.height = y * 32;

        if(typeof(jcrop_api) != "undefined") {
          jcrop_api.setOptions({ aspectRatio: x/y });
        }

        $('.sheet').css({
          'backgroundColor': 'rgba(0, 0, 0, 0.8)',
        });
      } else {
        $('.sheet').css({
          'backgroundColor': 'rgba(255, 0, 0, 0.8)',
        });
      }
    }
  });

  /*$.ajax({
    url: '/api/social-count.php',
    dataType: 'json'
  }).done(function(data) {
    $('.social > .twitter').append($('<a>').attr({
      href: 'http://twitter.com/search?q='+ data.url[0],
      target: '_blank'
    }).addClass('social-count').text(data.count.twitter));
    $('.social > .facebook').append($('<a>').addClass('social-count').text(data.count.facebook));
    $('.social > .google').append($('<a>').addClass('social-count').text(data.count.google));
    $('.social > .hatena').append($('<a>').attr({
      href: 'http://b.hatena.ne.jp/entry/'+ data.url[0],
      target: '_blank'
    }).addClass('social-count').text(data.count.hatena));
  }).fail(function(data) {
    console.log(data);
  });*/

  // キャンバス操作 ▼

  $('.c-d-n').click(function() {
    if(design != null) {
      if($(this).hasClass('on')) {
        $(this).removeClass('on');

        initializationCanvas();
        draw(sheet, palette_select);
        if($('.c-d-g').hasClass('on')) {
          lineDrawing();
        }
      } else {
        $(this).addClass('on');

        initializationCanvas();
        draw(sheet, palette_select);
        if($('.c-d-g').hasClass('on')) {
          lineDrawing();
        }
        numDrawing(sheet);
      }
    } else {
      alert(msg[10]);
    }
  });

  $('.c-d-g').click(function() {
    if(design != null) {
      if($(this).hasClass('on')) {
        $(this).removeClass(('on'));

        initializationCanvas();
        draw(sheet, palette_select);
        if($('.c-d-n').hasClass('on')) {
          numDrawing(sheet);
        }
      } else {
        $(this).addClass('on');

        initializationCanvas();
        draw(sheet, palette_select);
        lineDrawing();
        if($('.c-d-n').hasClass('on')) {
          numDrawing(sheet);
        }
      }
    }
  });

  $(document).on('click', '.c-p-c', function() {
    if($('.palette-all').hasClass('hide')) {
      $('.palette-ext').addClass('hide');
      $('.palette-all').removeClass('hide');
    } else {
      $('.palette-all').addClass('hide');
      $('.palette-ext').removeClass('hide');
    }
  });

  $(document).on('click', '.c-m-c', function() {
    if(save_option.minimap) {
      save_option.minimap = false;
      mnc.clearRect(0, 0, miniMap.width, miniMap.height);
      mnc.drawImage(thumbnail, miniMapPos.ix, miniMapPos.iy, thumbnail.width, thumbnail.height);
    } else {
      save_option.minimap = true;
      mnc.clearRect(0, 0, miniMap.width, miniMap.height);
      mnc.drawImage(thumbnail, miniMapPos.ix, miniMapPos.iy, thumbnail.width, thumbnail.height);
      miniMapGridDraw();
    }
  });

  $(document).on('click', '.palette-block > li > span', function() {
    initializationCanvas();
    if($(this).parent('li').hasClass('active')) {
      $('.paletteContainer *').removeClass('active');
      palette_select = null;
      draw(sheet);
      if($('.c-d-g').hasClass('on')) {
        lineDrawing();
      }
      if($('.c-d-n').hasClass('on')) {
        numDrawing(sheet);
      }
    } else {
      $('.palette-block').children('li').removeClass('active');
      $(this).parent('li').addClass('active');
      palette_select = $(this).parent('li').data('id');
      draw(sheet, $(this).parent('li').data('id'));
      if($('.c-d-g').hasClass('on')) {
        lineDrawing();
      }
      if($('.c-d-n').hasClass('on')) {
        numDrawing(sheet);
      }
    }
  });

  $(document).on('click', '.palette-ext > span', function() {
    initializationCanvas();
    if($(this).hasClass('active')) {
      $('.paletteContainer *').removeClass('active');
      palette_select = null;
      draw(sheet);
      if($('.c-d-g').hasClass('on')) {
        lineDrawing();
      }
      if($('.c-d-n').hasClass('on')) {
        numDrawing(sheet);
      }
    } else {
      $('.palette-ext').children('span').removeClass('active');
      $(this).addClass('active');
      palette_select = $(this).data('id');
      draw(sheet, $(this).data('id'));
      if($('.c-d-g').hasClass('on')) {
        lineDrawing();
      }
      if($('.c-d-n').hasClass('on')) {
        numDrawing(sheet);
      }
    }
  });

  $(document).on('click', '.img-dl', function() {
    screenshot('conversion');
  })

  // キャンバス操作 ▲ / ▼ 関数

  function dialogBoxClear() {
    $('.topicPass').html('<li>'+ msg[0] +'</li>');
    $('.dialogBoxContent').children('nav, div').addClass('hide');
    $('.dialogBox-nav, .dialogBox-pkt').removeClass('hide');
    $('.dialogBox-nav').children('ul').children('li').removeClass('selected');
    $('.dialogBox-nav').children('ul').children('li').eq(0).addClass('selected');
    $('.convertBtton').attr("disabled", "disabled");
    imgData = null;
  }

  function previewSet() {
    if(!$('.dialogBox-nav').find('li').hasClass('nav-img-data')) {
      $('.dialogBox-nav').children('ul').append('<li class="nav-img-data">'+ msg[11] +'</li>');
    }

    $('#imageData').Jcrop({
      onSelect: showCoords,
      onChange: showCoords,
      bgColor: 'white',
      bgOpacity: .4,
      aspectRatio: 1 / 1,
      minSize: [30, 30]
    }, function() {
      jcrop_api = this;
    });
  }

  function showCoords(c) {
    myDesign.coordinates = c;
  }

  function panelChange() {
    $('.dialogBoxContent').children('.panel, .dialogBox-nav').addClass('hide');
    $('.dialogBox-pre').removeClass('hide');
    $('.dialogBoxHeader').children('h3').text(msg[12]);
  }

  function setCenter(ele) {
    var l = Math.floor(($(window).width() - $(ele).width()) / 2);
    var t = Math.floor(($(window).height() - $(ele).height()) / 2);

    l = (l <= 10) ? 10 : l;
    t = (t <= 10) ? 10 : t;

    $(ele).css({
      "top": t,
      "left": l
    });
  }

  function initializationCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#3d3d3d";
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, 0, 20, canvas.height);

    ctx.font = '10px Verdana';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ccc';

    for(var x = 1; x < canvas.width/20; x++) {
      var num = (String(x).length == 1) ? (x * 20) + 6 : (x * 20) + 4;
      ctx.fillText(x, num, 15, 20);
    }

    for(var y = 0; y < canvas.height/20; y++) {
      var Xp = (String(y).length == 1) ? 6 : 4;
      var Tp = (y === 0) ? '' : y;
      ctx.fillText(Tp, Xp, y*20+14, 20);
    }
  }

  function draw(i, p) {
    var counter = 0;
    if(typeof(i) == "undefined") { var i = 0; }
    if(typeof(p) == "undefined") { var p = null; }

    for(var x = 0; x < 32; x++) {
      for(var y = 0; y < 32; y++) {
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';

        if(p != null) {
          var fillClr = (design['sheet'][i][counter]['id'] == p-1) ? 'rgba('+ design['sheet'][i][counter++]['rgb'] +', 1)' : 'rgba('+ design['sheet'][i][counter++]['rgb'] +', 0.3)' ;
        } else {
          var fillClr = 'rgba('+ design['sheet'][i][counter++]['rgb'] +', 1)';
        }

        ctx.fillStyle = fillClr;
        ctx.fillRect((y * 20 + 20), (x * 20 + 20), 20, 20);
      }
    }
  }

  function lineDrawing() {
    var grid = "rgba(156, 156, 156, 0.8)";
    var rule = "rgba(0, 0, 0, 0.8)";
    for(var x = 0; x < canvas.width/20; x++) {
      for(var y = 0; y < canvas.height/20; y++) {
        ctx.beginPath();
        ctx.moveTo(y * 20, x * 20);
        ctx.lineTo(y * 20, canvas.width);
        ctx.strokeStyle = grid;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x * 20, y * 20);
        ctx.lineTo(canvas.height, y * 20);
        ctx.strokeStyle = grid;
        ctx.stroke();

      }
    }

    ctx.beginPath();
    ctx.moveTo(canvas.clientHeight / 2 + 10, 0);
    ctx.lineTo(canvas.clientHeight / 2 + 10, canvas.clientWidth);
    ctx.strokeStyle = rule;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, canvas.clientWidth / 2 + 10);
    ctx.lineTo(canvas.clientHeight, canvas.clientWidth / 2 + 10);
    ctx.strokeStyle = rule;
    ctx.stroke();
  }

  function numDrawing(i) {
    var counter = 0;
    if(typeof(i) == "undefined") {
      var i = 0;
    }
    for(var x = 0; x < 32; x++) {
      for(var y = 0; y < 32; y++) {
        ctx.font = 'bold 10px Verdana';
        ctx.textAlign = 'left';
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.shadowBlur = 1;
        ctx.shadowColor = 'rgba(0, 0, 0, 1)';

        if(design['sheet'][i][counter]['num'] != false) {
          var n = design['sheet'][i][counter++]['num'];
        } else {
          var n = '';
          counter++;
        }
        var Xp = (String(n).length == 1) ? (y * 20) + 6 : (y * 20) + 3;
        ctx.fillText(n, Xp + 20, (x * 20 + 20) + 14, 20);
      }
    }
  }

  function miniMapClear() {
    mnc.clearRect(0, 0, miniMap.width, miniMap.height);
  }

  function miniMapDraw() {
    thumbnail = new Image();
    thumbnail.src = 'data:image/jpeg;base64,'+ design.thumbnail;
    thumbnail.onload = function() {
      miniMapPos.ix = (miniMap.clientWidth - thumbnail.width) / 2;
      miniMapPos.iy = (miniMap.clientHeight - thumbnail.height) / 2;
      mnc.imageSmoothingEnabled = false;
      mnc.mozImageSmoothingEnabled = false;
      mnc.webkitImageSmoothingEnabled = false;
      mnc.drawImage(thumbnail, miniMapPos.ix, miniMapPos.iy, thumbnail.width, thumbnail.height);
      miniMapGridDraw();

      if(!$('.miniMapContainer > *').hasClass('miniMapOptions')) {
        $('.miniMapContainer').append('<ul class="miniMapOptions clearfix"></ul>');
        $('.miniMapContainer').children('ul').append('<li><input type="button" value="'+ tool[9] +'" class="submit c-m-c"></li>');
      }
    }
  }

  function miniMapGridDraw() {
    for(var x = 0; x < design.size.x; x++) {
      for(var y = 0; y < design.size.y; y++) {
        mnc.strokeRect(miniMapPos.ix + (x * (thumbnail.width / design.size.x)), miniMapPos.iy + (y * (thumbnail.height / design.size.y)), (thumbnail.width / design.size.x), (thumbnail.height / design.size.y));
      }
    }
  }

  function mouseDownListner(e) {
    var rect = e.target.getBoundingClientRect();
    //座標取得
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;

    if((miniMapPos.ix <= mx) && (miniMapPos.iy <= my)) {
      if(((miniMapPos.ix + thumbnail.width) >= mx) && (miniMapPos.iy + thumbnail.height) >= my) {
        var ixb = thumbnail.width / design.size.x;
        var iyb = thumbnail.height / design.size.y;
        var loop = 0;
        for(var ii = 0; ii < design.size.x; ii++) {
          for(var i = 0; i < design.size.y; i++) {
            if((miniMapPos.ix + (ii * ixb) <= mx) && (miniMapPos.iy + (i * iyb) <= my)) {
              if(((miniMapPos.ix + (ii * ixb) + ixb) >= mx) && ((miniMapPos.iy + (i * iyb) + iyb) >= my)) {

                initializationCanvas();
                draw(loop, palette_select);
                if($('.c-d-g').hasClass('on')) {
                  lineDrawing();
                }
                if($('.c-d-n').hasClass('on')) {
                  numDrawing(loop);
                }
                sheet = loop;
                break;
              }
            }
            loop++;
          }
        }
      }
    }
  }

  function paletteDraw() {
    $.ajax({
      type: 'GET',
      url: '/assets/html/palette.html',
      dataType: 'html',
      success: function(data) {
        palette_data = data;
        $('.palette-all').html(data);
        $('.palette-ext').empty();

        var counter = 0;
        $.each(design.palette.id, function(key, value) {
          var id = key;
          var hex = value;
          $('.palette-block').children('li').each(function() {
            if($(this).data('id') == id) {
              $(this).html('<span>'+ ++counter +'</span>');

              $('.palette-ext').append('<span style="background-color: #'+ hex +';" data-id="'+ id +'">'+ counter +'</span>');
            }
          });
        });

        if(!$('.optionMenu').find('input').hasClass('c-p-c')) {
          $('.optionMenu').append('<li><input type="button" class="submit c-p-c" value="'+ msg[13] +'"></li>');
        }
      }
    });
  }

  function screenshot(id) {
    var canvas = document.getElementById(id);
    var base64 = canvas.toDataURL();
    var blob = base64toBlob(base64);
    saveBlob(blob, "design.png");
  }

  function saveBlob(_blob,_file) {
    var url = (window.URL || window.webkitURL);
    var data = url.createObjectURL(_blob);
    var e = document.createEvent("MouseEvents");
    e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

    var a = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
    a.href = data;
    a.download = _file;
    a.dispatchEvent(e);
  }

  function base64toBlob(_base64) {
    var i;
    var tmp = _base64.split(',');
    var data = atob(tmp[1]);
    var mime = tmp[0].split(':')[1].split(';')[0];
    var buff = new ArrayBuffer(data.length);
    var arr = new Uint8Array(buff);
    for (i = 0; i < data.length; i++) {arr[i] = data.charCodeAt(i);}
    var blob = new Blob([arr], { type: mime });
    return blob;
  }

  function tobimy_info() {
    $('#wrapper').children('header').after('');

    $(document).on('click', '#tobimy_info .close', function() {
      $('#tobimy_info').fadeOut(250);
    });
  }
});

$.fn.isVisible = function() {
  return $.expr.filters.visible(this[0]);
};
