const onlineMode = confirm("Do you want to launch in Online Mode?");

if (onlineMode) {
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

    let serverAddr = prompt("Plase enter server address");
    let nickname = prompt("Please enter your nickname");

    let server = new WebSocket(`ws://${serverAddr}:8080`);

    let size = 64;

    let player_size = 48; // Player size (var name lol)

    let moveCof = 4; // Move speed: px/frame
    let camera_move_start_precentage = 30; // Where to start moving camera

    let camera = {
        x: Math.floor(-canvas.width * (camera_move_start_precentage / 100)), // Camera position X
        y: Math.floor(-canvas.height * (camera_move_start_precentage / 100)) // Camera position Y
    }


    class Player {
        x = 1.5 * size
        y = 1.5 * size
        done = false
        walkCof = 0
        id = -1
        nickname = nickname
        texture = new Sprite(new CaImage("spritesheet.png"), 64, 0, 11)
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

            if (this.x > (map[0].length - 2) * size && this.y > (map.length - 2) * size) this.done = true; else this.done = false;

            update();

        }
        resetMove() {
            if (this.walkCof != 0) {
                this.walkCof = 0;
                this.texture.indexX = this.walkCof;
                update();
            }
        }
        canMove(map) {
            let canMove = {
                up: true,
                down: true,
                left: true,
                right: true
            };

            let xLeft = this.x - player_size / 2;
            let yTop = this.y - player_size / 2;
            let xRight = this.x + player_size / 2;
            let yBottom = this.y + player_size / 2;

            // LT = XL+YT; RT = XR+YT; LB = XL+YB; RB = XR+YB

            let cellRight = Math.floor(xRight / size);
            let cellLeft = Math.floor(xLeft / size);
            let cellTop = Math.floor(yTop / size);
            let cellBottom = Math.floor(yBottom / size);

            if (this.y + player_size / 2 == cellBottom * size) cellBottom--;
            if (this.x + player_size / 2 == cellRight * size) cellRight--;

            canMove.up = !((map[cellTop - 1][cellLeft] == 2 || map[cellTop - 1][cellRight] == 2) && (this.y - player_size / 2) == cellTop * size);
            canMove.down = !((map[cellBottom + 1][cellLeft] == 2 || map[cellBottom + 1][cellRight] == 2) && (this.y + player_size / 2 == cellBottom * size + size));
            canMove.left = !((map[cellTop][cellLeft - 1] == 2 || map[cellBottom][cellLeft - 1] == 2) && (this.x - player_size / 2 == cellLeft * size));
            canMove.right = !((map[cellTop][cellRight + 1] == 2 || map[cellBottom][cellRight + 1] == 2) && (this.x + player_size / 2 == cellRight * size + size));

            return canMove;
        }
    }

    let me = new Player();

    const wallTexture=new CaImage("wall.jpg");
    const airTexture=new CaImage("air.jpg");

    let players = [];
    let map = [];

    let askedFor = {
        id: false,
        map: false,
        players: false
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
            if(map[y][x]==2) {
                ctx.drawImage(wallTexture,x*size-camera.x,y*size-camera.y,size,size);
            } else if(x == map[y].length - 2 && y == map.length - 2) {
                ctx.fillStyle="#0000ff";
                ctx.fillRect(x * size - camera.x, y * size - camera.y, size, size);
            } else if(maze[y][x]==1) {
                ctx.drawImage(airTexture,x*size-camera.x,y*size-camera.y,size,size);
            }
        }

        for (let i = 0; i < players.length; i++) {
            players[i].texture.render(ctx, players[i].x - player_size / 2 - camera.x, players[i].y - player_size / 2 - camera.y, player_size, player_size);
            ctx.font = "20px Arial";
            ctx.fillStyle = "red";
            ctx.font = "16px Arial monospace";
            ctx.textBaseline = "top";
            ctx.textAlign = "center";
            ctx.fillText(players[i].nickname, players[i].x - camera.x, players[i].y - player_size / 2 - 5 - camera.y);
        }

    }

    function app() {
        if(server.readyState!=WebSocket.OPEN) {
            alert("Connection lost.");
            return;
        }
        if (me.id == -1) {
            if (!askedFor.id) {
                update();
                askedFor.id = true;
            }
        }
        if (map.length == 0) {
            if (!askedFor.map) {
                server.send("map");
                askedFor.map = true;
            }
        }
        if (players.length == 0) {
            if (!askedFor.players) {
                server.send("players");
                askedFor.players = true;
            }
        }

        if (me.id != -1 && map.length > 0 && players.length > 0) {
            joystick_direction = [...joystick.GetDir()];
            let availableDirections = me.canMove(map);

            // Joystick: WASD = NWSE
            if (keyboard.w || joystick_direction.includes("N")) {
                if (availableDirections.up) me.move(0, -moveCof);
            }
            if (keyboard.a || joystick_direction.includes("W")) {
                if (availableDirections.left) me.move(-moveCof, 0);
            }
            if (keyboard.s || joystick_direction.includes("S")) {
                if (availableDirections.down) me.move(0, moveCof);
            }
            if (keyboard.d || joystick_direction.includes("E")) {
                if (availableDirections.right) me.move(moveCof, 0);
            }
            if (!keyboard.w && !keyboard.a && !keyboard.s && !keyboard.d && joystick_direction.includes("C")) {
                me.resetMove();
            }


            // Camera controls
            let player_render_x = me.x - camera.x;
            let player_render_y = me.y - camera.y;

            if (player_render_x > canvas.width * (1 - camera_move_start_precentage / 100)) camera.x += moveCof;
            if (player_render_x < canvas.width * (camera_move_start_precentage / 100)) camera.x -= moveCof;
            if (player_render_y > canvas.height * (1 - camera_move_start_precentage / 100)) camera.y += moveCof;
            if (player_render_y < canvas.height * (camera_move_start_precentage / 100)) camera.y -= moveCof;

            render();

        }
        setTimeout(app,1000/60);
    }

    function update() {
        server.send(`update ${me.nickname} ${me.x} ${me.y} ${me.texture.indexX} ${me.texture.indexY} ${me.done ? 1 : 0}`);
    }

    function message(msg) {
        msg = msg.data;
        msg = msg.split(" ");
        if (msg[0] == "you") {
            let data = JSON.parse(msg[1]);
            me.id = data.mid;
            if (msg[2]) {
                me.x = data.x;
                me.y = data.y;
                me.texture.indexX = data.tIndexX;
                me.texture.indexY = data.tIndexY;
            }
        } else if (msg[0] == "map") {
            let data = JSON.parse(msg[1]);
            map = data;
        } else if (msg[0] == "np") {
            let np = new Player();
            let data = JSON.parse(msg[1]);
            np.id = data.mid;
            np.nickname = data.nickname;
            players.push(np);
        } else if (msg[0] == "dp") {
            let id = msg[1];
            for (let i = 0; i < players.length; i++) {
                if (players[i].id == id) players.splice(i, 1);
            }
        } else if (msg[0] == "up") {
            let data = JSON.parse(msg[1]);
            for (let i = 0; i < players.length; i++) {
                if (players[i].id == data.mid) {
                    players[i].nickname = data.nickname;
                    players[i].x = data.x;
                    players[i].y = data.y;
                    players[i].texture.indexX = data.tIndexX;
                    players[i].texture.indexY = data.tIndexY;
                }
            }
        } else if (msg[0] == "players") {
            players=[];
            let data = JSON.parse(msg[1]);
            for (let i = 0; i < data.length; i++) {
                if (me.id == data[i].mid) continue;
                let p = new Player();
                p.id = data[i].mid;
                p.nickname = data[i].nickname;
                p.texture.indexX = data[i].tIndexX;
                p.texture.indexY = data[i].tIndexY;
                p.x = data[i].x;
                p.y = data[i].y;
                players.push(p);
            }
            players.push(me);
        }
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

    server.addEventListener("open", app);
    server.addEventListener("message", message);
    server.addEventListener("error",(ev)=>{
        alert("Something went wrong...");
    })
} else {

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

    const wallTexture=new CaImage("wall.jpg");
    const airTexture=new CaImage("air.jpg");

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

            let xLeft = player.x - player_size / 2;
            let yTop = player.y - player_size / 2;
            let xRight = player.x + player_size / 2;
            let yBottom = player.y + player_size / 2;

            // LT = XL+YT; RT = XR+YT; LB = XL+YB; RB = XR+YB

            let cellRight = Math.floor(xRight / size);
            let cellLeft = Math.floor(xLeft / size);
            let cellTop = Math.floor(yTop / size);
            let cellBottom = Math.floor(yBottom / size);

            if (player.y + player_size / 2 == cellBottom * size) cellBottom--;
            if (player.x + player_size / 2 == cellRight * size) cellRight--;

            canMove.up = !((map[cellTop - 1][cellLeft] == 2 || map[cellTop - 1][cellRight] == 2) && (player.y - player_size / 2) == cellTop * size);
            canMove.down = !((map[cellBottom + 1][cellLeft] == 2 || map[cellBottom + 1][cellRight] == 2) && (player.y + player_size / 2 == cellBottom * size + size));
            canMove.left = !((map[cellTop][cellLeft - 1] == 2 || map[cellBottom][cellLeft - 1] == 2) && (player.x - player_size / 2 == cellLeft * size));
            canMove.right = !((map[cellTop][cellRight + 1] == 2 || map[cellBottom][cellRight + 1] == 2) && (player.x + player_size / 2 == cellRight * size + size));

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
            if(map[y][x]==2) {
                ctx.drawImage(wallTexture,x*size-camera.x,y*size-camera.y,size,size);
            } else if(x == map[y].length - 2 && y == map.length - 2) {
                ctx.fillStyle="#0000ff";
                ctx.fillRect(x * size - camera.x, y * size - camera.y, size, size);
            } else if(maze[y][x]==1) {
                ctx.drawImage(airTexture,x*size-camera.x,y*size-camera.y,size,size);
            }

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

        setTimeout(app,1000/60); // Infinite loop! Woooo!
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
}