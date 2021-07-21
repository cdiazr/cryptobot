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

Config::load();

$port = Config::get('serverPort');
$server = new \Wrench\Server("ws://127.0.0.1:$port/");

$server->registerApplication('starter', new \Wrench\Application\Starter());
$server->run();


function manejo_error ($errno, $errstr, $errfile = false, $errline = false, $errcontext = false ) {
    throw new Exception($errstr, $errno);
}





?>