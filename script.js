console.log("hello world");
const c = document.querySelector("canvas")
const start_btn = document.getElementById("start")
const c_picker = document.getElementById("color")
const score_display = document.getElementById("score")
const ctx = c.getContext("2d")

const size = [1100, 550]
let score = 0
let timer = 0
let movement_speed = 15
const basic_dir = [
    "left", "left",
    "up,left",
    "up", "up",
    "up,right",
    "right", "right",
    "down,right",
    "down", "down",
    "down,left"
]
function rng(max = 100, min = 0) {
    let r = Math.floor(Math.random() * (max + 1 - min)) + min
    return r
}

c.width = size[0]
c.height = size[1]

let game = {
    death_blocks: [],
    bullets: [],
    started: false,
    lost: false,
    paused: false,
}


let player = {
    x: 100,
    y: 100,
    // speed: movement_speed,
    vx: 0,
    vy: 0,
    friction: 0.875, // closer to 1 = more slipp
    acceleration: 2,
    maxSpeed: movement_speed,
    radius: 10,
    color: "#3b66f5",
    mkeys: {
        "w": false,
        "a": false,
        "s": false,
        "d": false,
    },
    special: function () {
        if (game.started && this.sp_coldown <= 0) {
            this.sp_func()
            player.sp_coldown = 2000
            let cooldown = setInterval(() => {
                player.sp_coldown -= 10 // 10 insted if 1  because its to fast for the game to handle
                // console.count("used")
                if (player.sp_coldown <= 0) {
                    console.log("sp coldown ended");

                    clearInterval(cooldown)
                }
            }, 10);
        }


    },
    sp_func: shoot_bullet,
    sp_coldown: 0
}

function dash() {
    const dashLength = 40 + rng(10, -5);
    const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);

    if (speed === 0) return; // prevent division by zero

    player.x += (player.vx / speed) * dashLength;
    player.y += (player.vy / speed) * dashLength;

}
function shoot_bullet() {
    new bullets(20 + rng(20, 0))
}



