<?php
ini_set('display_errors', 'Off');
require_once('functions.php');

session_start();

// CSRF対策
if(!empty($_SEVER['REQUEST_METHOD']) != 'POST') {
  setToken();
} else {
  checkToken();
}

session_write_close();

// 画像なら保存
if(isset($_FILES["file"])) {
  if($_FILES["file"]["error"] == UPLOAD_ERR_OK) {
    $tmp_name = $_FILES["file"]["tmp_name"];
    $error = $_FILES['file']['error'];

    $gcsDirPath = 'images/'. date('Y-m-d/');
    $id = md5(uniqid(mt_rand()));

    switch($_FILES['file']['type']) {
      case 'image/jpeg':
        $type = '.jpeg';
        break;
      case 'image/png':
        $type = '.png';
        break;
      case 'image/gif':
        $type = '.gif';
        break;
      default:
        $error = 100;
        break;
    }

    if($error != 100) {
      $gcsPath = $gcsDirPath.$id.'.jpeg';

      $image = new Imagick($tmp_name);
      $image->setImageFormat('jpeg');
      $image->setImageCompressionQuality(100);

      $object = $bucket->upload($image->getImageBlob(), [
        'name' => $gcsPath
      ]);
    }
  }
}

$gcsUrl = $object->signedUrl(new \DateTime('tomorrow'));

// リサイズ＆上書き保存
$newObject = resize_image(array(
  'gcsBucket' => $bucket,
  'gcsPath' => $gcsPath,
  'imgPath' => $gcsUrl,
  'max_width' => 700,
  'max_height' => 400,
  'quality' => 100
));


// 出力データ
$objectInfo = $newObject->info();
$string = $newObject->downloadAsString();
$data = base64_encode($string);

$output = array(
  'status' => $error,
  'id' => $id,
  'type' => $objectInfo['contentType'],
  'data' => $data,
  'token' => getSha256Password($id),
  'accessToken' => $_SESSION['token']
);

header('Content-Type: application/javascript; charset=utf-8');
echo json_encode($output);
