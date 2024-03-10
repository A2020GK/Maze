<?php
use MazeServer\Server;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

require_once __DIR__ . "/vendor/autoload.php";

echo <<<intro
===========================
Copyright A2020GK 2024
Maze 2.0 Multiplayer server
===========================
\n
intro;

$server = IoServer::factory(
    new HttpServer(new WsServer(new Server())),
    8080
);

$server->run();