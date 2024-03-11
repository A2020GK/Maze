<?php
namespace MazeServer;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use SplObjectStorage;

class Server implements MessageComponentInterface
{
    protected SplObjectStorage $connections;
    protected array $maze;
    protected function newMaze()
    {
        console_log("Generating new maze...","Maze generator");
        $this->maze = convertMaze(generateMazeOld(20, 20));
        $text="";
        for($y=0;$y<count($this->maze);$y++) {
            for($x=0;$x<count($this->maze[$y]);$x++) {
                $text.=$this->maze[$y][$x]==2?"[]":"  ";
            }
            $text.="\n";
        }
        console_log("Generated new maze: \n$text","Maze generator");
    }
    public function __construct()
    {
        console_log("Initializing...");
        $this->newMaze();
        $this->connections = new SplObjectStorage();
        console_log("Server started.");
    }
    public function onOpen(ConnectionInterface $conn)
    {
        $this->connections->attach($conn, new Player("__none", 1.5 * 64, 1.5 * 64, 0, 11));
        $player = $this->connections[$conn];
        console_log("Player connected. Id = {$player->mid}; Resource id = {$conn->resourceId}","Player manager");
        foreach ($this->connections as $client) {
            if ($conn !== $client) {
                $client->send("np " . json_encode($player, JSON_UNESCAPED_UNICODE));
            }
        }
    }
    public function newGame()
    {
        console_log("Every player has solved the maze. Starting new game...");
        $this->newMaze();
        foreach ($this->connections as $conn) {
            $p = $this->connections[$conn];
            $p->x = 1.5 * 64;
            $p->y = 1.5 * 64;
            $p->tIndexX = 0;
            $p->tIndexY = 11;
        }
        $players = [];
        foreach ($this->connections as $conn) {
            $players[] = $this->connections[$conn];
        }
        foreach ($this->connections as $conn) {
            $conn->send("map " . json_encode($this->maze));
            $conn->send("you " . json_encode($this->connections[$conn], JSON_UNESCAPED_UNICODE) . " full");
            $conn->send("players " . json_encode($players, JSON_UNESCAPED_UNICODE));
        }
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $player= $this->connections[$from];
        $msg = explode(" ", trim($msg));
        if ($msg[0] == "map") {
            console_log("Player {$player->nickname} (Id = {$player->mid}; Resource id = {$from->resourceId}) is requesting for map. Sending...","Player manager");
            $from->send("map " . json_encode($this->maze));
        } else if ($msg[0] == "update") {
            console_log("Player {$player->nickname} (Id = {$player->mid}; Resource id = {$from->resourceId}) updates. New params: [{$msg[1]};{$msg[2]};{$msg[3]};{$msg[4]};{$msg[5]};{$msg[6]}]","Player manager");
            $player->nickname = $msg[1];
            $player->x = intval($msg[2]);
            $player->y = intval($msg[3]);
            $player->tIndexX = intval($msg[4]);
            $player->tIndexY = intval($msg[5]);
            $player->done = intval($msg[6]) == 1 ? true : false;

            $from->send("you " . json_encode($this->connections[$from], JSON_UNESCAPED_UNICODE));

            foreach ($this->connections as $conn) {
                if ($from !== $conn) {
                    $conn->send("up " . json_encode($this->connections[$from], JSON_UNESCAPED_UNICODE));
                }
            }
            $globDone = true;
            foreach ($this->connections as $conn) {
                $p = $this->connections[$conn];
                if (!$p->done) {
                    $globDone = false;
                    break;
                }
            }
            if ($globDone) {
                $this->newGame();
            }

        } else if ($msg[0] == "players") {
            console_log("Player {$player->nickname} (Id = {$player->mid}; Resource id = {$from->resourceId}) is requesting for other players data. Sending...","Player manager");
            $players = [];
            foreach ($this->connections as $conn) {
                $players[] = $this->connections[$conn];
            }
            $from->send("players " . json_encode($players, JSON_UNESCAPED_UNICODE));
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $player=$this->connections[$conn];
        foreach ($this->connections as $p) {
            $p->send("dp {$this->connections[$conn]->mid}");
        }
        $this->connections->detach($conn);
        console_log("Player {$player->nickname} (Id = {$player->mid}; Resource id = {$conn->resourceId}) has disconnected","Player manager");
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        console_log("Something went wrong. Error message: ".$e->getMessage(),"Error handler");
    }
}