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

// ファイル
$gcsDirPath = 'images/'. date('Y-m-d/');
$id = md5(uniqid(mt_rand()));
$gcsPath = $gcsDirPath.$id.'.jpeg';

// リサイズ＆保存
$newObject = resize_image(array(
	'gcsBucket' => $bucket,
	'gcsPath' => $gcsPath,
	'imgPath' => $_POST['url'],
	'max_width' => 700,
	'max_height' => 400,
	'quality' => 100
));

// 出力データ
$objectInfo = $newObject->info();
$string = $newObject->downloadAsString();
$data = base64_encode($string);

if($data == null) {
	$status = 1;
} else {
	$status = 0;
}

$output = array(
	'status' => $status,
	'id' => $id,
	'type' => $objectInfo['contentType'],
	'data' => $data,
	'token' => getSha256Password($id),
	'accessToken' => $_SESSION['token']
);

header('Content-Type: application/javascript; charset=utf-8');
echo json_encode($output);

/*echo '<pre style="margin-top: 50px;">';
print_r($type);
echo '</pre>';*/
