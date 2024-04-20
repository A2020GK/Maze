const onlineMode = confirm("Запустить мултиплеер?");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let joystick = new JoyStick("joystick_el");
let joystick_direction = ["C"];

// This code keeps the canvas size fit the screen size
function updateSize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
addEventListener("resize", updateSize);
updateSize();

let serverAddress = onlineMode ? prompt("Введите адрес сервера") : null;
let server = null; // WebSocket object will be created here later

let nickname = prompt("Введите ваш ник") ?? "Игрок";
nickname=nickname.trim();
if (nickname == "") nickname = "Игрок";

// ==== Render & collision settings ====
let blockSize = 64;
let playerSize = 48;
let moveCof = 4;
let cameraMoveScreenPrecentage = 30; // When to move camera

let camera = {
    x: Math.floor(-canvas.width * (cameraMoveScreenPrecentage / 100)), // Camera position X
    y: Math.floor(-canvas.height * (cameraMoveScreenPrecentage / 100)) // Camera position Y
}

// This is a class for any Player, no matter, offline or online. 
class Player {
    x = 1.5 * blockSize;
    y = 1.5 * blockSize;
    done = false;
    walkFrameId = 0;
    onlineId = -1; // If the multiplayer is not enabled, player has -1 as id
    nickname = "Игрок";
    texture = new Sprite(new CaImage("textures/spritesheet.png"), 64, 0, 11)
    move(xof, yof) {
        if (yof < 0) this.texture.indexY = 8;
        else if (yof > 0) this.texture.indexY = 10;
        else if (xof > 0) this.texture.indexY = 11;
        else if (xof < 0) this.texture.indexY = 9;

        this.walkCof += 1;
        if (this.walkCof >= 8) this.walkCof = 0;
        this.texture.indexX = this.walkCof;

        this.x += xof;
        this.y += yof;

        if (this.x > (map[0].length - 2) * blockSize && this.y > (map.length - 2) * blockSize) this.done = true; else this.done = false;
        if (onlineMode) onlineUpdate();
    }
    resetMove() {
        if (this.walkCof != 0) {
            this.walkCof = 0;
            this.texture.indexX = this.walkCof;
            if (onlineMode) onlineUpdate();
        }
    }
    canMove(map) {
        let canMove = {
            up: true,
            down: true,
            left: true,
            right: true
        };

        let xLeft = this.x - playerSize / 2;
        let yTop = this.y - playerSize / 2;
        let xRight = this.x + playerSize / 2;
        let yBottom = this.y + playerSize / 2;

        // LT = XL+YT; RT = XR+YT; LB = XL+YB; RB = XR+YB

        let cellRight = Math.floor(xRight / blockSize);
        let cellLeft = Math.floor(xLeft / blockSize);
        let cellTop = Math.floor(yTop / blockSize);
        let cellBottom = Math.floor(yBottom / blockSize);

        if (this.y + playerSize / 2 == cellBottom * blockSize) cellBottom--;
        if (this.x + playerSize / 2 == cellRight * blockSize) cellRight--;

        canMove.up = !((map[cellTop - 1][cellLeft] == 2 || map[cellTop - 1][cellRight] == 2) && (this.y - playerSize / 2) == cellTop * blockSize);
        canMove.down = !((map[cellBottom + 1][cellLeft] == 2 || map[cellBottom + 1][cellRight] == 2) && (this.y + playerSize / 2 == cellBottom * blockSize + blockSize));
        canMove.left = !((map[cellTop][cellLeft - 1] == 2 || map[cellBottom][cellLeft - 1] == 2) && (this.x - playerSize / 2 == cellLeft * blockSize));
        canMove.right = !((map[cellTop][cellRight + 1] == 2 || map[cellBottom][cellRight + 1] == 2) && (this.x + playerSize / 2 == cellRight * blockSize + blockSize));

        return canMove;
    }
}

function onlineUpdate() {
    if (onlineMode) {
        server.send(`update ${currentPlayer.nickname} ${currentPlayer.x} ${currentPlayer.y} ${currentPlayer.texture.indexX} ${currentPlayer.texture.indexY} ${currentPlayer.done ? 1 : 0}`);
    }
}

