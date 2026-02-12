console.log("hello world");
const c = document.getElementById("c")
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
    if (player.keys[e.key]) return;
    if (player.keys[e.key] == undefined || player.keys[e.key] == null) return;
    console.log(e.key + " was pressed");
    player.keys[e.key] = true



})
document.addEventListener("keyup", (e) => {
    if (!player.keys[e.key]) return;
    if (player.keys[e.key] == undefined || player.keys[e.key] == null) return;
    player.keys[e.key] = false
})

async function start_game() {

}