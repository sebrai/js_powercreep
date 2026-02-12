console.log("hello world");
const c = document.querySelector("canvas")
const start_btn = document.getElementById("start")
const ctx = c.getContext("2d")
const size = [1100,550]

let score = 0
c.width  =size[0]
c.height = size[1]
let player = {
    x: 100,
    y: 100,
    speed: 4,
    radius: 10,
    color: "#f5473b",
    keys: {
        "w": false,
        "a": false,
        "s": false,
        "d": false,
    }
}
document.addEventListener("keydown", (e) => {
    if (player.keys[e.key] == undefined || player.keys[e.key] == null) return;
    if (player.keys[e.key]) return;
    console.log(e.key + " was pressed");
    player.keys[e.key] = true



})
document.addEventListener("keyup", (e) => {
    if (!player.keys[e.key]) return;
    player.keys[e.key] = false
})
function  run_frame() {
    ctx.clearRect(0, 0, size[0], size[1])
    if (player.keys.w) {
        player.y -= player.speed
    }
    if (player.keys.s){
         player.y += player.speed
    }
     if (player.keys.a) {
        player.x -= player.speed
    }
    if (player.keys.d){
         player.x += player.speed
    }
     ctx.beginPath()
     ctx.arc(player.x,player.y,player.radius,0,2*Math.PI)
     ctx.stroke()
     score += 1
     requestAnimationFrame(run_frame)
}
async function start_game() {
    run_frame()
}
start_btn.addEventListener("click",()=>{
    start_game()
})