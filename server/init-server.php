<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

set_error_handler('manejo_error');

require_once __DIR__ .'/Config.class.php';
require __DIR__ . '/vendor/autoload.php';
require __DIR__.'/vendor/wrench/wrench/lib/unirest/Unirest.php';

Config::load();

$url = 'ws://127.0.0.1:'.$argv[1].'/';

echo "\n INIT SERVER: $url \n";

$server = new \Wrench\Server($url);

$server->registerApplication('binancehttp', new \Wrench\Application\BinanceHttp());
$server->run();


function manejo_error ($errno, $errstr, $errfile = false, $errline = false, $errcontext = false ) {
    throw new Exception($errstr, $errno);
}




?>