c_picker.value = player.color
class deathblock {
    constructor(width, height, speed, direction = "none", color = "#f82121", x_logik = function () { }) {
        this.width = width
        this.height = height
        this.x = 0
        this.y = 0
        this.vx = 0
        this.vy = 0
        this.base_speed = speed
        this.speed = speed
        this.dir = direction
        this.moving = false
        this.color = color
        this.move = function () {
            this.x += this.vx
            this.y += this.vy
        }
        this.setmovement = function () {
            this.moving = true
            if (this.dir.length > 6) {
                this.speed = this.base_speed / Math.sqrt(2)
            } else {
                this.speed = this.base_speed
            }
            this.vx = this.dir.includes("left") ? -this.speed : this.dir.includes("right") ? this.speed : 0
            this.vy = this.dir.includes("up") ? -this.speed : this.dir.includes("down") ? this.speed : 0
        }
        this.extra_logik = x_logik
        this.setposition = function () {
            let dirs = this.dir.split(",");
            let chosenDir = dirs.length > 1
                ? dirs[Math.floor(Math.random() * 2)]
                : dirs[0];

            let halfW = size[0] / 2;
            let halfH = size[1] / 2;

            switch (chosenDir) {

                case "up":
                    // bottom edge
                    this.y = size[1] - this.height;

                    if (dirs.length > 1) {
                        // diagonal: restrict X so it travels across screen
                        if (dirs.includes("left")) {
                            this.x = rng(size[0] - this.width, halfW);
                        } else if (dirs.includes("right")) {
                            this.x = rng(halfW - this.width, 0);
                        }
                    } else {
                        this.x = rng(size[0] - this.width, 0);
                    }
                    break;

                case "down":
                    // top edge
                    this.y = 0;

                    if (dirs.length > 1) {
                        if (dirs.includes("left")) {
                            this.x = rng(size[0] - this.width, halfW);
                        } else if (dirs.includes("right")) {
                            this.x = rng(halfW - this.width, 0);
                        }
                    } else {
                        this.x = rng(size[0] - this.width, 0);
                    }
                    break;

                case "left":
                    // right edge
                    this.x = size[0] - this.width;

                    if (dirs.length > 1) {
                        if (dirs.includes("up")) {
                            this.y = rng(size[1] - this.height, halfH);
                        } else if (dirs.includes("down")) {
                            this.y = rng(halfH - this.height, 0);
                        }
                    } else {
                        this.y = rng(size[1] - this.height, 0);
                    }
                    break;

                case "right":
                    // left edge
                    this.x = 0;

                    if (dirs.length > 1) {
                        if (dirs.includes("up")) {
                            this.y = rng(size[1] - this.height, halfH);
                        } else if (dirs.includes("down")) {
                            this.y = rng(halfH - this.height, 0);
                        }
                    } else {
                        this.y = rng(size[1] - this.height, 0);
                    }
                    break;
            }


        }
        this.start = function () {
            game.death_blocks.push(this)
            this.setposition()
            this.setmovement()
        }
        this.check_despawn = function () {
            return this.x > size[0] + 1 || this.y > size[1] + 1 || this.y < -(this.height + 1) || this.x < -(this.width + 1)
        }
        this.despawn = function () {
            const index = game.death_blocks.indexOf(this)
            game.death_blocks.splice(index, 1)
        }
        this.try_despawn = function () {
            if (!this.check_despawn()) return;
            this.despawn()
        }
        this.colition_check = function () {
            return !(this.x > player.x + player.radius * 2 ||
                this.x + this.width < player.x ||
                this.y > player.y + player.radius * 2 ||
                this.y + this.height < player.y)
        }
        this.start()
    }
}
class bullets {
    constructor(speed, color = "#4fab88", x_logik = () => { }) {
        this.radius = 5
        this.x = 0
        this.y = 0
        this.vx = 0
        this.vy = 0
        this.base_speed = speed
        this.speed = speed

        this.moving = false
        this.color = color
        this.move = function () {
            this.x += this.vx
            this.y += this.vy
        }
        this.setmovement = function () {
            this.moving = true
            this.vx = this.speed * player.vx / player.maxSpeed
            this.vy = this.speed * player.vy / player.maxSpeed
        }
        this.extra_logik = x_logik
        this.setposition = function () {
            this.x = player.x + (player.vx / player.maxSpeed) * player.radius
            this.y = player.y + (player.vy / player.maxSpeed) * player.radius
        }
        this.start = function () {
            game.bullets.push(this)
            this.setposition()
            this.setmovement()
        }
        this.check_despawn = function () {
            return this.x > size[0] + 1 || this.y > size[1] + 1 || this.y < -(this.height + 1) || this.x < -(this.width + 1)
        }
        this.despawn = function () {
            const index = game.death_blocks.indexOf(this)
            game.death_blocks.splice(index, 1)
        }
        this.try_despawn = function () {
            if (!this.check_despawn()) return;
            this.despawn()
        }
        this.colition_check = function () {
            let colition = { colided: false, item: null }
            for (let index = 0; index < game.death_blocks.length; index++) {
                const element = game.death_blocks[index];
                if (!colition.colided) {
                    colition.colided = !(element.x > this.x + this.radius * 2 ||
                        element.x + element.width < this.x ||
                        element.y > this.y + this.radius * 2 ||
                        element.y + element.height < this.y)
                    if (colition.colided) colition.item = element
                }


            }
            return colition
        }
        this.start()

    }
}
document.addEventListener("keydown", (e) => {
    if (e.key === " ") {
        // console.log("special used")
        player.special()
        return
    }
    if (player.mkeys[e.key] == undefined || player.mkeys[e.key] == null) return;
    if (player.mkeys[e.key]) return;
    console.log(e.key + " was pressed");
    player.mkeys[e.key] = true



})
document.addEventListener("keyup", (e) => {
    if (!player.mkeys[e.key]) return;
    player.mkeys[e.key] = false
})

