<?php

require_once 'api/functions.php';

?>
<!DOCTYPE html>
<html lang="<?php echo $mainLanguage; ?>" itemscope itemtype="http://schema.org/Other">
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#">
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=Edge">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?php echo $text['all'][0] ?></title>
  <meta name="keywords" content="とびだせどうぶつの森,マイデザイン,マイデザインツール,ツール,ジェネレーター,Animal Crossing,New Leaf,Custom Design Assistant">
  <meta name="description" content="<?php echo $text['all'][2] ?>">
  <meta name="author" content="Hayu">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://acnl.hayu.io">
  <meta property="og:image" content="https://acnl.hayu.io/favicon.ico">
  <meta property="og:title" content="<?php echo $text['all'][0] ?>">
  <meta property="og:description" content="<?php echo $text['all'][2] ?>">
  <meta property="og:site_name" content="acnl.hayu.io">
  <meta property="fb:admins" content="100005212231778">
  <meta itemprop="name" content="<?php echo $text['all'][0] ?>">
  <meta itemprop="description" content="<?php echo $text['all'][2] ?>">
  <meta itemprop="image" content="https://acnl.hayu.io/favicon.ico">

  <!--

    <?php echo $text['all'][3] ?>

  -->

  <link rel="shortcut icon" href="favicon.ico">
  <link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/themes/smoothness/jquery-ui.css" />
  <link rel="stylesheet" href="https://unpkg.com/normalize.css/normalize.css" media="all">
  <link rel="stylesheet" href="/assets/css/index.min.css?150626" media="all">
</head>
<body>

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-29288789-5', 'auto');
  ga('send', 'pageview');

</script>

