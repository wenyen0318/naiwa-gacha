// ====================================================
// 奶蛙抽卡樂園 — 主程式
// ====================================================

// ---------- 卡片資料 ----------
// body：身體顏色　belly：肚子顏色　deco：頭上裝飾
// 想換成自己畫的圖片：在卡片加上 img: "images/xxx.png" 即可
const CARDS = [
  { id: 1,  name: "原味奶蛙",   rarity: "N",   body: "#f3f0e6", belly: "#ffffff", deco: "🥛", desc: "最經典的一杯鮮奶" },
  { id: 2,  name: "草莓奶蛙",   rarity: "N",   body: "#f9c4d2", belly: "#fff0f4", deco: "🍓", desc: "粉粉甜甜的草莓牛奶" },
  { id: 3,  name: "巧克力奶蛙", rarity: "N",   body: "#b78a6b", belly: "#f1ddc9", deco: "🍫", desc: "可可香氣滿滿" },
  { id: 4,  name: "抹茶奶蛙",   rarity: "N",   body: "#a9cf8a", belly: "#eef7e3", deco: "🍵", desc: "微苦回甘的大人口味" },
  { id: 5,  name: "香蕉奶蛙",   rarity: "N",   body: "#f7e17c", belly: "#fffbe2", deco: "🍌", desc: "早餐店的好朋友" },
  { id: 6,  name: "珍奶奶蛙",   rarity: "R",   body: "#d9b48f", belly: "#f7ead9", deco: "🧋", desc: "身上有 Q 彈珍珠" },
  { id: 7,  name: "布丁奶蛙",   rarity: "R",   body: "#f5d77e", belly: "#fff6d8", deco: "🍮", desc: "頭頂有焦糖" },
  { id: 8,  name: "芋頭奶蛙",   rarity: "R",   body: "#c3a6d8", belly: "#f3ebf9", deco: "💜", desc: "綿密芋泥口感" },
  { id: 9,  name: "優格奶蛙",   rarity: "R",   body: "#a9d7ee", belly: "#f0f9fd", deco: "🫐", desc: "酸酸的藍莓優格" },
  { id: 10, name: "星空奶蛙",   rarity: "SR",  body: "#3d4a8a", belly: "#c9d2f5", deco: "✨", desc: "晚上才會出現" },
  { id: 11, name: "彩虹奶蛙",   rarity: "SR",  body: "rainbow", belly: "#ffffff", deco: "🌈", desc: "下過雨才看得到" },
  { id: 12, name: "黃金奶蛙王", rarity: "SSR", body: "gold",    belly: "#fff6cc", deco: "👑", desc: "傳說中的奶蛙之王" },
];

const RARITY = {
  N:   { rate: 60, label: "普通" },
  R:   { rate: 30, label: "稀有" },
  SR:  { rate: 9,  label: "超稀有" },
  SSR: { rate: 1,  label: "傳說" },
};

const COST = 100;
const SAVE_KEY = "naiwa-gacha-save";

// ---------- 存檔 ----------
let state = { points: 0, best: 0, collection: {} };

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved) state = Object.assign(state, saved);
  } catch (e) { /* 讀不到就用預設值 */ }
}
function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

