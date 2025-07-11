let player;
let powerUps = [];
let hazards = [];
let health = 100;
let immunityTurns = 0;
let genome = [];
let gameRunning = true;
let stars = 5;
let gameStartTime = Date.now();
let hazardSpawner;

if (!localStorage.getItem("playerGenome") || localStorage.getItem("playerGenome").trim() === "") {
  document.body.innerHTML = `
    <div style="color:lime; font-family:monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#000;">
      ⚠️ Genome not found! Please complete the Genome Editor first.
      <button onclick="location.href='index.html#lab'" style="margin-top: 20px; padding: 8px 16px; background:lime; color:black; font-weight:bold; font-family:monospace;">Go to Genome Editor</button>
    </div>
  `;
  throw new Error("Genome not loaded — redirected to genome editor.");
}

function loadGenome() {
  genome = (localStorage.getItem("playerGenome") || "").split("-").filter(Boolean);
  return genome.length > 0;
}

if (!loadGenome()) {
  showGenomeWarning();
  throw new Error("Genome not loaded."); 
}

function showGenomeWarning() {
  const warningScreen = document.createElement("div");
  warningScreen.style.position = "absolute";
  warningScreen.style.top = "0";
  warningScreen.style.left = "0";
  warningScreen.style.width = "100%";
  warningScreen.style.height = "100%";
  warningScreen.style.background = "#001";
  warningScreen.style.color = "lime";
  warningScreen.style.fontFamily = "monospace";
  warningScreen.style.fontSize = "18px";
  warningScreen.style.display = "flex";
  warningScreen.style.flexDirection = "column";
  warningScreen.style.alignItems = "center";
  warningScreen.style.justifyContent = "center";
  warningScreen.innerHTML = `
    <p>⚠️ You must complete genome sequencing first.</p>
    <button onclick="location.reload()" style="margin-top: 20px; padding: 6px 14px; font-family: monospace; background: lime; border: none; cursor: pointer;">Go to Genome Editor</button>
  `;
  document.getElementById("gameContainer").appendChild(warningScreen);
}

function createPlayer() {
  player = document.createElement("img");
  player.src = "game/exothreat/character.jpg";
  player.style.position = "absolute";
  player.style.left = "50%";
  player.style.bottom = "20px";
  player.style.width = "60px";
  player.id = "player";
  document.getElementById("gameContainer").appendChild(player);
}

function spawnPowerUp() {
  const icons = ["💊", "🧪"];
  const power = document.createElement("div");
  power.textContent = icons[Math.floor(Math.random() * icons.length)];
  power.className = "power-up";
  power.style.position = "absolute";
  power.style.left = Math.floor(Math.random() * 280 + 20) + "px";
  power.style.top = "-30px";
  power.style.fontSize = "32px";
  power.style.transition = "top 0.1s linear";
  document.getElementById("gameContainer").appendChild(power);
  powerUps.push(power);
}

function spawnHazard() {
  const icons = ["☢️", "🔥", "💨", "🌪️", "💀"];
  const totalElements = hazards.length + powerUps.length;
  if (totalElements >= Math.min(15, 10 + Math.floor((Date.now() - gameStartTime) / 5000))) return;

  const isHazard = Math.random() < 0.66;
  if (isHazard) {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const hazard = document.createElement("div");
      hazard.textContent = icons[Math.floor(Math.random() * icons.length)];
      hazard.className = "hazard";
      hazard.style.position = "absolute";
      hazard.style.left = Math.floor(Math.random() * 280 + 20) + "px";
      hazard.style.top = "-30px";
      hazard.style.fontSize = "32px";
      hazard.style.transition = "top 0.1s linear";
      document.getElementById("gameContainer").appendChild(hazard);
      hazards.push(hazard);
    }
  } else {
    spawnPowerUp();
  }
}

let fallSpeed = 3;
let hazardSpeed = 4;
let timeElapsed = 0;

function updateFallingItems() {
  timeElapsed++;
  if (timeElapsed % 300 === 0) {
    fallSpeed++;
    hazardSpeed++;
  }
  powerUps.forEach((item, i) => {
    item.style.top = item.offsetTop + fallSpeed + "px";
    if (item.offsetTop > 700) {
      item.remove();
      powerUps.splice(i, 1);
    }
  });
  hazards.forEach((item, i) => {
    item.style.top = item.offsetTop + hazardSpeed + "px";
    if (item.offsetTop > 700) {
      item.remove();
      hazards.splice(i, 1);
    }
  });
}

