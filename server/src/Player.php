<?php
namespace MazeServer;

class Player
{
    public static int $id = -1;
    public string $nickname;
    public int $mid;
    public $x;
    public $y;
    public $tIndexX;
    public $tIndexY;
    public $done = false;

    public function __construct($nickname, $x, $y, $tIndexX, $tIndexY)
    {
        self::$id++;
        $this->mid = self::$id;
        $this->nickname = $nickname;
        $this->x = $x;
        $this->y = $y;
        $this->tIndexX = $tIndexX;
        $this->tIndexY = $tIndexY;
    }
}