// ---------- 奶蛙圖案（SVG） ----------
let svgId = 0;
function frogSVG(card) {
  if (card.img) return `<img src="${card.img}" alt="${card.name}" style="width:100%;max-width:140px">`;

  const id = "g" + (svgId++);
  let defs = "";
  let fill = card.body;
  if (card.body === "rainbow") {
    defs = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb3ba"/><stop offset=".25" stop-color="#ffdfba"/>
      <stop offset=".5" stop-color="#ffffba"/><stop offset=".75" stop-color="#baffc9"/>
      <stop offset="1" stop-color="#bae1ff"/></linearGradient>`;
    fill = `url(#${id})`;
  } else if (card.body === "gold") {
    defs = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#e8a820"/></linearGradient>`;
    fill = `url(#${id})`;
  }

  const stars = card.id === 10
    ? `<text x="22" y="72" font-size="8" fill="#fff">★</text><text x="70" y="80" font-size="6" fill="#fff">★</text><text x="40" y="88" font-size="5" fill="#fff">★</text>`
    : "";
  const pearls = card.id === 6
    ? `<circle cx="30" cy="78" r="3" fill="#4a3226"/><circle cx="70" cy="74" r="3" fill="#4a3226"/><circle cx="64" cy="86" r="3" fill="#4a3226"/>`
    : "";

  return `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs>
    <ellipse cx="50" cy="66" rx="36" ry="27" fill="${fill}" stroke="#5b4636" stroke-width="2"/>
    <circle cx="31" cy="40" r="13" fill="${fill}" stroke="#5b4636" stroke-width="2"/>
    <circle cx="69" cy="40" r="13" fill="${fill}" stroke="#5b4636" stroke-width="2"/>
    <ellipse cx="50" cy="72" rx="21" ry="15" fill="${card.belly}"/>
    ${stars}${pearls}
    <circle cx="31" cy="40" r="8" fill="#fff"/>
    <circle cx="69" cy="40" r="8" fill="#fff"/>
    <circle cx="33" cy="41" r="4.5" fill="#3b2a20"/>
    <circle cx="67" cy="41" r="4.5" fill="#3b2a20"/>
    <circle cx="34.5" cy="39.5" r="1.5" fill="#fff"/>
    <circle cx="68.5" cy="39.5" r="1.5" fill="#fff"/>
    <ellipse cx="25" cy="58" rx="6" ry="3.5" fill="#f59fb5" opacity=".7"/>
    <ellipse cx="75" cy="58" rx="6" ry="3.5" fill="#f59fb5" opacity=".7"/>
    <path d="M43 59 Q50 66 57 59" fill="none" stroke="#5b4636" stroke-width="2" stroke-linecap="round"/>
    <text x="50" y="22" font-size="17" text-anchor="middle">${card.deco}</text>
  </svg>`;
}

// ---------- 共用：更新點數 ----------
const pointsEl = document.getElementById("points");
function updatePoints() {
  pointsEl.textContent = state.points;
  document.getElementById("draw-btn").disabled = state.points < COST;
  document.getElementById("best").textContent = state.best;
}

// ---------- 分頁切換 ----------
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "dex") renderDex();
  });
});

// ====================================================
// 小遊戲：接奶蛋
// ====================================================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const GAME_TIME = 30;

const EGG_TYPES = [
  { type: "milk", chance: 70, score: 10 },
  { type: "gold", chance: 10, score: 30 },
  { type: "bad",  chance: 20, score: -20 },
];

let game = null;     // 遊戲進行中的資料
const keys = { left: false, right: false };

function startGame() {
  game = {
    frogX: W / 2,
    targetX: null,
    score: 0,
    timeLeft: GAME_TIME,
    eggs: [],
    popups: [],
    spawnTimer: 0,
    lastTime: performance.now(),
  };
  document.getElementById("overlay").classList.add("hidden");
  requestAnimationFrame(loop);
}

function randomEggType() {
  let r = Math.random() * 100;
  for (const t of EGG_TYPES) {
    if (r < t.chance) return t;
    r -= t.chance;
  }
  return EGG_TYPES[0];
}