let players = [];
let currentPlayer;

const globalTextures = {
    wall: new CaImage("textures/wall.jpg"),
    air: new CaImage("textures/air.jpg")
}

let map = [];

let onlineAskedFor = {
    onlineId: false,
    map: false,
    players: false
}

const keyboard = { // Keyboard legacy object
    w: false,
    a: false,
    s: false,
    d: false
}

function onlineMessage(msg) {
    msg = msg.data;
    msg = msg.split(" ");
    if (msg[0] == "you") {
        let data = JSON.parse(msg[1]);
        currentPlayer.onlineId = data.mid;
        if (msg[2]) {
            currentPlayer.x = data.x;
            currentPlayer.y = data.y;
            currentPlayer.texture.indexX = data.tIndexX;
            currentPlayer.texture.indexY = data.tIndexY;
        }
    } else if (msg[0] == "map") {
        let data = JSON.parse(msg[1]);
        map = data;
    } else if (msg[0] == "np") {
        let np = new Player();
        let data = JSON.parse(msg[1]);
        np.onlineId = data.mid;
        np.nickname = data.nickname;
        players.push(np);
    } else if (msg[0] == "dp") {
        let onlineId = msg[1];
        for (let i = 0; i < players.length; i++) {
            if (players[i].onlineId == onlineId) players.splice(i, 1);
        }
    } else if (msg[0] == "up") {
        let data = JSON.parse(msg[1]);
        for (let i = 0; i < players.length; i++) {
            if (players[i].onlineId == data.mid) {
                players[i].nickname = data.nickname;
                players[i].x = data.x;
                players[i].y = data.y;
                players[i].texture.indexX = data.tIndexX;
                players[i].texture.indexY = data.tIndexY;
            }
        }
    } else if (msg[0] == "players") {
        players = [];
        let data = JSON.parse(msg[1]);
        for (let i = 0; i < data.length; i++) {
            if (currentPlayer.onlineId == data[i].mid) continue;
            let p = new Player();
            p.onlineId = data[i].mid;
            p.nickname = data[i].nickname;
            p.texture.indexX = data[i].tIndexX;
            p.texture.indexY = data[i].tIndexY;
            p.x = data[i].x;
            p.y = data[i].y;
            players.push(p);
        }
        players.push(currentPlayer);
    }
}

// Keyboard handlers
document.addEventListener("keydown", function (event) {
    const code = event.code;
    const new_state = true;

    if (code == "KeyW" || code == "ArrowUp") keyboard.w = new_state;
    if (code == "KeyA" || code == "ArrowLeft") keyboard.a = new_state;
    if (code == "KeyS" || code == "ArrowDown") keyboard.s = new_state;
    if (code == "KeyD" || code == "ArrowRight") keyboard.d = new_state;
});
document.addEventListener("keyup", function (event) {
    const code = event.code;
    const new_state = false;

    if (code == "KeyW" || code == "ArrowUp") keyboard.w = new_state;
    if (code == "KeyA" || code == "ArrowLeft") keyboard.a = new_state;
    if (code == "KeyS" || code == "ArrowDown") keyboard.s = new_state;
    if (code == "KeyD" || code == "ArrowRight") keyboard.d = new_state;
});

let readyToRender=false;

