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

c.width = size[0]
c.height = size[1]

let game ={
 side_death_blocks: [],
 started: false,
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
        if (game.started) {
        console.log("no special");      
        }
      
        
    }
}
c_picker.value = player.color
class deathblock {
    constructor() {
        this.width = 100
        this.height = 100
        this.x = 0
        this.y = 0
        this.xvel = 0
        this.yvel = 0
        side_death_blocks.push(this)
    }
}
document.addEventListener("keydown", (e) => {
     if (e.key === " "){
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

function run_frame() {
    ctx.clearRect(0, 0, size[0], size[1]) // clear


    const dir_count = Object.values(player.mkeys).filter(value => value === true).length // amount of movemen



    if (dir_count === 2) { // make you move the correct speed in diagonalsd
        player.maxSpeedspeed = movement_speed / Math.sqrt(2)
    } else {
        player.maxSpeedspeed = movement_speed
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




    timer += 1
    score = timer
    score_display.innerText = "score: " + score
    requestAnimationFrame(run_frame)
}
async function start_game() {
    game.started = true
    run_frame()
}
start_btn.addEventListener("click", () => {
    start_game()
})