function loop(now) {
  if (!game) return;
  const dt = Math.min((now - game.lastTime) / 1000, 0.05);
  game.lastTime = now;
  const elapsed = GAME_TIME - game.timeLeft;

  // 時間
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) return endGame();

  // 移動奶蛙
  const speed = 320;
  if (keys.left) game.frogX -= speed * dt;
  if (keys.right) game.frogX += speed * dt;
  if (game.targetX !== null) {
    game.frogX += (game.targetX - game.frogX) * Math.min(1, dt * 12);
  }
  game.frogX = Math.max(34, Math.min(W - 34, game.frogX));

  // 產生奶蛋（越來越快）
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    const t = randomEggType();
    game.eggs.push({
      x: 20 + Math.random() * (W - 40),
      y: -20,
      vy: 140 + elapsed * 6 + Math.random() * 60,
      ...t,
    });
    game.spawnTimer = Math.max(0.3, 0.75 - elapsed * 0.015);
  }

  // 奶蛋掉落與碰撞
  const frogTop = H - 70;
  game.eggs = game.eggs.filter(egg => {
    egg.y += egg.vy * dt;
    if (egg.y > frogTop && egg.y < frogTop + 30 && Math.abs(egg.x - game.frogX) < 40) {
      game.score = Math.max(0, game.score + egg.score);
      game.popups.push({ x: egg.x, y: frogTop, text: (egg.score > 0 ? "+" : "") + egg.score, life: 0.8, good: egg.score > 0 });
      return false;
    }
    return egg.y < H + 20;
  });

  game.popups.forEach(p => { p.y -= 40 * dt; p.life -= dt; });
  game.popups = game.popups.filter(p => p.life > 0);

  document.getElementById("score").textContent = game.score;
  document.getElementById("timer").textContent = Math.ceil(game.timeLeft);

  draw();
  requestAnimationFrame(loop);
}