function render() {
    if (readyToRender) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Fatal destruction of everything

        for (let y = 0; y < map.length; ++y) for (let x = 0; x < map[y].length; x++) { // Cell rendering
            if (map[y][x] == 2) {
                ctx.drawImage(globalTextures.wall, x * blockSize - camera.x, y * blockSize - camera.y, blockSize, blockSize);
            } else if (x == map[y].length - 2 && y == map.length - 2) {
                ctx.fillStyle = "#0000ff";
                ctx.fillRect(x * blockSize - camera.x, y * blockSize - camera.y, blockSize, blockSize);
            } else if (map[y][x] == 1) {
                ctx.drawImage(globalTextures.air, x * blockSize - camera.x, y * blockSize - camera.y, blockSize, blockSize);
            }
        }

        for (let i = 0; i < players.length; i++) {
            players[i].texture.render(ctx, players[i].x - playerSize / 2 - camera.x, players[i].y - playerSize / 2 - camera.y, playerSize, playerSize);
            ctx.font = "20px Arial";
            ctx.fillStyle = "red";
            ctx.font = "16px Arial monospace";
            ctx.textBaseline = "top";
            ctx.textAlign = "center";
            ctx.fillText(players[i].nickname, players[i].x - camera.x, players[i].y - playerSize / 2 - 5 - camera.y);
        }
    }
    requestAnimationFrame(render);
}

function app() {
    if (currentPlayer == undefined) {
        currentPlayer = new Player();
        currentPlayer.nickname = nickname;
        players.push(currentPlayer);
    }
    if (onlineMode) {
        if (server == null) {
            server = new WebSocket(`ws://${serverAddress}:8080`);
            server.addEventListener("open", app);
            server.addEventListener("message", onlineMessage);
            server.addEventListener("error", event => alert("Произошла сетевая ошибка. Игра может быть нестабильной."));
            return;
        }
        if (server.readyState != WebSocket.OPEN) {
            alert("Соединение с сервером потеряно. Синхронизация остановлена.");
            return;
        }
        if (currentPlayer.onlineId == -1) {
            if (!onlineAskedFor.onlineId) {
                onlineUpdate();
                onlineAskedFor.onlineId = true;
            }
        }
        if (map.length == 0) {
            if (!onlineAskedFor.map) {
                server.send("map");
                onlineAskedFor.map = true;
            }
        }
        if (players.length <= 1) {
            if (!onlineAskedFor.players) {
                server.send("players");
                onlineAskedFor.players = true;
            }
        }
    } else {
        if (map.length == 0) map = convertMaze(generateMazeOld(20, 20));
    }
    joystick_direction = [...joystick.GetDir()];

    let canMove = true; // Can player move at all (if we wouldn't check this, there could be a problem with sync)
    if (onlineMode) if (!(currentPlayer.onlineId != -1 && map.length > 0 && players.length > 0)) canMove = false;

    if (canMove) {
        let availableDirections = currentPlayer.canMove(map);

        // Joystick: WASD = NWSE
        if (keyboard.w || joystick_direction.includes("N")) {
            if (availableDirections.up) currentPlayer.move(0, -moveCof);
        }
        if (keyboard.a || joystick_direction.includes("W")) {
            if (availableDirections.left) currentPlayer.move(-moveCof, 0);
        }
        if (keyboard.s || joystick_direction.includes("S")) {
            if (availableDirections.down) currentPlayer.move(0, moveCof);
        }
        if (keyboard.d || joystick_direction.includes("E")) {
            if (availableDirections.right) currentPlayer.move(moveCof, 0);
        }
        if (!keyboard.w && !keyboard.a && !keyboard.s && !keyboard.d && joystick_direction.includes("C")) {
            currentPlayer.resetMove();
        }
    }

    if (!onlineMode && currentPlayer.done) {
        currentPlayer.x = blockSize * 1.5;
        currentPlayer.y = blockSize * 1.5;
        currentPlayer.resetMove();
        map = convertMaze(generateMazeOld(20, 20));
    }

    let player_render_x = currentPlayer.x - camera.x;
    let player_render_y = currentPlayer.y - camera.y;

    if (player_render_x > canvas.width * (1 - cameraMoveScreenPrecentage / 100)) camera.x += moveCof;
    if (player_render_x < canvas.width * (cameraMoveScreenPrecentage / 100)) camera.x -= moveCof;
    if (player_render_y > canvas.height * (1 - cameraMoveScreenPrecentage / 100)) camera.y += moveCof;
    if (player_render_y < canvas.height * (cameraMoveScreenPrecentage / 100)) camera.y -= moveCof;

    readyToRender=true;
    setTimeout(app,1000/60);
}

app();
render();