function detectCollisions() {
  const playerRect = player.getBoundingClientRect();
  powerUps.forEach((power, i) => {
    if (checkOverlap(playerRect, power.getBoundingClientRect())) {
      if (power.textContent === "💊") health = Math.min(100, health + 30);
      if (power.textContent === "🧪") {
        immunityTurns = 3;
        const index = Math.floor(Math.random() * genome.length);
        const boosted = genome[index];
        if (!boosted.includes("★")) genome[index] = boosted + "★";
        updateTraitDisplay();
      }
      power.remove();
      powerUps.splice(i, 1);
    }
  });
  hazards.forEach((hazard, i) => {
    if (checkOverlap(playerRect, hazard.getBoundingClientRect())) {
      const type = hazard.textContent;
      const resistanceMap = {
        "☢️": "Radiation",
        "🔥": "Heat",
        "💨": "Oxygen",
        "🌪️": "Wind",
        "💀": "Immune"
      };
      const resistanceKeyword = resistanceMap[type];
      const hasResistance = genome.some(trait => trait.includes(resistanceKeyword) || trait.includes("★") && trait.includes(resistanceKeyword));
      if (immunityTurns <= 0 && !hasResistance) {
        health -= 20;
        stars = Math.max(0, stars - 1);
      }
      hazard.remove();
      hazards.splice(i, 1);
    }
  });
  document.getElementById("healthBar").textContent = `❤️ Health: ${health}%` + (immunityTurns > 0 ? " 🔰 Immune" : "");
  document.getElementById("starDisplay").textContent = "⭐".repeat(stars);
  if (immunityTurns > 0) immunityTurns--;
  const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
  if (health <= 0 || stars <= 0) gameOverScreen();
  else if (elapsedSeconds >= 60) endGame();
}

function checkOverlap(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

function gameLoop() {
  if (!gameRunning) return;
  updateFallingItems();
  detectCollisions();
  requestAnimationFrame(gameLoop);
}

function setupControls() {
  document.addEventListener("keydown", (e) => {
    const step = 20;
    const container = document.getElementById("gameContainer");
    const containerWidth = container.offsetWidth;
    const currentLeft = player.offsetLeft;
    switch (e.key) {
      case "ArrowLeft":
        player.style.left = Math.max(0, currentLeft - step) + "px";
        break;
      case "ArrowRight":
        player.style.left = Math.min(containerWidth - 60, currentLeft + step) + "px";
        break;
    }
  });
}

function updateTraitDisplay() {
  const traitDisplay = document.getElementById("traitDisplay");
  traitDisplay.innerHTML = genome.map(trait => `<li>${trait}</li>`).join("");

}

function endGame() {
  if (!gameRunning) return;
  gameRunning = false;
  clearInterval(hazardSpawner);
  document.querySelectorAll(".hazard, .power-up, #player").forEach(el => el.remove());
  document.getElementById("healthBar").style.display = "none";
  document.getElementById("starDisplay").style.display = "none";
  document.getElementById("traitDisplayContainer").style.display = "none";

  const boosted = genome.filter(t => t.includes("★"));
  const resistanceCount = {
    Radiation: 0,
    Heat: 0,
    Oxygen: 0,
    Wind: 0,
    Immune: 0
  };

  boosted.forEach(trait => {
    Object.keys(resistanceCount).forEach(key => {
      if (trait.includes(key)) resistanceCount[key] += 5;
    });
  });

  const resistanceText = Object.entries(resistanceCount)
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => `${key}: ${val}%`)
    .join(" | ");

  const summary = document.createElement("div");
  summary.style.position = "absolute";
  summary.style.top = "0";
  summary.style.left = "0";
  summary.style.width = "100%";
  summary.style.height = "100%";
  summary.style.background = "#000";
  summary.style.color = "lime";
  summary.style.fontFamily = "monospace";
  summary.style.fontSize = "16px";
  summary.style.display = "flex";
  summary.style.flexDirection = "column";
  summary.style.alignItems = "center";
  summary.style.justifyContent = "center";
  summary.innerHTML = `
    <h2>🧬 Final Genome Summary</h2>
    <p>Genome Sequence: ${genome.join(" - ")}</p>
    <p>Boosted Traits: ${boosted.join(", ")}</p>
    <p>${resistanceText}</p>
    <button onclick="location.href='index.html#lab'" style="margin-top: 20px; padding: 6px 14px; font-family: monospace;">➡️ Continue</button>
  `;
  document.getElementById("gameContainer").appendChild(summary);
}

