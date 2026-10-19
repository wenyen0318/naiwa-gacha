// ====================================================
// 奶蛙抽卡樂園 — 主程式
// ====================================================

// ---------- 卡片資料 ----------
// 圖片放在 images 資料夾，想換圖只要改 img 的檔名即可
const CARDS = [
  { id: 1,  name: "奶蛙",         rarity: "N",   img: "images/naiwa.jpg",      desc: "一切的起點，最原始的奶蛙" },
  { id: 2,  name: "奶雞",         rarity: "N",   img: "images/chicken.jpg",    desc: "頭上長了一撮雞冠" },
  { id: 3,  name: "奶鼠",         rarity: "N",   img: "images/mouse.jpg",      desc: "耳朵圓圓的，很愛偷吃起司" },
  { id: 4,  name: "奶牛",         rarity: "N",   img: "images/cow.jpg",        desc: "有角的奶蛙，喝的是自己的奶？" },
  { id: 5,  name: "奶傘奶褲奶蛙", rarity: "N",   img: "images/umbrella.jpg",   desc: "人，下雨了" },
  { id: 6,  name: "奶拖車",       rarity: "R",   img: "images/scooter.jpg",    desc: "奶蛙專屬交通工具" },
  { id: 10, name: "仙度瑞奶蛙",   rarity: "R",   img: "images/cinderella.jpg", desc: "午夜十二點前要回家" },
  { id: 8,  name: "美奶魚蛙",     rarity: "R",   img: "images/mermaid.jpg",    desc: "住在海底的奶蛙" },
  { id: 9,  name: "奶蛙仙子",     rarity: "R",   img: "images/fairy.jpg",      desc: "揮一揮魔杖，變出牛奶" },
  { id: 7,  name: "奶家人？",     rarity: "SR",  img: "images/family.jpg",     desc: "到底是不是一家人？" },
  { id: 11, name: "蒙娜麗莎奶蛙", rarity: "SR",  img: "images/monalisa.jpg",   desc: "神秘的微笑" },
  { id: 12, name: "天使奶蛙",     rarity: "SSR", img: "images/angel.jpg",      desc: "傳說中從天而降的奶蛙" },
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
let state = { points: 0, best: 0, collection: {}, pity: 0, muted: false };

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved) state = Object.assign(state, saved);
  } catch (e) { /* 讀不到就用預設值 */ }
}
function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

// ---------- 卡片圖片 ----------
function frogSVG(card) {
  return `<img src="${card.img}" alt="${card.name}" draggable="false">`;
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
    if (tab.dataset.tab !== "game") pauseGame();
    if (tab.dataset.tab === "dex") renderDex();
  });
});

// ====================================================
// 小遊戲：接奶蛋
// ====================================================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = 360, H = 480;
// 高解析度螢幕（Retina、手機）讓畫面不模糊
const DPR = Math.min(window.devicePixelRatio || 1, 3);
canvas.width = W * DPR;
canvas.height = H * DPR;
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
const GAME_TIME = 30;

const EGG_TYPES = [
  { type: "milk", chance: 70, score: 10 },
  { type: "gold", chance: 10, score: 30 },
  { type: "bad",  chance: 20, score: -20 },
];

// 遊戲用圖片
function loadImg(src) { const im = new Image(); im.src = src; return im; }
const IMG = {
  player: loadImg("images/player.png"),
  milk:   loadImg("images/egg.png"),
  gold:   loadImg("images/egg-gold.png"),
  bad:    loadImg("images/egg-bad.png"),
};
const FROG_W = 66, FROG_H = 110;
const EGG_W = 36, EGG_H = 42;

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
    badStreak: 0,
    lastTime: performance.now(),
    paused: false,
  };
  document.getElementById("overlay").classList.add("hidden");
  requestAnimationFrame(loop);
}

