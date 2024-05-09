# Web Maze
Simple maze written in JavaScript
## Features
- Maze generation (Deep-First Search)
- Multiplayer (PHP Websocket Server, Ratchet used)
- Mobile joystick
- Spritesheet analysis (you can build your own characters using Sprite Editors)
- Automatic Maze solution (under development)
## Server installation
Requirements:
- PHP 8.2+
- Composer

Unpack server, than run 
```bash
$ composer install
```

To run server on port 8080 run
```bash
$ ifconfig # Get your local IP
$ php MazeServer.php
```
If you want to launch application server (front-end), I consider PHP built-in development Server (Maybe I will add options for Ratchet server later) run:
```bash
$ php -S {Your local IP}:80
```
## Bug Report
You can report bugs in GitHub Issues (recommended), also you can text me in [Telegram](https://t.me/a2020gk) and Discord (A2020GK).