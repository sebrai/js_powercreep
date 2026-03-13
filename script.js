console.log("hello world");
const c = document.querySelector("canvas")
let sp_select = document.getElementById("special_select")
const c_picker = document.getElementById("color")
const diff_slider = document.getElementById("difficulty")
const ctx = c.getContext("2d")
const menu = document.querySelector(".cont")
let sp_icon = null

const size = [window.innerWidth * 0.85, window.innerHeight * 0.85]
window.addEventListener("resize", () => {
    if (!game.lost) {
        size[0] = window.innerWidth * 0.85
        size[1] = window.innerHeight * 0.85
        c.width = size[0]
        c.height = size[1]
        // console.log("screen size changed")
    }
})
let score = 0
let timer = 0
let movement_speed = 15
let accel = 2
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
    coins: [],
    started: false,
    lost: false,
    paused: false,
    mx: 0,
    my: 0,
    diffuculty: 1,
    coin_rate: 75,
    coin_min: 50,
    coin_max: 250,
    coin_duration: 150,
    coin_shower_timer: 0,
    coin_shower_duration: 250,
    getspawn_rate: function () {
        let x = this.diffuculty
        return Math.floor(0.12 * x ** 3 - 0.29 * x ** 2 - 7 * x + 56)
    },
    start: function () {
        this.lost = false
        player.lives = 3
        player.x = 100
        player.vx = 0
        player.y = 100
        player.vy = 0
        player.sp_coldown = 0
        score = 0
        this.death_blocks = []
        this.bullets = []
        this.warnings = []
        this.coins = []
        this.coin_shower_timer = 0
        this.started = true
        run_frame()
    },
    lose: function () {
        this.lost = true
        this.set_start_btn("retry")
        ctx.font = "50px Arial";
        ctx.fillStyle = "white"
        ctx.textAlign = "start"
        ctx.textBaseline = "top"
        ctx.fillText("score: " + score, 0, 0);

    },
    new_dblock: function (count = 1) {
        for (let i = 0; i < count; i++) {
            let blockdir = basic_dir[rng(basic_dir.length - 1, 0)]
            let d = new deathblock(rng(200, 120), rng(200, 120), rng(20, 15), blockdir)
            d.spawn()
        }
    },
    set_start_btn: function (text) {
        ctx.clearRect(0, 0, size[0], size[1])
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, size[0], size[1])

        draw_button(size[0] / 3, size[1] / 3, 300, 120, text, () => { game.start() })
    },
    ui: {
        sp_icon_size: 25,
        sp_icon_offset: 30,
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
    do_special: function () {
        if (!game.lost) {
            if (game.started && this.sp_coldown <= 0) {
                this.sp_object.func()
                this.sp_coldown = this.sp_object.cooldown
            }
        } else {
            console.log("cant special while not in game")
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
    render_hurt: function () {
        this.inv_time -= 1
        const hurt_background = ctx.createRadialGradient(size[0] / 2, size[1] / 2, 0, size[0] / 2, size[1] / 2, Math.max(...size) / 2)
        hurt_background.addColorStop(0, "rgba(255, 255, 255, 0)")
        hurt_background.addColorStop(1, `rgba(165, 0, 0, ${this.inv_time / this.hit_sheild})`)
        ctx.fillStyle = hurt_background
        ctx.fillRect(0, 0, size[0], size[1])
        if (!this.inv_time) {
            this.invulnerability = false
        }
    },
    sp_object: null,
    sp_coldown: 0,
    dash_active: false,
    dash_time: 0,
    dash_duration: 8,
    dash_speed: 25,
    dash_dir: { x: 0, y: 0 },
    dash_inv: true,
}
const tp_dash = {
    func: function () {
        const dashLength = 40 + rng(10, -5);
        const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);

        if (speed === 0) return; // prevent division by zero

        player.x += (player.vx / speed) * dashLength;
        player.y += (player.vy / speed) * dashLength;

    },
    name: "test dash",
    cooldown: 100,
    icon: "",
}

const dash = {
    func: function () {
        const speed = player.getspeed()
        if (speed === 0) return
        player.dash_dir.x = player.vx / speed
        player.dash_dir.y = player.vy / speed
        player.dash_active = true
        player.dash_time = player.dash_duration
    },
    name: "dash",
    cooldown: 50,
    icon: "/img/sprint.svg",
}

const dir_bullet = {
    func: function () {
        let b = new bullets(20, [player.vy / player.getspeed(), player.vx / player.getspeed()], "#c42d2d")
        b.start()
    },
    name: "throw projektile",
    cooldown: 20,
    icon: "/img/drop_ball.png",
}


const bullet_to_mouse = {
    func: function () {
        let b = new bullets(15 + rng(5, 0) + player.getspeed(), player_to_mouse_sin_cos())
        b.start()
    },
    name: "bullet",
    cooldown: 50,
    icon: "/img/falling-blob.png",
}

const mouse_tp = {
    func: function () {
        // player.vx =0, player.vy = 0
        player.x = game.mx, player.y = game.my
    },
    name: "teleport",
    cooldown: 1000,
    icon: "/img/star-gate.svg",
}
const coin_shower = {
    func: function () {
        game.coin_shower_timer = game.coin_shower_duration -game.diffuculty**3
    },
    name: "coin shower",
    cooldown: 1000,
    icon: "/img/coins-pile.svg"
}


let splist = [dash, mouse_tp, bullet_to_mouse, dir_bullet, coin_shower]
document.addEventListener("DOMContentLoaded", () => {
    for (let index = 0; index < splist.length; index++) {
        const element = splist[index];
        let opt = document.createElement("option")
        opt.value = element.name
        opt.textContent = element.name
        sp_select.appendChild(opt)

    }
    sp_select.addEventListener("change", () => {
        player.sp_object = splist.filter(name => name.name === sp_select.value)[0]
        sp_icon.src = player.sp_object.icon

    })
    player.sp_object = splist.filter(name => name.name === sp_select.value)[0]
    sp_icon = document.createElement("img")
    sp_icon.className = "tiny_icon"
    sp_icon.src = player.sp_object.icon
    menu.appendChild(sp_icon)
}, { once: true })




c_picker.value = player.color

function draw_button(x, y, w, h, text, effect = () => { }) {
    ctx.fillStyle = "#bbbbbb"
    ctx.strokeStyle = "#303030"
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = "#ffffff"
    ctx.font = h / 2 + "px serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, x + w * 0.5, y + h * 0.5)
    c.addEventListener("click", () => {
        if (game.mx > x && game.mx < x + w && game.my > y && game.my < y + h) {
            effect()
        }
        console.count("restart");

    }, { once: true })
}


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
                    this.y = size[1] - 1;
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
                    this.y = -this.height + 1;
                    this.warning_pos.y = this.y + this.height + 10
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
                    this.x = size[0];
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
                    this.x = -this.width + 1;
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
        this.runframe = function () {
            this.move()
            this.extra_logik()
            ctx.fillStyle = this.color
            ctx.fillRect(this.x, this.y, this.width, this.height)
            if (this.colition_check() && !player.invulnerability && !(player.dash_inv && player.dash_active)) player.get_hit()

            this.try_despawn() // despwns the enemy if its of the screen
        }
        this.spawn = function () {
            this.setposition()
            let w = new warnings(this.warning_pos.x, this.warning_pos.y, Math.sqrt(this.height ** 2 + this.width ** 2) / 10)
            w.start()
            setTimeout(() => {
                w.stop()
                this.start()
            }, rng(1100, 600))
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
class coin {
    constructor(x, y, value, r = 20 - game.diffuculty ** 1.5) {
        this.color = "yellow"
        this.x = x
        this.y = y
        this.value = value
        this.radius = r
        this.timer = game.coin_duration +30 - 10*game.diffuculty 
        this.check_colli = function () {
            let player_dist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2)
            return player.radius + this.radius >= player_dist
        }
        this.draw = function () {
            this.y += Math.sin(timer / (Math.PI * 3))
            ctx.strokeStyle = "#000000"
            ctx.fillStyle = this.color
            ctx.beginPath()
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
            ctx.closePath()
            ctx.stroke()
            ctx.fill()
            ctx.beginPath()
            ctx.moveTo(this.x, this.y - this.radius * 0.8)
            ctx.lineTo(this.x, this.y + this.radius * 0.8)
            ctx.stroke()
        }
        this.despawn = function () {
            const index = game.coins.indexOf(this)
            game.coins.splice(index, 1)
        }
        this.collect = function () {
            score += this.value
            this.despawn()
        }
        this.init = function () {
            this.color = this.value >= 150 ? "#e1bd37" : this.value >= 100 ? "#7d7d85" : "#9b3802"
            game.coins.push(this)
        }
        this.runframe = function () {
            this.timer -= 1
            if (this.check_colli()) {
                this.collect()
            } else if (this.timer === 0) {
                this.despawn()
            } else {
                this.draw()
            }
        }
    }
}
document.addEventListener("keydown", (e) => {
    if (e.key === " ") {
        // console.log("special used")
        player.do_special()
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
diff_slider.addEventListener("change", () => {
    game.diffuculty = Number(diff_slider.value)
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
    const currentSpeed = player.getspeed()

    if (currentSpeed > player.maxSpeed) {
        const scale = player.maxSpeed / currentSpeed
        player.vx *= scale
        player.vy *= scale
    }
    if (player.sp_coldown > 0) {
        player.sp_coldown--
    }

    // move player
    if (player.dash_active) {

        player.x += player.dash_dir.x * player.dash_speed
        player.y += player.dash_dir.y * player.dash_speed

        player.dash_time--

        if (player.dash_time <= 0) {
            player.dash_active = false
        }

    } else {
        player.x += player.vx
        player.y += player.vy

    }


    // lower speed based on friction

    player.vx *= player.friction
    player.vy *= player.friction

    if (Math.abs(player.vx) < 0.01) player.vx = 0 // stop you from moving when you arent really moving 
    if (Math.abs(player.vy) < 0.01) player.vy = 0 // avoids havind the computer do complicated math for no reason


    if (player.x - player.radius < 0) { // check for wall collitions
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
    for (let index = 0; index < death_blocks_copy.length; index++) { // movement and drawing death blocks
        const element = death_blocks_copy[index];
        element.runframe()
    }
    for (let index = 0; index < game.warnings.length; index++) { // draws warnings
        const element = game.warnings[index];
        element.runframe()
        // console.log(element);

    }
    let coin_copy = game.coins
    for (let index = 0; index < coin_copy.length; index++) {
        const element = coin_copy[index];
        element.runframe()
    }
    if (timer % game.getspawn_rate() === 0 && timer != 0) {
        game.new_dblock(rng(game.diffuculty, 1))
    }
    if (timer % game.coin_rate === 0 && timer != 0) {
        let nc = new coin(rng(size[0] * 0.75, size[0] * 0.25), rng(size[1] * 0.75, size[1] * 0.25), rng(game.coin_max, game.coin_min))
        nc.init()
    }

    if (player.invulnerability) { // count down invulrebillity and flash screen red
        player.render_hurt()
    }

    timer += 1
    score += 1

    if (!game.coin_shower_timer) {
        game.coin_max = 170
        game.coin_min = 40
        game.coin_rate = 75
        game.coin_duration = 150
    }
    if (game.coin_shower_timer) {
        game.coin_shower_timer -= 1
        game.coin_max = 300
        game.coin_min = 100
        game.coin_rate = 25
        game.coin_duration = 150 + game.coin_shower_duration -game.diffuculty**3
    }





    ctx.font = "50px Arial";
    ctx.fillStyle = "black"
    ctx.textAlign = "start"
    ctx.textBaseline = "top"
    ctx.fillText("score: " + score, 0, 0);
    let cooldowndeg = 360 * player.sp_coldown / player.sp_object.cooldown

    // sp_icon.style.backgroundImage = `conic-gradient(rgba(0, 0, 0, 0.6) 0deg , rgba(0, 0, 0, 0.6) ${cooldowndeg}deg , rgba(0,0,0,0) ${cooldowndeg}deg , rgba(0,0,0,0) 360deg)`
    let gradient = ctx.createConicGradient(0, game.ui.sp_icon_offset, size[1] - game.ui.sp_icon_offset)
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.6)")
    gradient.addColorStop(cooldowndeg / 360, "rgba(0, 0, 0, 0.6)")
    gradient.addColorStop(cooldowndeg / 360, "rgba(0, 0, 0, 0)")
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(game.ui.sp_icon_offset, size[1] - game.ui.sp_icon_offset, game.ui.sp_icon_size, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fill()


    ctx.drawImage(sp_icon, game.ui.sp_icon_offset - 20, size[1] - game.ui.sp_icon_offset - 15, game.ui.sp_icon_size * 1.5, game.ui.sp_icon_size * 1.5)
    if (player.lives <= 0) game.lost = true

    if (!game.lost) {
        requestAnimationFrame(run_frame)

    } else {
        game.lose()
    }
}

game.set_start_btn("start game")