function drawEgg(egg) {
  ctx.save();
  ctx.translate(egg.x, egg.y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 17, 0, 0, Math.PI * 2);
  ctx.fillStyle = egg.type === "gold" ? "#ffd54f" : egg.type === "bad" ? "#a5ab86" : "#fffdf5";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#5b4636";
  ctx.stroke();

  if (egg.type === "milk") {          // 牛奶滴
    ctx.fillStyle = "#cfe8f7";
    ctx.beginPath();
    ctx.arc(0, 4, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (egg.type === "gold") {   // 閃光
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-4, -6, 3, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {                            // 裂痕
    ctx.beginPath();
    ctx.moveTo(-10, -2); ctx.lineTo(-4, 3); ctx.lineTo(1, -3); ctx.lineTo(6, 3); ctx.lineTo(11, -1);
    ctx.stroke();
    ctx.fillStyle = "#6f7556";
    ctx.beginPath(); ctx.arc(-4, -9, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawFrog(x) {
  const y = H - 45;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#5b4636";
  ctx.fillStyle = "#cdebc5";
  // 身體
  ctx.beginPath(); ctx.ellipse(0, 10, 38, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // 眼睛凸起
  [-18, 18].forEach(ex => {
    ctx.fillStyle = "#cdebc5";
    ctx.beginPath(); ctx.arc(ex, -14, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(ex, -14, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3b2a20";
    ctx.beginPath(); ctx.arc(ex, -13, 4, 0, Math.PI * 2); ctx.fill();
  });
  // 肚子
  ctx.fillStyle = "#fffdf7";
  ctx.beginPath(); ctx.ellipse(0, 16, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
  // 腮紅
  ctx.fillStyle = "rgba(245,159,181,.7)";
  ctx.beginPath(); ctx.ellipse(-25, 4, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(25, 4, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  // 張嘴
  ctx.fillStyle = "#e98aa3";
  ctx.beginPath(); ctx.ellipse(0, 3, 8, 5, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // 草地
  ctx.fillStyle = "#cdebc5";
  ctx.fillRect(0, H - 18, W, 18);

  game.eggs.forEach(drawEgg);
  drawFrog(game.frogX);

  game.popups.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / 0.8);
    ctx.fillStyle = p.good ? "#5fae63" : "#e0556f";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  });
}

function endGame() {
  const earned = game.score;
  state.points += earned;
  const newBest = earned > state.best;
  if (newBest) state.best = earned;
  saveState();
  updatePoints();
  game = null;

  document.getElementById("timer").textContent = 0;
  document.getElementById("overlay-title").textContent = newBest ? "🎉 新紀錄！" : "時間到！";
  document.getElementById("overlay-text").innerHTML =
    `這局得到 <b>${earned}</b> 分，獲得 <b>${earned}</b> 點<br>目前共有 <b>${state.points}</b> 點`;
  document.getElementById("start-btn").textContent = "再玩一次";
  document.getElementById("overlay").classList.remove("hidden");
}

// 鍵盤操作
document.addEventListener("keydown", e => {
  if (!game) return;
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { keys.left = true; game.targetX = null; e.preventDefault(); }
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { keys.right = true; game.targetX = null; e.preventDefault(); }
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
});

// 滑鼠／觸控操作
function pointerToX(e) {
  const rect = canvas.getBoundingClientRect();
  return (e.clientX - rect.left) * (W / rect.width);
}
canvas.addEventListener("pointermove", e => { if (game) game.targetX = pointerToX(e); });
canvas.addEventListener("pointerdown", e => { if (game) game.targetX = pointerToX(e); });

document.getElementById("start-btn").addEventListener("click", startGame);

// ====================================================
// 抽卡
// ====================================================
const drawBtn = document.getElementById("draw-btn");
const drawCard = document.getElementById("draw-card");
const cardFront = document.getElementById("card-front");
const drawMsg = document.getElementById("draw-msg");
let drawing = false;

function rollCard() {
  // 1. 先決定稀有度
  let r = Math.random() * 100;
  let rarity = "N";
  for (const key of ["SSR", "SR", "R", "N"]) {
    if (r < RARITY[key].rate) { rarity = key; break; }
    r -= RARITY[key].rate;
  }
  // 2. 再從該稀有度隨機挑一張
  const pool = CARDS.filter(c => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

drawBtn.addEventListener("click", () => {
  if (drawing || state.points < COST) return;
  drawing = true;
  drawBtn.disabled = true;

  state.points -= COST;
  const card = rollCard();
  const isNew = !state.collection[card.id];
  state.collection[card.id] = (state.collection[card.id] || 0) + 1;
  saveState();
  pointsEl.textContent = state.points;

  // 動畫：翻回背面 → 搖晃 → 翻開
  drawCard.classList.remove("flipped");
  drawMsg.textContent = "抽卡中…";
  setTimeout(() => {
    cardFront.className = "card-face card-front rarity-" + card.rarity;
    cardFront.innerHTML = `
      <span class="tag ${card.rarity}">${card.rarity} ${RARITY[card.rarity].label}</span>
      ${frogSVG(card)}
      <div class="name">${card.name}</div>
      <div class="desc">${card.desc}</div>`;
    drawCard.classList.add("shake");
  }, 400);
  setTimeout(() => {
    drawCard.classList.remove("shake");
    drawCard.classList.add("flipped");
  }, 900);
  setTimeout(() => {
    const star = card.rarity === "SSR" ? "🌟 傳說降臨！" : card.rarity === "SR" ? "✨ 好運！" : "";
    drawMsg.textContent = `${star}抽到「${card.name}」${isNew ? "　🆕 NEW!" : `（第 ${state.collection[card.id]} 張）`}`;
    drawing = false;
    updatePoints();
  }, 1600);
});

// ====================================================
// 圖鑑
// ====================================================
function renderDex() {
  const grid = document.getElementById("dex-grid");
  const owned = CARDS.filter(c => state.collection[c.id]).length;
  document.getElementById("dex-count").textContent = owned;
  document.getElementById("dex-bar").style.width = (owned / CARDS.length * 100) + "%";

  grid.innerHTML = CARDS.map(c => {
    const count = state.collection[c.id] || 0;
    return count
      ? `<div class="dex-item rarity-${c.rarity}">
           <span class="count">×${count}</span>
           ${frogSVG(c)}
           <div><span class="tag ${c.rarity}">${c.rarity}</span></div>
           <div class="name">${c.name}</div>
         </div>`
      : `<div class="dex-item locked">
           ${frogSVG(c)}
           <div><span class="tag" style="background:#ddd">？</span></div>
           <div class="name">？？？</div>
         </div>`;
  }).join("");
}

document.getElementById("reset-btn").addEventListener("click", () => {
  if (!confirm("確定要清除所有點數和卡片嗎？")) return;
  state = { points: 0, best: 0, collection: {} };
  saveState();
  updatePoints();
  renderDex();
});

// ---------- 開始 ----------
loadState();
updatePoints();
renderDex();
