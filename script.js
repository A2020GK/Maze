// ==== DOM Objects ====
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

let maze = convertMaze(generateMazeOld(20, 20)); // Converts old realization to cells (yep legacy lol)

let map = [...maze] // Idk why is it here, I wanted to add some lobby rooms :)


let size = 32 * 2; // Cell cize
let player_size = 48; // Player size (var name lol)

let moveCof = 4; // Move speed: px/frame
let camera_move_start_precentage = 30; // Where to start moving camera

let camera = {
    x: Math.floor(-canvas.width * (camera_move_start_precentage / 100)), // Camera position X
    y: Math.floor(-canvas.height * (camera_move_start_precentage / 100)) // Camera position Y
}

let player = {
    x: 1.5 * size,
    y: 1.5 * size,
    walkCof: 0,
    last_direction: "right",
    texture: new Sprite(new CaImage("spritesheet.png"), 64, 0, 7),
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

    },
    canMove() {
        let canMove = {
            up: true,
            down: true,
            left: true,
            right: true
        };

        let xLeft=player.x-player_size/2;
        let yTop=player.y-player_size/2;
        let xRight=player.x+player_size/2;
        let yBottom=player.y+player_size/2;

        // LT = XL+YT; RT = XR+YT; LB = XL+YB; RB = XR+YB
        
        let cellRight=Math.floor(xRight/size);
        let cellLeft=Math.floor(xLeft/size);
        let cellTop=Math.floor(yTop/size);
        let cellBottom=Math.floor(yBottom/size);

        if(player.y+player_size/2==cellBottom*size) cellBottom--;
        if(player.x+player_size/2==cellRight*size) cellRight--;

        canMove.up=!((map[cellTop-1][cellLeft]==2||map[cellTop-1][cellRight]==2)&&(player.y-player_size/2)==cellTop*size);
        canMove.down=!((map[cellBottom+1][cellLeft]==2||map[cellBottom+1][cellRight]==2)&&(player.y+player_size/2==cellBottom*size+size));
        canMove.left=!((map[cellTop][cellLeft-1]==2||map[cellBottom][cellLeft-1]==2)&&(player.x-player_size/2==cellLeft*size));
        canMove.right=!((map[cellTop][cellRight+1]==2||map[cellBottom][cellRight+1]==2)&&(player.x+player_size/2==cellRight*size+size));

        return canMove;
    }
}

const keyboard = { // Keyboard legacy object
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

    // ctx.fillStyle = "red"; // <insert baller meme here>
    // ctx.lineWidth=1;
    // ctx.beginPath();
    // ctx.arc(player.x - camera.x, player.y - camera.y, player_size, 0, 2 * Math.PI);
    // ctx.fill();
    // ctx.stroke();

    player.texture.render(ctx, player.x - player_size / 2 - camera.x, player.y - player_size / 2 - camera.y, player_size, player_size);

    // // Hitbox rendering
    // ctx.fillStyle = "rgba(255,0,0,0.3)";
    // ctx.fillRect(player.x - player_size / 2 - camera.x, player.y - player_size / 2 - camera.y, player_size, player_size);

    // Text stats
    ctx.fillStyle = "red";
    ctx.font = "16px Arial monospace";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ctx.fillText(`FPS: ${fps}`, 5, 10);
    ctx.fillText(`Player: ${player.x}x${player.y}`, 5, 25);
    ctx.fillText(`Camera: ${camera.x}x${camera.y}`, 5, 40);
    ctx.fillText(`Joystick: ${joystick_direction.join("-")}`, 5, 55);
}

// FPS Vars
const fpsFilterStrength = 20;
let fpsFrameTime = 0, fpsLastLoop = new Date; fpsThisLoop = null;
let fps = "--.-";

// Loop function
function app() {

    joystick_direction = [...joystick.GetDir()];
    let availableDirections = player.canMove();

    // Joystick: WASD = NWSE
    if (keyboard.w || joystick_direction.includes("N")) {
        if (availableDirections.up) player.move(0, -moveCof);
    }
    if (keyboard.a || joystick_direction.includes("W")) {
        if (availableDirections.left) player.move(-moveCof, 0);
    }
    if (keyboard.s || joystick_direction.includes("S")) {
        if (availableDirections.down) player.move(0, moveCof);
    }
    if (keyboard.d || joystick_direction.includes("E")) {
        if (availableDirections.right) player.move(moveCof, 0);
    }
    if (!keyboard.w && !keyboard.a && !keyboard.s && !keyboard.d && joystick_direction.includes("C")) {
        player.walkCof = 0;
        player.texture.indexX = 0;
    }


    // Camera controls
    let player_render_x = player.x - camera.x;
    let player_render_y = player.y - camera.y;

    if (player_render_x > canvas.width * (1 - camera_move_start_precentage / 100)) camera.x += moveCof;
    if (player_render_x < canvas.width * (camera_move_start_precentage / 100)) camera.x -= moveCof;
    if (player_render_y > canvas.height * (1 - camera_move_start_precentage / 100)) camera.y += moveCof;
    if (player_render_y < canvas.height * (camera_move_start_precentage / 100)) camera.y -= moveCof;

    render(); // Boom! Render!

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

setInterval(function () { fps = (1000 / fpsFrameTime).toFixed(1); }, 1000);

// Let's GOOOOO
app();