// 切換到其他分頁時暫停遊戲
function pauseGame() {
  if (!game || game.paused) return;
  game.paused = true;
  keys.left = keys.right = false;
  document.getElementById("overlay-title").textContent = "⏸ 暫停中";
  document.getElementById("overlay-text").innerHTML =
    `目前 <b>${game.score}</b> 分，還剩 <b>${Math.ceil(game.timeLeft)}</b> 秒`;
  document.getElementById("start-btn").textContent = "繼續遊戲";
  document.getElementById("overlay").classList.remove("hidden");
}
function resumeGame() {
  game.paused = false;
  game.lastTime = performance.now();
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
  if (!game || game.paused) return;
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
    let t = randomEggType();
    // 避免壞蛋太多：不連續出 3 顆壞蛋，畫面上最多同時 2 顆壞蛋
    const badOnScreen = game.eggs.filter(e => e.type === "bad").length;
    if (t.type === "bad" && (game.badStreak >= 2 || badOnScreen >= 2)) t = EGG_TYPES[0];
    game.badStreak = t.type === "bad" ? game.badStreak + 1 : 0;
    game.eggs.push({
      x: 20 + Math.random() * (W - 40),
      y: -20,
      vy: 140 + elapsed * 6 + Math.random() * 60,
      ...t,
    });
    game.spawnTimer = Math.max(0.3, 0.75 - elapsed * 0.015);
  }

  // 奶蛋掉落與碰撞
  const frogTop = H - 12 - FROG_H + 10;   // 奶蛙頭頂附近
  game.eggs = game.eggs.filter(egg => {
    egg.y += egg.vy * dt;
    if (egg.y > frogTop && egg.y < frogTop + 40 && Math.abs(egg.x - game.frogX) < FROG_W / 2 + 12) {
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

// 圖片是否已成功載入（沒載入時改畫簡單圖形，避免遊戲當掉）
function ready(img) { return img.complete && img.naturalWidth > 0; }

function drawEgg(egg) {
  const img = IMG[egg.type];
  if (ready(img)) {
    ctx.drawImage(img, egg.x - EGG_W / 2, egg.y - EGG_H / 2, EGG_W, EGG_H);
  } else {
    ctx.fillStyle = egg.type === "gold" ? "#ffc93c" : egg.type === "bad" ? "#9ea57f" : "#f3d27a";
    ctx.beginPath();
    ctx.ellipse(egg.x, egg.y, EGG_W / 2, EGG_H / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFrog(x) {
  if (ready(IMG.player)) {
    ctx.drawImage(IMG.player, x - FROG_W / 2, H - 12 - FROG_H, FROG_W, FROG_H);
  } else {
    ctx.fillStyle = "#f3d27a";
    ctx.beginPath();
    ctx.ellipse(x, H - 12 - FROG_H / 2, FROG_W / 2, FROG_H / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
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
  if (!game || game.paused) return;
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
canvas.addEventListener("pointermove", e => { if (game && !game.paused) game.targetX = pointerToX(e); });
canvas.addEventListener("pointerdown", e => { if (game && !game.paused) game.targetX = pointerToX(e); });

document.getElementById("start-btn").addEventListener("click", () => {
  if (game && game.paused) resumeGame();
  else startGame();
});

// ====================================================
// 音效：捧腹大笑
// 優先播放 sounds/laugh.mp3；讀不到音檔時改用程式合成的笑聲
// ====================================================
let audioCtx = null;
let laughBuffer = null;      // 解碼後的笑聲（Web Audio 用）
const laughAudio = new Audio("sounds/laugh.mp3");   // 備用播放方式
laughAudio.preload = "auto";
let laughFileOK = true;
laughAudio.addEventListener("error", () => { laughFileOK = false; });

function getAudioCtx() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { audioCtx = null; }
  return audioCtx;
}

// 預先下載並解碼笑聲，抽卡時才能準時播放
fetch("sounds/laugh.mp3")
  .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
  .then(data => {
    const ac = getAudioCtx();
    return ac && new Promise((ok, fail) => ac.decodeAudioData(data, ok, fail));
  })
  .then(buf => { if (buf) laughBuffer = buf; })
  .catch(() => {});

function playLaugh(delay, big) {
  if (state.muted) return;
  const ac = getAudioCtx();
  if (ac && ac.state === "suspended") ac.resume();
  const length = big ? 5 : 2.5;        // 抽到 SR／SSR 笑比較久

  // 方法 1：Web Audio 播放音檔（最準時）
  if (ac && laughBuffer) {
    const src = ac.createBufferSource();
    src.buffer = laughBuffer;
    const g = ac.createGain();
    const t0 = ac.currentTime + delay;
    // 每次從音檔中隨機一段開始播，笑聲才不會每次都一樣
    const offset = Math.random() * Math.max(0, laughBuffer.duration - length);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(1, t0 + 0.05);
    g.gain.setValueAtTime(1, t0 + length - 0.4);
    g.gain.linearRampToValueAtTime(0, t0 + length);
    src.connect(g); g.connect(ac.destination);
    src.start(t0, offset, length);
    return;
  }
  // 方法 2：一般 Audio 播放音檔（直接開本機檔案時）
  if (laughFileOK) {
    setTimeout(() => {
      laughAudio.currentTime = Math.random() * Math.max(0, (laughAudio.duration || 0) - length);
      laughAudio.volume = 1;
      laughAudio.play().catch(() => synthLaugh(0, big));
      setTimeout(() => laughAudio.pause(), length * 1000);
    }, delay * 1000);
    return;
  }
  // 方法 3：程式合成笑聲
  synthLaugh(delay, big);
}

function synthLaugh(delay, big) {
  const ac = getAudioCtx();
  if (!ac) return;

  const t0 = ac.currentTime + delay;
  const count = big ? 11 : 7;          // 抽到 SR／SSR 笑比較久
  const out = ac.createGain();
  out.gain.value = 1.0;
  out.connect(ac.destination);

  // 聲帶：鋸齒波，經過「啊」的共振峰濾波
  const voice = ac.createOscillator();
  voice.type = "sawtooth";
  const vGain = ac.createGain();
  vGain.gain.value = 0;
  voice.connect(vGain);
  [[750, 6, 1], [1150, 8, 0.6], [2600, 10, 0.25]].forEach(([f, q, g]) => {
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q;
    const amp = ac.createGain(); amp.gain.value = g * 3;
    vGain.connect(bp); bp.connect(amp); amp.connect(out);
  });

  // 氣音「哈」的 h：白噪音
  const len = Math.ceil(ac.sampleRate * (count * 0.25 + 0.5));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const nFilter = ac.createBiquadFilter();
  nFilter.type = "bandpass"; nFilter.frequency.value = 1400; nFilter.Q.value = 0.8;
  const nGain = ac.createGain();
  nGain.gain.value = 0;
  noise.connect(nFilter); nFilter.connect(nGain); nGain.connect(out);

  // 每一聲「哈」：先氣音再出聲，音高逐漸往下掉
  let t = t0;
  for (let i = 0; i < count; i++) {
    const dur = 0.13 + Math.random() * 0.04;
    const pitch = 300 - i * (big ? 12 : 16) + Math.random() * 25;
    nGain.gain.setValueAtTime(0, t);
    nGain.gain.linearRampToValueAtTime(0.35, t + 0.02);
    nGain.gain.linearRampToValueAtTime(0.05, t + 0.05);
    nGain.gain.linearRampToValueAtTime(0, t + dur);
    voice.frequency.setValueAtTime(pitch * 1.08, t + 0.03);
    voice.frequency.exponentialRampToValueAtTime(pitch * 0.85, t + dur);
    vGain.gain.setValueAtTime(0, t + 0.025);
    vGain.gain.linearRampToValueAtTime(0.5, t + 0.05);
    vGain.gain.setValueAtTime(0.5, t + dur * 0.6);
    vGain.gain.linearRampToValueAtTime(0, t + dur);
    t += dur + 0.05 + (i === 3 && big ? 0.18 : 0);   // 笑到一半換氣
  }
  voice.start(t0); noise.start(t0);
  voice.stop(t + 0.1); noise.stop(t + 0.1);
}

// 靜音按鈕
const muteBtn = document.getElementById("mute-btn");
function updateMute() { muteBtn.textContent = state.muted ? "🔇" : "🔊"; }
muteBtn.addEventListener("click", () => {
  state.muted = !state.muted;
  saveState();
  updateMute();
});

// ====================================================
// 抽卡
// ====================================================
const drawBtn = document.getElementById("draw-btn");
const drawCard = document.getElementById("draw-card");
const cardFront = document.getElementById("card-front");
const drawMsg = document.getElementById("draw-msg");
let drawing = false;

// 隱藏保底：連續 PITY 抽都沒有 SSR，這一抽必定是 SSR（畫面上不顯示）
const PITY = 50;

function rollCard() {
  // 1. 先決定稀有度
  let r = Math.random() * 100;
  let rarity = "N";
  for (const key of ["SSR", "SR", "R", "N"]) {
    if (r < RARITY[key].rate) { rarity = key; break; }
    r -= RARITY[key].rate;
  }
  state.pity = (state.pity || 0) + 1;
  if (state.pity >= PITY) rarity = "SSR";
  if (rarity === "SSR") state.pity = 0;
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
  playLaugh(0.9, card.rarity === "SSR" || card.rarity === "SR");   // 翻開卡片時大笑
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
  state = { points: 0, best: 0, collection: {}, pity: 0, muted: state.muted };
  saveState();
  updatePoints();
  renderDex();
});

// ---------- 開始 ----------
loadState();
updateMute();
updatePoints();
renderDex();