c_picker.addEventListener("change", () => {
    player.color = c_picker.value
})
function add_smile() {
    // --- Draw the eyes ---
    ctx.fillStyle = "black";

    // Left eye
    ctx.beginPath();
    ctx.arc(player.x - 4, player.y - 2, player.radius / 8, 0, Math.PI * 2, true); // Center (110, 120), radius 15
    ctx.fill();
    ctx.closePath();

    // Right eye
    ctx.beginPath();
    ctx.arc(player.x + 4, player.y - 2, player.radius / 8, 0, Math.PI * 2, true); // Center (190, 120), radius 15
    ctx.fill();
    ctx.closePath();

    // --- Draw the mouth ---
    ctx.beginPath();
    ctx.arc(player.x, player.y + 3, player.radius / 4, 0, Math.PI, false); // Center (150, 175), radius 60, false for counter-clockwise arc (a smile)
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.closePath();
}
function run_frame() {
    ctx.clearRect(0, 0, size[0], size[1]) // clear


    const dir_count = Object.values(player.mkeys).filter(value => value === true).length // amount of movemen



    if (dir_count === 2) { // make you move the correct speed in diagonalsd
        player.maxSpeed = movement_speed / Math.sqrt(2)
    } else {
        player.maxSpeed = movement_speed
    }




    if (player.mkeys.w) { // add velocity
        player.vy -= player.acceleration
    }
    if (player.mkeys.s) {
        player.vy += player.acceleration
    }
    if (player.mkeys.a) {
        player.vx -= player.acceleration
    }
    if (player.mkeys.d) {
        player.vx += player.acceleration
    }
    // limit max speed
    const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy)

    if (currentSpeed > player.maxSpeed) {
        const scale = player.maxSpeed / currentSpeed
        player.vx *= scale
        player.vy *= scale
    }


    // move player
    player.x += player.vx
    player.y += player.vy

    // make player move lesss based on friction

    player.vx *= player.friction
    player.vy *= player.friction

    if (Math.abs(player.vx) < 0.001) player.vx = 0
    if (Math.abs(player.vy) < 0.001) player.vy = 0

    if (player.x - player.radius < 0) { // check for wal collitions
        player.x = player.radius
    } else if (player.x + player.radius > size[0]) {
        player.x = size[0] - player.radius
    }
    if (player.y - player.radius < 0) {
        player.y = player.radius
    } else if (player.y + player.radius > size[1]) {
        player.y = size[1] - player.radius
    }




    ctx.fillStyle = player.color
    ctx.beginPath()
    ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill() // paint in player

    add_smile()

    let bullets_copy = game.bullets
    for (let index = 0; index < bullets_copy.length; index++) {
        const element = bullets_copy[index];
        element.move()
        element.extra_logik()
        ctx.fillStyle = element.color
        ctx.beginPath()
        ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.fill()
        let colition = element.colition_check()
        if (colition.colided) {
            element.despawn()
            colition.item.despawn()
        }
    }


    let death_blocks_copy = game.death_blocks // copy to make sure order isnt broken if a block despwans
    for (let index = 0; index < death_blocks_copy.length; index++) { // movement and drawing death blocks
        const element = death_blocks_copy[index];
        element.move()
        element.extra_logik()
        ctx.fillStyle = element.color
        ctx.fillRect(element.x, element.y, element.width, element.height)
        if (element.colition_check()) game.lost = true

        element.try_despawn() // despwns the enemy when its of the screen
    }
    if (timer % 75 === 0 && timer != 0) {
        new deathblock(rng(150, 100), rng(150, 100), rng(18, 12), basic_dir[rng(basic_dir.length - 1, 0)])
    }

    timer += 1
    score = timer
    score_display.innerText = "score: " + score
    if (!game.lost) requestAnimationFrame(run_frame)
}
async function start_game() {
    game.started = true
    run_frame()
}
start_btn.addEventListener("click", () => {
    start_btn.disabled = true
    start_game()
})