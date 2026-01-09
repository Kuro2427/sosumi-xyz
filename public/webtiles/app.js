  let cookies = Number(localStorage.idleCookies || 0);
  let miners  = Number(localStorage.idleMiners || 0);

  const countEl = document.getElementById("count");
  const rateEl  = document.getElementById("rate");
  const minerBtn = document.getElementById("miner");
  const clicker = document.getElementById("clicker");

  function minerCost() {
    return 25 * (miners + 1);
  }

  function updateUI() {
    countEl.textContent = Math.floor(cookies) + " bre\'d";
    rateEl.textContent = miners + " / sec";
    minerBtn.textContent = "Buy auto bre'd (cost: " + minerCost() + ")";
  }

  function save() {
    localStorage.idleCookies = cookies;
    localStorage.idleMiners = miners;
  }

  clicker.onclick = () => {
    cookies += 1;
    save();
    updateUI();
  };

  minerBtn.onclick = () => {
    const cost = minerCost();
    if (cookies >= cost) {
      cookies -= cost;
      miners++;
      save();
      updateUI();
    }
  };

  // Idle generation
  setInterval(() => {
    cookies += miners;
    save();
    updateUI();
  }, 1000);

  updateUI();

//toggle explanation overlay
ov=document.getElementById("ov");
  function what(){
    if(ov.style.display=="block"){
      ov.style.display="none";
    }else{
      ov.style.display="block";
    }
  }