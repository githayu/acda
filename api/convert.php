<?php
ini_set('display_errors', 'Off');
require_once('functions.php');
require_once('rgb-index.php');

// CSRF対策
session_start();
checkToken();
session_write_close();

// Token Check
if(!empty($_POST['id']) && !empty($_POST['token'])) {
	if(getSha256Password($_POST['id']) !== $_POST['token']) {
		echo $text['other'][0];
		exit;
	}
}

// Convert Data Check
if(!empty($_POST['myDesign'])) {
	parse_str($_POST['myDesign'], $design);
	$design['size']['x'] = ceil(intval($design['size']['width']) / 32);
	$design['size']['y'] = ceil(intval($design['size']['height']) / 32);

	// サイズチェック
	if(($design['size']['x'] * $design['size']['y']) > 9) {
		echo $text['other'][0];
		exit;
	}

} else {
	echo $text['other'][0];
	exit;
}

// ID Check
$dirName = date('Y-m-d/');
$fileName = $dirName.$_POST['id'].'.jpeg';
$object = $bucket->object('images/'.$fileName);

if(!empty($_POST['id']) && $object->exists()) {
	$file = $object->signedUrl(new \DateTime('tomorrow'));
}

// パレット指定
if(!empty($design['palette'])) {
	$rgb['red'] = $ColorPaletteIndex[$design['palette']]['red'];
	$rgb['green'] = $ColorPaletteIndex[$design['palette']]['green'];
	$rgb['blue'] = $ColorPaletteIndex[$design['palette']]['blue'];
}

// 画像の読み込み
$image = imagecreatefromjpeg($file);

// 新規画像の作成
$new_image = imagecreatetruecolor($design['size']['width'], $design['size']['height']);

// リサンプル
if ($design['autoSize'] == 1) {
	$image_info = getimagesize($file);
	imagecopyresampled($new_image, $image, 0, 0, 0, 0, $design['size']['width'], $design['size']['height'], $image_info[0], $image_info[1]);
} elseif ($design['autoSize'] == 0) {
	imagecopyresampled($new_image, $image, 0, 0, $design['coordinates']['x'], $design['coordinates']['y'], $design['size']['width'], $design['size']['height'], $design['coordinates']['w'], $design['coordinates']['h']);
} else {
	echo $text['other'][1];
	exit;
}

// 画像のRGB値を取得
for($x = 0; $x < $design['size']['width']; $x++){
	for($y = 0; $y < $design['size']['height']; $y++) {
		$_rgb = imagecolorat($new_image, $x, $y);
		$colors[] = imagecolorsforindex($new_image, $_rgb);
	}
}

// 最大159色に減色
$counter = 0;
for($x = 0; $x < $design['size']['width']; $x++){
	for($y = 0; $y < $design['size']['height']; $y++) {
		for($i = 0; $i < count($rgb['red']); $i++) {
			$rgb_distance[$i] = array(
				pow($colors[$counter]['red'] - $rgb['red'][$i], 2) + pow($colors[$counter]['green'] - $rgb['green'][$i], 2) + pow($colors[$counter]['blue'] - $rgb['blue'][$i], 2),
				'rgb' => array(
					'r' => $rgb['red'][$i],
					'g' => $rgb['green'][$i],
					'b' => $rgb['blue'][$i]
				)
			);
		}

		array_multisort($rgb_distance);

		$newcolor = imagecolorallocate($new_image, $rgb_distance[0]['rgb']['r'], $rgb_distance[0]['rgb']['g'], $rgb_distance[0]['rgb']['b']);
		imagesetpixel($new_image, $x, $y, $newcolor);

		$counter++;
		unset($rgb_distance);
	}
}

// 画像のRGB値を取得2
unset($colors, $_rgb);
for($x = 0; $x < $design['size']['width']; $x++){
	for($y = 0; $y < $design['size']['height']; $y++) {
		$_rgb = imagecolorat($new_image, $x, $y);
		$colors[] = imagecolorsforindex($new_image, $_rgb);
	}
}

// RGB値をHex変換
foreach ($colors as $rgb) {
	$colors_hex['hex'][] = str_pad(dechex($rgb['red']), 2, "0", STR_PAD_LEFT).str_pad(dechex($rgb['green']), 2, "0", STR_PAD_LEFT).str_pad(dechex($rgb['blue']), 2, "0", STR_PAD_LEFT);
}

// 全カラーコードのカウント＆ソート（降順）
$colors_hex['num'] = array_count_values($colors_hex['hex']);
	arsort($colors_hex['num']);