<div id="wrapper">

  <header>
    <div id="header">
      <h1><a href="./" <?php if($mainLanguage == 'en') { echo 'class="en"'; } else { echo 'class="ja"'; } ?>><?php echo $text['all'][1] ?></a></h1>
      <ul class="createPanel clearfix">
        <li><input type="button" value="<?php echo $text['all'][5] ?>" class="btn dialogBox-changer" title="<?php echo $text['all'][6] ?>"></li>
        <li><input type="button" value="<?php echo $text['all'][7] ?>" class="btn delete"></li>
      </ul>
    </div>
  </header>

  <div id="content">
    <div id="convert" class="clearfix">
      <div id="canvas">
        <canvas id="conversion">
          <img src="/assets/img/html5.png" alt="HTML5" style="margin: 25px 50px;">
          <p><?php echo $text['all'][4] ?></p>
        </canvas>
      </div>

      <div id="side">
        <div class="miniMapContainer">
          <canvas id="miniMap"></canvas>
        </div>
        <div class="optionMenuContainer">
          <ul class="optionMenu">
            <li><input type="button" class="submit c-d-n on" value="<?php echo $text['all'][8] ?>"></li>
            <li><input type="button" class="submit c-d-g on" value="<?php echo $text['all'][9] ?>"></li>
          </ul>
        </div>
        <div class="paletteContainer">
          <div class="palette-all clearfix"></div>
          <div class="palette-ext clearfix hide"></div>
        </div>
      </div>
    </div>

    <div id="about">
      <dl class="about-inner">
        <dt><h2><?php echo $text['about'][0] ?></h2></dt>
        <dd>
          <div class="section-info clearfix">
            <ul>
              <li class="clearfix">
                <div class="image-container">
                  <img src="/assets/img/loading.gif" data-original="/assets/img/about/about_001.png" alt="1">
                </div>
                <div class="description"><?php echo $text['about'][1] ?></div>
                <span>1</span>
              </li>
              <li class="clearfix">
                <div class="image-container">
                  <img src="/assets/img/loading.gif" data-original="/assets/img/about/about_002.png" alt="2">
                </div>
                <div class="description"><?php echo $text['about'][2] ?></div>
                <span>2</span>
              </li>
              <li class="clearfix">
                <div class="image-container">
                  <img src="/assets/img/loading.gif" data-original="/assets/img/about/about_003.png" alt="3">
                </div>
                <div class="description"><?php echo $text['about'][3] ?></div>
                <span>3</span>
              </li>
              <li class="clearfix">
                <div class="image-container">
                  <img src="/assets/img/loading.gif" data-original="/assets/img/about/about_004.png" alt="4">
                </div>
                <div class="description"><?php echo $text['about'][4] ?></div>
                <span>4</span>
              </li>
              <li class="clearfix">
                <div class="image-container">
                  <img src="/assets/img/loading.gif" data-original="/assets/img/about/about_005.png" alt="5">
                </div>
                <div class="description"><?php echo $text['about'][5] ?></div>
                <span>5</span>
              </li>
            </ul>
          </div>
        </dd>
      </dl>

      <div class="site-info clearfix">
        <div>
          <h2><?php echo $text['summary'][0] ?></h2>
          <ul class="description2 iroha">
            <li><?php echo $text['summary'][1] ?></li>
            <li><?php echo $text['summary'][2] ?></li>
            <li><?php echo $text['summary'][3] ?></li>
            <li><?php echo $text['summary'][4] ?></li>
          </ul>
        </div>
        <div>
          <h2><?php echo $text['browser'][0] ?></h2>
          <ul class="description2">
            <li><span class="icon-chrome"> Google Chrome 7 ～</span></li>
            <li><span class="icon-firefox"> Firefox 4 ～</span></li>
            <li><span class="icon-ie"> Internet Explorer 10 ～</span></li>
            <li><span class="icon-opera"> Opera 12 ～ <?php echo $text['browser'][1] ?></span></li>
            <li><span style="margin-left: 32px;"> Safari 6 ～</span></li>
          </ul>
        </div>
      </div>
      <div class="disclaimer">
        <h2><?php echo $text['disclaimer'][0] ?></h2>
        <div class="description2"><?php echo $text['disclaimer'][1] ?></div>
      </div>
    </div>

    <div id="dialogBox">
      <div class="dialogBoxContainer">
        <header class="dialogBoxHeader">
          <h3><?php echo $text['dialog'][0] ?></h3>
          <span class="closeButton">
            <span class="close"></span>
          </span>
        </header>

        <div class="dialogBoxContent clearfix">
          <nav class="dialogBox-nav">
            <ul>
              <li class="nav-img-file selected"><?php echo $text['dialog'][1] ?></li>
              <li class="nav-img-url"><?php echo $text['dialog'][2] ?></li>
              <li class="nav-option"><?php echo $text['dialog'][3] ?></li>
            </ul>
            <input type="button" class="submit convertBtton" value="<?php echo $text['dialog'][4] ?>" disabled>
          </nav>
          <div class="dialogBox-pkt panel">
            <div class="stage">
              <p class="default message"><?php echo $text['dialog'][5] ?></p>
            </div>
          </div>
          <div class="dialogBox-url panel hide">
            <p class="panel-msg"><?php echo $text['dialog'][6] ?></p>
            <div class="obtain-img">
              <input type="text" placeholder="<?php echo $text['dialog'][7] ?>" class="text obtain-img-url" size="30">
              <input type="button" value="<?php echo $text['dialog'][8] ?>" class="submit obtain-img-button">
            </div>
          </div>
          <div class="dialogBox-opt panel hide">
            <p class="panel-msg"><?php echo $text['dialog'][9] ?></p>
            <div class="optionContainer">
              <ul class="option">
                <li><label><input type="checkbox" class="pltSelect"><span class="check"></span><span><?php echo $text['dialog'][10] ?></span></label></li>
                <li class="pltSelection hide">
                  <div class="paletteBox">
                    <div class="paletteSelectContainer"></div>
                    <div class="paletteOption">
                      <input type="button" class="submit-a palette-prev" value="◀">
                      <input type="button" class="submit-a palette-next" value="▶">
                    </div>
                  </div>
                </li>
                <li>
                  <label>
                  <select name="size" class="select-size">
                    <optgroup label="<?php echo $text['dialog'][11] ?>">
                      <option value="32,32" title="<?php echo $text['dialog'][12] ?>" selected>32×32</option>
                      <option value="64,64" title="<?php echo $text['dialog'][13] ?>">64×64</option>
                      <option value="96,96" title="<?php echo $text['dialog'][14] ?>">96×96</option>
                    </optgroup>
                    <optgroup label="<?php echo $text['dialog'][15] ?>">
                      <option value="16,16" title="<?php echo $text['dialog'][16] ?>">16×16</option>
                      <option value="16,32" title="<?php echo $text['dialog'][17] ?>">16×32</option>
                      <option value="32,48" title="<?php echo $text['dialog'][18] ?>">32×48</option>
                      <option value="52,64" title="<?php echo $text['dialog'][19] ?>">52×64</option>
                    </optgroup>
                    <optgroup label="<?php echo $text['dialog'][20] ?>">
                      <option value="32,32" title="<?php echo $text['dialog'][21] ?>" data-change="randomSize"><?php echo $text['dialog'][22] ?></option>
                    </optgroup>
                  </select>
                  <span><?php echo $text['dialog'][23] ?></span></label>
                </li>
                <li class="sizeSelection hide">
                  <div class="design-select">
                    <div id="designBox">
                      <div class="sheet"></div>
                    </div>
                  </div>
                </li>
                <li>
                  <label>
                  <select name="color" class="select-max-color">
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                    <option value="13">13</option>
                    <option value="14">14</option>
                    <option value="15" selected>15</option>
                  </select>
                  <span><?php echo $text['dialog'][24] ?></span></label>
                </li>
              </ul>
            </div>
          </div>
          <div class="dialogBox-pre hide">
            <ul class="topicPass"><li><?php echo $text['dialog'][25] ?></li></ul>
            <div class="picker-area"></div>
            <div class="picker-footer">
              <div><input type="button" value="<?php echo $text['dialog'][26] ?>" class="submit-b imageSet"><input type="button" value="<?php echo $text['dialog'][27] ?>" class="submit-b autoSize" title="<?php echo $text['dialog'][28] ?>"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <div id="footer">
      <dl class="footerNav clearfix">
        <dt><h2>MENU</h2></dt>
        <dd>
          <ul class="footerNavMenu clearfix">
            <li><a class="about">About</a></li>
            <li><a href="<?php echo $text['other']['official'] ?>">Official</a></li>
          </ul>
        </dd>
      </dl>
      <ul class="social clearfix">
        <li class="twitter"><a href="https://twitter.com/share" class="twitter-share-button">Tweet</a></li>
        <li class="facebook"><div class="fb-like" data-layout="button_count" data-action="like" data-show-faces="true" data-share="false"></div></li>
        <li class="line"><div class="line-it-button" data-lang="ja" data-type="share-a" data-ver="3" data-url="https://social-plugins.line.me/ja/how_to_install#lineitbutton" data-color="default" data-size="small" data-count="false" style="display: none;"></div></li>
        <li class="hatena"><a href="http://b.hatena.ne.jp/entry/http://acnl.hayu.io" class="hatena-bookmark-button" data-hatena-bookmark-title="マイデザイン作成支援ツール - とびだせどうぶつの森" data-hatena-bookmark-layout="simple-balloon" title="このエントリーをはてなブックマークに追加"><img src="https://b.st-hatena.com/images/entry-button/button-only@2x.png" alt="このエントリーをはてなブックマークに追加" width="20" height="20" style="border: none;" /></a></li>
      </ul>
    </div>

    <div class="footer-sup clearfix">
      <div class="translate">
        <select id="language">
          <option value="en"<?php if($mainLanguage == 'en') { echo ' selected'; } ?>>English</option>
          <option value="ja"<?php if($mainLanguage == 'ja') { echo ' selected'; } ?>>日本語</option>
        </select>
        <p class="translator"><?php echo $text['other']['translator'] ?></p>
      </div>
      <div class="copyright">
        <span class="version">ver.3.1.1</span>
        <small>© 2012-<?php echo date('Y'); ?> <a href="https://blog.hayu.io/web/tobimori-my-design">hayu.io</a></small>
      </div>
    </div>
  </footer>
</div>

<script>var msg = <?php echo json_encode($text['alert']) ?>, tool = <?php echo json_encode($text['all']) ?>;</script>
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min.js"></script>
<script src="/assets/js/index.js?160917"></script>
<script src="/assets/js/dropzone.js"></script>
<script src="/assets/js/jquery.Jcrop.js"></script>
<script src="/assets/js/jquery.lazyload.js"></script>
<script src="/assets/js/jquery.cookie.js"></script>

<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>

<div id="fb-root"></div>
<script>(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/ja_JP/sdk.js#xfbml=1&version=v2.3&appId=133712920164211";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));</script>

<script src="https://d.line-scdn.net/r/web/social-plugin/js/thirdparty/loader.min.js" async="async" defer="defer"></script>

<script type="text/javascript" src="https://b.st-hatena.com/js/bookmark_button.js" charset="utf-8" async="async"></script>

</body>
</html>
