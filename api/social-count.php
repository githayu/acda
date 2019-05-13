<?php

function getTweetCount($url) {
  $sum = 0;

  for($i = 0; $i < count($url); $i++) {
    $uri = 'http://urls.api.twitter.com/1/urls/count.json?url='. urlencode($url[$i]);
    $data = file_get_contents($uri);
    $data = json_decode($data, true);
    $sum += $data['count'];
  }

  return $sum;
}

function getLikeCount($url) {
  $sum = 0;

  for($i = 0; $i < count($url); $i++) {
    $uri = 'https://graph.facebook.com/'. urlencode($url[$i]);
    $data = file_get_contents($uri);
    $data = json_decode($data, true);
    $sum += $data['shares'];
  }

  return $sum;
}

function getHatenaCount($url) {
  $sum = 0;

  for($i = 0; $i < count($url); $i++) {
    $uri = 'http://api.b.st-hatena.com/entry.count?url='. urlencode($url[$i]);
    $data = file_get_contents($uri);
    $sum += (int)$data;
  }

  return $sum;
}

function getGooglePlusCount($url) {
  $sum = 0;

  for($i = 0; $i < count($url); $i++) {
    $uri = 'https://apis.google.com/_/+1/fastbutton?url='. urlencode($url[$i]);
    $data = file_get_contents($uri);
    preg_match('/\[2,([0-9.]+),\[/', $data, $count);
    $sum += (int)$count[1];
  }

  return $sum;
}

// ソーシャルカウント数集計
$url = [
  'https://acnl.hayu.io',
  'http://app.nanoway.net/tobimy/',
  'http://app.nicofinder.net/tobimy',
  'http://app.nicofinder.net/tobimy/2',
  'http://app.nicofinder.net/tobimori-mydesign'
];

$count = [
  'twitter' => getTweetCount($url),
  'facebook' => getLikeCount($url),
  'google' => getGooglePlusCount($url),
  'hatena' => getHatenaCount($url)
];

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  'url' => $url,
  'count' => $count
]);