// 指定色以上の場合更に減色
if(count($colors_hex['num']) > intval($design['maxColor'])) {
	$colors_hex['many'] = array_keys(array_slice($colors_hex['num'], 0, intval($design['maxColor']), true));
	$colors_hex['low'] = array_keys(array_slice($colors_hex['num'], intval($design['maxColor']), null, true));

	foreach($colors_hex['many'] as $many) {
		$colors_hex_many_split = str_split($many, 2);
		$colors_rgb['many'][] = array(
			'r' => intval(hexdec($colors_hex_many_split[0])),
			'g' => intval(hexdec($colors_hex_many_split[1])),
			'b' => intval(hexdec($colors_hex_many_split[2]))
		);
	}

	foreach($colors_hex['low'] as $low) {
		$colors_hex_low_split = str_split($low, 2);
		$colors_rgb['low'][] = array(
			'r' => intval(hexdec($colors_hex_low_split[0])),
			'g' => intval(hexdec($colors_hex_low_split[1])),
			'b' => intval(hexdec($colors_hex_low_split[2]))
		);
	}

	$counter = 0;
	for($x = 0; $x < $design['size']['width']; $x++){
		for($y = 0; $y < $design['size']['height']; $y++) {
			for($i = 0; $i < 15; $i++) {
				foreach($colors_rgb['low'] as $low) {
					if($colors[$counter]['red'] == $low['r'] && $colors[$counter]['green'] == $low['g'] && $colors[$counter]['blue'] == $low['b']) {
						$rgb_distance[$i] = array(
							pow($colors[$counter]['red'] - $colors_rgb['many'][$i]['r'], 2) + pow($colors[$counter]['green'] - $colors_rgb['many'][$i]['g'], 2) + pow($colors[$counter]['blue'] - $colors_rgb['many'][$i]['b'], 2),
							'rgb' => array(
								'r' => $colors_rgb['many'][$i]['r'],
								'g' => $colors_rgb['many'][$i]['g'],
								'b' => $colors_rgb['many'][$i]['b']
							)
						);
					}
				}
			}

			if(!empty($rgb_distance)) {
				array_multisort($rgb_distance);

				$newcolor = imagecolorallocate($new_image, $rgb_distance[0]['rgb']['r'], $rgb_distance[0]['rgb']['g'], $rgb_distance[0]['rgb']['b']);
				imagesetpixel($new_image, $x, $y, $newcolor);
			}

			$counter++;
			unset($rgb_distance);
		}
	}
}

// 画像のRGB値を取得3
unset($colors, $_rgb);
for($x = 0; $x < $design['size']['width']; $x++){
	for($y = 0; $y < $design['size']['height']; $y++) {
		$_rgb = imagecolorat($new_image, $x, $y);
		$colors[] = imagecolorsforindex($new_image, $_rgb);
	}
}

// RGB値をHex変換
unset($colors_hex);
foreach ($colors as $rgb) {
	$colors_hex['hex'][] = str_pad(dechex($rgb['red']), 2, "0", STR_PAD_LEFT).str_pad(dechex($rgb['green']), 2, "0", STR_PAD_LEFT).str_pad(dechex($rgb['blue']), 2, "0", STR_PAD_LEFT);
}

// 全カラーコードのカウント＆ソート（降順）
$colors_hex['num'] = array_count_values($colors_hex['hex']);
	arsort($colors_hex['num']);
$colors_hex['key'] = array_keys($colors_hex['num']);
$colors_hex_id = array_keys($rgb_id);

foreach($colors_hex['key'] as $rgb => $value) {
	$_rgb_id = array_search($value, $colors_hex_id);
	if($_rgb_id !== null) {
		$colors_hex['id'][$_rgb_id+1] = (string)$value;
	}
}

ksort($colors_hex['id']);

$counter = 1;
foreach($colors_hex['id'] as $key => $value) {
	$colors_hex['plt'][$counter++] = $value;
}

// 画像
$work = imagecreatetruecolor(32, 32);
$counter = 0;
for($x = 0; $x < $design['size']['x']; $x++){
	for($y = 0; $y < $design['size']['y']; $y++) {
		imagecopy($work, $new_image, 0, 0, $x*32, $y*32, 32, 32);

		for($xa = 0; $xa < 32; $xa++) {
			for($ya = 0; $ya < 32; $ya++) {
				$_rgb_ = imagecolorat($work, $ya, $xa);
				$canvas[$counter][] = imagecolorsforindex($work, $_rgb_);
			}
		}

		$counter++;
	}
}
imagedestroy($work);

// javascriptへ値を渡す配列作成
for($i = 0; $i < $design['size']['x'] * $design['size']['y']; $i++) {
	$canvas = hexSet($canvas, $i, $rgb_id, $colors_hex['plt']);

	foreach($canvas[$i] as $key) {
		$clrdata['sheet'][$i][] = array(
			"rgb" => array($key['red'], $key['green'], $key['blue']),
			"num" => $key['num'],
			"id" => $key['id']
		);
	}
}

// 出力
$tmp = tempnam(sys_get_temp_dir(), $_POST['id']);
$result = imagejpeg($new_image, $tmp, 100);

$bucket->upload(fopen($tmp, 'r'), [
	'name' => 'thumbnails/'. $fileName
]);

$clrdata['thumbnail'] = base64_encode(file_get_contents($tmp));
$clrdata['size'] = array(
	'x' => $design['size']['x'],
	'y' => $design['size']['y']
);
$clrdata['palette']['id'] = $colors_hex['id'];
$clrdata['palette']['all'] = $colors_hex['num'];

header('Content-Type: text/javascript; charset=utf-8');
echo json_encode($clrdata);
