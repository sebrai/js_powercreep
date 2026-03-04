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
    // "up,left",
    "up", "up",
    // "up,right",
    "right", "right",
    // "down,right",
    "down", "down",
    // "down,left"
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
    warnings: [],
    started: false,
    lost: false,
    paused: false,
    mx: 0,
    my: 0,
    start: function () {
        game.lost = false
        player.lives = 3
        this.started = true
        run_frame()
    },
    lose: function () {
        this.lost = true
        start_btn.disabled = false
        ctx.clearRect(0, 0, size[0], size[1])
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, size[0], size[1])

    }
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
    lives: 3,
    invulnerability: false,
    inv_time: 0,
    hit_sheild: 70,
    mkeys: {
        "w": false,
        "a": false,
        "s": false,
        "d": false,
    },
    getspeed: function () {
        return Math.sqrt(this.vx ** 2 + this.vy ** 2)
    },
    getangle: function () {
        let radians = Math.atan2(vy, vx);
        let degrees = radians * (180 / Math.PI)
        return { radians: radians, degrees: degrees }
    },
    special: function () {
        if (game.started && this.sp_coldown <= 0) {
            this.sp_func()
            player.sp_coldown = 1000
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
    get_hit: function () {
        this.lives -= 1
        if (this.lives) {
            this.invulnerability = true
            this.inv_time = this.hit_sheild
        }
        console.count("got hit")
    },
    sp_func: bullet_to_mouse,
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
    let b = new bullets(20)
    b.start()
}
function bullet_to_mouse() {
    let b = new bullets(15 + rng(5, 0), player_to_mouse_sin_cos())
    b.start()
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
        this.warning_pos = { x: 0, y: 0 }
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

            let diagW = size[0] / 4;
            let diagH = size[1] / 4;

            switch (chosenDir) {

                case "up":
                    // bottom edge
                    this.y = size[1] - this.height;
                    this.warning_pos.y = this.y - 10

                    if (dirs.length > 1) {
                        // diagonal: restrict X so it travels across screen
                        if (dirs.includes("left")) {
                            this.x = rng(size[0] - this.width, diagW);
                            this.warning_pos.x = this.x - 10
                        } else if (dirs.includes("right")) {
                            this.x = rng(diagW - this.width, 0);
                            this.warning_pos.x = this.x + 10
                        }
                    } else {
                        this.x = rng(size[0] - this.width, 0);
                    }
                    break;

                case "down":
                    // top edge
                    this.y = 0;
                    this.warning_pos.y = this.y + 10
                    if (dirs.length > 1) {
                        if (dirs.includes("left")) {
                            this.x = rng(size[0] - this.width, diagW);
                            this.warning_pos.x = this.x - 10
                        } else if (dirs.includes("right")) {
                            this.x = rng(diagW - this.width, 0);
                            this.warning_pos.x = this.x + 10
                        }
                    } else {
                        this.x = rng(size[0] - this.width, 0);
                    }
                    break;

                case "left":
                    // right edge
                    this.x = size[0] - this.width;
                    this.warning_pos.x = this.x - 10
                    if (dirs.length > 1) {
                        if (dirs.includes("up")) {
                            this.y = rng(size[1] - this.height, diagH);
                            this.warning_pos.y = this.y - 10
                        } else if (dirs.includes("down")) {
                            this.y = rng(diagH - this.height, 0);
                            this.warning_pos.y = this.y + 10
                        }
                    } else {
                        this.y = rng(size[1] - this.height, 0);
                    }
                    break;

                case "right":
                    // left edge
                    this.x = 0;
                    this.warning_pos.x = this.x + 10
                    if (dirs.length > 1) {
                        if (dirs.includes("up")) {
                            this.y = rng(size[1] - this.height, diagH);
                            this.warning_pos.y = this.y - 10
                        } else if (dirs.includes("down")) {
                            this.y = rng(diagH - this.height, 0);
                            this.warning_pos.y = this.y + 10
                        }
                    } else {
                        this.y = rng(size[1] - this.height, 0);
                    }
                    break;
            }
            const offset = 15;

            if (this.dir.includes("up")) {
                this.warning_pos.x = this.x + this.width / 2;
                this.warning_pos.y = size[1] - offset;
            }
            else if (this.dir.includes("down")) {
                this.warning_pos.x = this.x + this.width / 2;
                this.warning_pos.y = offset;
            }
            else if (this.dir.includes("left")) {
                this.warning_pos.x = size[0] - offset;
                this.warning_pos.y = this.y + this.height / 2;
            }
            else if (this.dir.includes("right")) {
                this.warning_pos.x = offset;
                this.warning_pos.y = this.y + this.height / 2;
            }


        }
        this.start = function () {
            game.death_blocks.push(this)
            // this.setposition()
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
        // this.start()
        // this.setposition()
    }
}
class bullets {
    constructor(speed, sincos = [player.vx / player.getspeed(), player.vy / player.getspeed()], color = "#4fab88", x_logik = () => { }) {
        this.radius = 5
        this.x = 0
        this.y = 0
        this.vx = 0
        this.vy = 0
        this.base_speed = speed
        this.speed = speed
        this.natural_sin_cos = sincos
        this.moving = false
        this.color = color
        this.spread = 5
        this.move = function () {
            this.x += this.vx
            this.y += this.vy
        }
        this.setmovement = function () {
            this.moving = true
            this.vx = this.speed * this.natural_sin_cos[1]
            this.vy = this.speed * this.natural_sin_cos[0]
        }
        this.extra_logik = x_logik
        this.setposition = function () {
            this.x = player.x
            this.y = player.y
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
            const index = game.bullets.indexOf(this)
            game.bullets.splice(index, 1)
        }
        this.try_despawn = function () {
            if (!this.check_despawn()) return;
            this.despawn()
        }
        this.runframe = function () {
            this.move()
            this.extra_logik()
            ctx.fillStyle = this.color
            ctx.beginPath()
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.fill()
            let colition = this.colition_check()
            if (colition.colided) {
                this.despawn()
                colition.item.despawn()
                score += 50
            }
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
        // this.start()

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
c.addEventListener("mousemove", (event) => {
    let bbox = c.getBoundingClientRect()
    game.mx = event.clientX - bbox.left
    game.my = event.clientY - bbox.top
    // console.log(game.mx ,game.my)
})
function player_to_mouse_sin_cos() {
    let xdist = game.mx - player.x
    let ydist = game.my - player.y
    let length = Math.sqrt(xdist ** 2 + ydist ** 2)
    let sin = ydist / length
    let cos = xdist / length
    // console.log(sin,cos);

    return [sin, cos]
}
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

class warnings {
    constructor(x, y, h = 15, bob = h / 2, bob_speed = 5, color = "#ff0000", font = "Arial") {
        this.x = x
        this.y = y
        this.color = color
        this.height = h
        this.bobheight = bob
        this.frame = 0
        this.font = font
        this.bob_speed = bob_speed
        this.get_bob = function () {
            let radian_height = this.frame * this.bob_speed * (Math.PI / 180)
            return Math.sin(radian_height) * this.bobheight
        }
        this.draw = function () {
            ctx.font = this.height + "px " + this.font
            ctx.fillStyle = this.color
            ctx.fillText("!!!", this.x, this.y + this.get_bob())
        }
        this.runframe = function () {
            // console.log(this);

            this.draw()
            this.frame++
        }
        this.start = function () {
            game.warnings.push(this)
        }
        this.stop = function () {
            const index = game.warnings.indexOf(this)
            game.warnings.splice(index, 1)
        }
    }
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
        element.runframe()
    }


    let death_blocks_copy = game.death_blocks // copy to make sure order isnt broken if a block despwans
    if (!player.invulnerability) {

    }
    for (let index = 0; index < death_blocks_copy.length; index++) { // movement and drawing death blocks
        const element = death_blocks_copy[index];
        element.move()
        element.extra_logik()
        ctx.fillStyle = element.color
        ctx.fillRect(element.x, element.y, element.width, element.height)
        if (element.colition_check() && !player.invulnerability) player.get_hit()

        element.try_despawn() // despwns the enemy if its of the screen
    }
    for (let index = 0; index < game.warnings.length; index++) { // draws warnings
        const element = game.warnings[index];
        element.runframe()
        // console.log(element);

    }
    if (timer % 50 === 0 && timer != 0) {
        let blockdir = basic_dir[rng(basic_dir.length - 1, 0)]
        let d = new deathblock(rng(200, 120), rng(200, 120), rng(20, 15), blockdir)
        d.setposition()
        let w = new warnings(d.warning_pos.x, d.warning_pos.y, 25)
        w.start()
        setTimeout(() => {
            w.stop()
            d.start()
        }, rng(1100, 600))
    }

    if (player.invulnerability) { // count down invulrebillity and flash screen red
        player.inv_time -= 1
        const hurt_background = ctx.createRadialGradient(size[0] / 2, size[1] / 2, 0, size[0] / 2, size[1] / 2, Math.max(...size) / 2)
        hurt_background.addColorStop(0, "rgba(255, 255, 255, 0)")
        hurt_background.addColorStop(1, `rgba(165, 0, 0, ${player.inv_time / player.hit_sheild})`)
        ctx.fillStyle = hurt_background
        ctx.fillRect(0, 0, size[0], size[1])
        if (!player.inv_time) {
            player.invulnerability = false
        }
    }

    timer += 1
    score += 1
    score_display.innerText = "score: " + score

    if (player.lives <= 0) game.lost = true

    if (!game.lost) {
        requestAnimationFrame(run_frame)

    } else {
        game.lose()
    }
}


start_btn.addEventListener("click", () => {
    start_btn.disabled = true
    game.start()
})