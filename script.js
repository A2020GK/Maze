// ==== DOM Objects ====
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// This code keeps the canvas size fit the screen size
function updateSize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
addEventListener("resize", updateSize);
updateSize();

let maze = convertMaze(generateMazeOld(20, 20)); // Converts old realization to cells (yep legacy lol)

let map = [...maze] // Idk why is it here, I wanted to add some lobby rooms :)


let size = 32; // Cell cize
let player_size = size / 4; // Player size (var name lol)

let moveCof = Math.floor(size / 8); // Move speed: px/frame
let camera_move_start_precentage = 40; // Where to start moving camera

let camera = {
    x: Math.floor(-canvas.width * (camera_move_start_precentage / 100)), // Camera position X
    y: Math.floor(-canvas.height * (camera_move_start_precentage / 100)) // Camera position Y
}


let player = {
    x: size + player_size * 2, y: size + player_size * 2, // Basic position
    cell: { // Current player cell
        x: 1,
        y: 1
    }
}

const keyboard = { // Keyboard legacy object (maybe will add mobile controls idk)
    w: false,
    a: false,
    s: false,
    d: false
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Fatal destruction of everything

    for (let y = 0; y < map.length; ++y) for (let x = 0; x < map[y].length; x++) { // Cell rendering
        if (map[y][x] == 2) ctx.fillStyle = "black"; // #nigercell
        else if (map[y][x] == 1) ctx.fillStyle = "#909090";
        if (x == map[y].length - 2 && y == map.length - 2) ctx.fillStyle = "#0000ff";
        if (map[y][x] != 0)
            ctx.fillRect(x * size - camera.x, y * size - camera.y, size, size);

    }

    // ctx.fillStyle = "purple";
    // ctx.fillRect(player.cell.x * size - camera.x, player.cell.y * size - camera.y, size, size);

    ctx.fillStyle = "red"; // <insert baller meme here>
    ctx.beginPath();
    ctx.arc(player.x - camera.x, player.y - camera.y, player_size, 0, 2 * Math.PI);
    ctx.fill();

    // Text stats
    ctx.fillStyle = "red";
    ctx.font = "16px Arial monospace";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ctx.fillText(`FPS: ${fps}`, 5, 10);
    ctx.fillText(`Player: ${player.x}x${player.y} (Cell ${player.cell.x}x${player.cell.y})`, 5, 25);
    ctx.fillText(`Camera: ${camera.x}x${camera.y}`, 5, 40);
}

// FPS Vars
const fpsFilterStrength = 20;
let fpsFrameTime = 0, fpsLastLoop = new Date; fpsThisLoop = null;
let fps = "--.-";

// Loop function
function app() {
    // Math
    player.cell.x = Math.floor(player.x / size);
    player.cell.y = Math.floor(player.y / size);

    // Math x2 (this handles player moves and collisions)
    if (keyboard.w) {
        if (map[player.cell.y - 1][player.cell.x] == 2) {
            if (player.y - player_size > player.cell.y * size) player.y -= moveCof;
        } else if (map[player.cell.y - 1][player.cell.x] == 1) player.y -= moveCof;
    }
    if (keyboard.a) {
        if (map[player.cell.y][player.cell.x - 1] == 2) {
            if (player.x - player_size > player.cell.x * size) player.x -= moveCof;
        } else if (map[player.cell.y][player.cell.x - 1] == 1) player.x -= moveCof;
    }
    if (keyboard.s) {
        if (map[player.cell.y + 1][player.cell.x] == 2) {
            if (player.y + player_size < player.cell.y * size + size) player.y += moveCof;
        } else if (map[player.cell.y + 1][player.cell.x] == 1) player.y += moveCof;
    }
    if (keyboard.d) {
        if (map[player.cell.y][player.cell.x + 1] == 2) {
            if (player.x + player_size < player.cell.x * size + size) player.x += moveCof;
        } else if (map[player.cell.y][player.cell.x + 1] == 1) player.x += moveCof;
    }

    // Camera controls
    let player_render_x = player.x - camera.x;
    let player_render_y = player.y - camera.y;

    if (player_render_x > canvas.width * (1 - camera_move_start_precentage / 100)) camera.x += moveCof;
    if (player_render_x < canvas.width * (camera_move_start_precentage / 100)) camera.x -= moveCof;
    if (player_render_y > canvas.height * (1 - camera_move_start_precentage / 100)) camera.y += moveCof;
    if (player_render_y < canvas.height * (camera_move_start_precentage / 100)) camera.y -= moveCof;

    render(); // Boom! Render!

    if (player.cell.x == map[map.length - 1].length - 2 && player.cell.y == map.length - 2) {
        maze = convertMaze(generateMazeOld(20, 20));
        map = [...maze];
        player.x = size + player_size * 2;
        player.y = size + player_size * 2;
    }

    // FPS Handler
    let fpsThisFrameTime = (fpsThisLoop = new Date) - fpsLastLoop;
    fpsFrameTime += (fpsThisFrameTime - fpsFrameTime) / fpsFilterStrength;
    fpsLastLoop = fpsThisLoop;

    requestAnimationFrame(app); // Infinite loop! Woooo!
}

// Wrapper from JS API to my legacy keyboard object
document.addEventListener("keydown", function (event) {
    const code = event.code;
    const new_state = true;

    if (code == "KeyW") keyboard.w = new_state;
    if (code == "KeyA") keyboard.a = new_state;
    if (code == "KeyS") keyboard.s = new_state;
    if (code == "KeyD") keyboard.d = new_state;
});
document.addEventListener("keyup", function (event) {
    const code = event.code;
    const new_state = false;

    if (code == "KeyW") keyboard.w = new_state;
    if (code == "KeyA") keyboard.a = new_state;
    if (code == "KeyS") keyboard.s = new_state;
    if (code == "KeyD") keyboard.d = new_state;
});

setInterval(function () { fps = (1000 / fpsFrameTime).toFixed(1); }, 1000);

// Let's GOOOOO
app();