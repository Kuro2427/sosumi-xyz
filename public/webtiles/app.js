var cookies = 0;
var miners  = 0;

var countEl  = document.getElementById("count");
var rateEl   = document.getElementById("rate");
var minerBtn = document.getElementById("miner");
var clicker  = document.getElementById("clicker");
var ov       = document.getElementById("ov");

function minerCost() {
  return 25 * (miners + 1);
}

function updateUI() {
  countEl.textContent = Math.floor(cookies) + " bre'd";
  rateEl.textContent = miners + " / sec";
  minerBtn.textContent =
    "Buy auto bre'd (cost: " + minerCost() + ")";
}

function onClickerClick() {
  cookies += 1;
  updateUI();
}

function onMinerClick() {
  var cost = minerCost();
  if (cookies >= cost) {
    cookies -= cost;
    miners += 1;
    updateUI();
  }
}

function idleTick() {
  cookies += miners;
  updateUI();
}

function what() {
  if (ov.style.display === "block") {
    ov.style.display = "none";
  } else {
    ov.style.display = "block";
  }
}

/* Event bindings — required instead of onevent */
clicker.addEventListener("click", onClickerClick);
minerBtn.addEventListener("click", onMinerClick);

/* Idle generation */
setInterval(idleTick, 1000);

/* Initial draw */
updateUI();