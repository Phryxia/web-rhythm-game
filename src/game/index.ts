const $game = document.getElementById("game");

function loop() {
  console.log(new Date());
  setTimeout(loop, 10);
}

export function start() {
  loop();
}
