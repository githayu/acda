<?php

require __DIR__.'/vendor/autoload.php';

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

$app = new \Slim\App;

$app->get('/', function($request, $response, $args) {
  require 'app.php';
});

$app->post('/api/upload-status.php', function () {
  require 'api/upload-status.php';
});

$app->post('/api/convert.php', function () {
  require 'api/convert.php';
});

$app->post('/api/obtain-img.php', function () {
  require 'api/obtain-img.php';
});

$app->run();