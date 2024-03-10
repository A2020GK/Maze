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
        echo "Generating new maze...\n";
        $this->maze = convertMaze(generateMazeOld(20, 20));
    }
    public function __construct()
    {
        echo "Initializing...\n";
        $this->newMaze();
        $this->connections = new SplObjectStorage();
        echo "==== SERVER STARTED ====\n";
    }
    public function onOpen(ConnectionInterface $conn)
    {
        $this->connections->attach($conn, new Player("__none", 1.5 * 64, 1.5 * 64, 0, 11));
        echo "A player {$conn->resourceId} has connected\n";
        $player = $this->connections[$conn];
        foreach ($this->connections as $client) {
            if ($conn !== $client) {
                $client->send("np " . json_encode($player, JSON_UNESCAPED_UNICODE));
            }
        }
    }
    public function newGame()
    {
        echo "Starting new Game...\n";
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
        echo "Player {$from->resourceId} ({$this->connections[$from]->nickname}) says  \"$msg\"\n";
        $msg = explode(" ", trim($msg));
        if ($msg[0] == "map") {
            $from->send("map " . json_encode($this->maze));
        } else if ($msg[0] == "update") {
            $this->connections[$from]->nickname = $msg[1];
            $this->connections[$from]->x = intval($msg[2]);
            $this->connections[$from]->y = intval($msg[3]);
            $this->connections[$from]->tIndexX = intval($msg[4]);
            $this->connections[$from]->tIndexY = intval($msg[5]);
            $this->connections[$from]->done = intval($msg[6]) == 1 ? true : false;

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
            $players = [];
            foreach ($this->connections as $conn) {
                $players[] = $this->connections[$conn];
            }
            $from->send("players " . json_encode($players, JSON_UNESCAPED_UNICODE));
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        foreach ($this->connections as $p) {
            $p->send("dp {$this->connections[$conn]->mid}");
        }
        $this->connections->detach($conn);
        echo "A player {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
    }
}