<?php
ini_set('display_errors', 'Off');
require_once('config.php');

require_once __DIR__ . '/../vendor/autoload.php';

list($mainLanguage, $text) = getLanguage();

use Google\Cloud\Storage\StorageClient;

$storage = new StorageClient([
  'keyFilePath' => __DIR__ . '/../service-account.json'
]);

$bucket = $storage->bucket('acnl-hayu-io.appspot.com');



function h($s) {
  return htmlspecialchars($s, ENT_QUOTES, "UTF-8");
}

function getSha256Password($s) {
  return hash_hmac('sha256', $s, PASSWORD_KEY);
}

// CSRF対策
function setToken() {
  $token = sha1(uniqid(mt_rand(), true));
  $_SESSION['token'] = $token;
}

function checkToken() {
  if (empty($_SESSION['token']) || ($_SESSION['token'] != $_POST['accessToken'])) {
    echo 'Unauthorised access';
    exit;
  }
}

// 言語取得
function getLanguage() {
  require_once('language.php');

  if (isset($_COOKIE['language'])) {

    $mainLanguage = $_COOKIE['language'];
    $text = $index[$_COOKIE['language']];

  } elseif (isset($_GET['la'])) {

    $mainLanguage = $_GET['la'];
    $text = $index[$_GET['la']];

  } elseif (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {

    $mainLanguage = explode(',', $_SERVER['HTTP_ACCEPT_LANGUAGE']);

    switch ($mainLanguage[0]) {
      case 'ja':
        $mainLanguage = 'ja';
        $text = $index[$mainLanguage];
        break;
      case 'en':
      case 'en-gb':
      case 'en-GB':
      case 'en-us':
      case 'en-US':
        $mainLanguage = 'en';
        $text = $index[$mainLanguage];
        break;
      default:
        $mainLanguage = 'ja';
        $text = $index[$mainLanguage];
        break;
    }
  }

  return array($mainLanguage, $text);
}

// 画像リサイズ
function resize_image(array $options) {

  // デフォルト値の設定
  $defaults = array(
    'gcsBucket' => null,
    'gcsPath' => null,
    'imgPath' => null,
    'max_width' => 400,
    'max_height' => 400,
    'quality' => 90
  );

  extract($options + $defaults);

  // 画像の情報を取得
  $size = getimagesize($imgPath);

  $temp = tempnam(sys_get_temp_dir(), mt_rand());

  // ファイルから画像の作成。画像のタイプによって関数を使い分ける
  switch($size[2]) {
    case IMAGETYPE_PNG:
    case IMAGETYPE_GIF:
      $image = new Imagick($imgPath);
      $image->setImageFormat('jpeg');
      $image->setImageCompressionQuality(100);
      file_put_contents($temp, $image);
      $image = imagecreatefromjpeg($temp);
      break;
    case IMAGETYPE_JPEG:
      $image = imagecreatefromjpeg($imgPath);
      break;
    default:
      return false;
  }

  // 指定したサイズ以上のものを縮小
  $width = $size[0];
  $height = $size[1];

  if($width > $max_width) {
    $height *= $max_width / $width;
    $width = $max_width;
  }

  if($height > $max_height) {
    $width *= $max_height / $height;
    $height = $max_height;
  }

  // 新規画像の作成
  $new_image = imagecreatetruecolor($width, $height);

  // GIFとPNGの透過情報
  if($size[2] === IMAGETYPE_GIF || $size[2] === IMAGETYPE_PNG) {
    $index = imagecolortransparent($image);

    if($index >= 0) {

      $color = imagecolorsforindex($image, $index);
      $alpha = imagecolorallocate($new_image, $color['red'], $color['green'], $color['blue']);
      imagefill($new_image, 0, 0, $alpha);
      imagecolortransparent($new_image, $alpha);

    } else if($size[2] === IMAGETYPE_PNG) {

      imagealphablending($new_image, false);
      $color = imagecolorallocatealpha($new_image, 0, 0, 0, 127);
      imagefill($new_image, 0, 0, $color);
      imagesavealpha($new_image, true);

    }
  }

  // リサンプル
  imagecopyresampled($new_image, $image, 0, 0, 0, 0, $width, $height, $size[0], $size[1]);

  // 保存しない場合出力するためにHTTPヘッダを送信
  // if(!$save_path) {
  //   $save_path = null;
  //   header("Content-Type: {$size['mime']}");
  // }

  // 各関数、第二引数がnullの場合は生の画像ストリームが直接出力されます。
  switch($size[2]) {
    case IMAGETYPE_GIF:
      imagegif($new_image, $temp);

      $image = new Imagick($temp);
      $image->setImageFormat('jpeg');
      $image->setImageCompressionQuality(100);
      // $image->writeImage($temp);

      $result = $gcsBucket->upload($image->getImageBlob(), [
        'name' => $gcsPath
      ]);
      break;

    case IMAGETYPE_JPEG:
      imagejpeg($new_image, $temp, $quality);

      $result = $gcsBucket->upload(fopen($temp, 'r'), [
        'name' => $gcsPath
      ]);
      break;

    case IMAGETYPE_PNG:
      imagepng($new_image, $temp, floor($quality * 0.09));

      $image = new Imagick($temp);
      $image->setImageFormat('jpeg');
      $image->setImageCompressionQuality(100);
      // $image->writeImage($temp);

      $result = $gcsBucket->upload($image->getImageBlob(), [
        'name' => $gcsPath
      ]);
      break;
  }

  // メモリ上の画像データを破棄
  imagedestroy($image);
  imagedestroy($new_image);

  return $result;
}

function hexSet($canvas, $num, $rgb_id, $plt_id) {
  $counter = 0;
  foreach($canvas[$num] as $rgb) {
    $canvas[$num][$counter]['hex'] = str_pad(dechex($rgb['red']), 2, "0", STR_PAD_LEFT).str_pad(dechex($rgb['green']), 2, "0", STR_PAD_LEFT).str_pad(dechex($rgb['blue']), 2, "0", STR_PAD_LEFT);

    $hexKey = array_keys($rgb_id);
    $canvas[$num][$counter]['num'] = array_search($canvas[$num][$counter]['hex'], $plt_id);
    $canvas[$num][$counter]['id'] = array_search($canvas[$num][$counter]['hex'], $hexKey);

    $counter++;
  }

  return $canvas;
}