function gameOverScreen() {
  gameRunning = false;
  clearInterval(hazardSpawner);
  document.querySelectorAll(".hazard, .power-up, #player").forEach(el => el.remove());

  const screen = document.createElement("div");
  screen.style.position = "absolute";
  screen.style.top = "0";
  screen.style.left = "0";
  screen.style.width = "100%";
  screen.style.height = "100%";
  screen.style.background = "#000";
  screen.style.color = "red";
  screen.style.fontFamily = "monospace";
  screen.style.fontSize = "20px";
  screen.style.display = "flex";
  screen.style.flexDirection = "column";
  screen.style.alignItems = "center";
  screen.style.justifyContent = "center";
  screen.innerHTML = `
    <h1>☠️ GAME OVER</h1>
    <p>You were hit too many times by threats.</p>
    <p>Return to the lab and start over.</p>
    <button onclick="location.href='index.html#lab'" style="margin-top: 20px; padding: 6px 14px;">🔁 Retry</button>
  `;
  document.getElementById("gameContainer").appendChild(screen);
}

function saveAndExit() {
  localStorage.setItem("playerHealth", health);
  const boosted = genome.filter(t => t.includes("★"));
  if (boosted.length > 0) {
    localStorage.setItem("playerBoostedTraits", boosted.join("-"));
  }
  localStorage.setItem("playerGenome", genome.join("-"));
  location.href = "index.html#lab";
}

function showHelp() {
  alert(`🧬 ExoThreat Simulation Guide:

- Move left/right with arrow keys.
- Avoid obstacles (🔥 ☣️ 💨 ☠️).
- Collect power-ups (💊 💉) to boost genome traits.
- Stars = Lives. You lose one for each hit.
- Game ends after 60s or when all stars are lost.`);
}

const style = document.createElement("style");
style.innerHTML = `
  body {
    margin: 0;
    background: black;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
  }
  #gameContainer {
    position: relative;
    width: 390px;
    height: 700px;
    background: #000;
    border: 3px solid lime;
    overflow: hidden;
  }
  #player {
    position: absolute;
  }
  .power-up, .hazard {
    z-index: 10;
  }
  #traitDisplayContainer {
    position: absolute;
    top: 40px;
    right: 5px;
    font-family: monospace;
    font-size: 14px;
    color: lime;
    text-align: left;
  }
  #starDisplay {
    position: absolute;
    bottom: 10px;
    right: 10px;
    color: yellow;
    font-size: 20px;
  }
`;
document.head.appendChild(style);

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("helpBtn")?.addEventListener("click", showHelp);
  document.getElementById("exitBtn")?.addEventListener("click", saveAndExit);
  document.querySelector("#retryBtn")?.addEventListener("click", () => location.href = 'index.html#lab');
});

let genomeValid = loadGenome();
if (!genomeValid) {
  showGenomeWarning();
} else {
  document.body.innerHTML = `
    <div id="gameContainer">
      <button id="helpBtn" style='position: absolute; top: 10px; right: 10px; font-family: monospace;'>❓ Help</button>
      <button id="exitBtn" style='position: absolute; top: 10px; left: 10px; font-family: monospace;'>🔚 Exit</button>
      <p id='healthBar' style='text-align:center; font-family: monospace; color: red;'>❤️ Health: 100%</p>
      <div id='traitDisplayContainer'><ul id="traitDisplay"></ul></div>
      <div id='starDisplay'>⭐⭐⭐⭐⭐</div>
    </div>`;
}

if (genomeValid) {
  createPlayer();
  setupControls();
  updateTraitDisplay();
  hazardSpawner = setInterval(spawnHazard, 1000);
  requestAnimationFrame(gameLoop);
}
