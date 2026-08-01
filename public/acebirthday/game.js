/* ============================================================
   GAME ENGINE — you shouldn't need to edit this file.
   All song-specific stuff lives in chart.js.
   ============================================================ */

(function () {
  const LANES = 4;
  const KEYS = ['d', 'f', 'j', 'k'];
  const LANE_COLORS = ['#ff5fa2', '#ffd23f', '#4fd8ff', '#b26bff'];

  const CANVAS_W = 480;
  const CANVAS_H = 720;
  const RECEPTOR_Y = 640;      // where you hit the notes
  const NOTE_H = 22;
  const LANE_W = CANVAS_W / LANES;

  // judging windows, in seconds (distance between note time and hit time)
  const WINDOWS = {
    perfect: 0.045,
    great: 0.09,
    good: 0.14,
    bad: 0.20
  };

  const SCORE_VALUES = { perfect: 300, great: 200, good: 100, bad: 50, miss: 0 };

  // ---------- DOM refs ----------
  const startScreen = document.getElementById('start-screen');
  const gameScreen = document.getElementById('game-screen');
  const endScreen = document.getElementById('end-screen');
  const songStatus = document.getElementById('song-status');
  const startBtn = document.getElementById('start-btn');
  const retryBtn = document.getElementById('retry-btn');
  const audio = document.getElementById('song-audio');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const endTitle = document.getElementById('end-title');
  const endStats = document.getElementById('end-stats');
  const birthdayMsg = document.getElementById('birthday-msg');

  let songLoaded = false;

  audio.addEventListener('canplaythrough', () => {
    if (songLoaded) return; // only need this to fire once
    songLoaded = true;
    songStatus.textContent = `Ready: audio.mp3`;
    startBtn.disabled = false;
  });

  audio.addEventListener('error', () => {
    songStatus.textContent = `Couldn't find audio.mp3 — make sure it's in the same folder as index.html.`;
  });

  // in case the audio is already cached/loaded before listeners attach
  if (audio.readyState >= 4) {
    songLoaded = true;
    songStatus.textContent = `Ready: audio.mp3`;
    startBtn.disabled = false;
  }

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', () => {
    endScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
  });

  // ---------- runtime state ----------
  let notes = [];       // {time, lane, hit, missed, y}
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let counts = { perfect: 0, great: 0, good: 0, bad: 0, miss: 0 };
  let rafId = null;
  let started = false;

  function beatsToNotes(chart) {
    const spb = 60 / chart.bpm; // seconds per beat
    return chart.notes
      .map(nt => ({
        time: chart.offset + nt.beat * spb,
        lane: nt.lane,
        hit: false,
        missed: false
      }))
      .sort((a, b) => a.time - b.time);
  }

  function startGame() {
    if (!songLoaded) return;

    notes = beatsToNotes(CHART);
    score = 0;
    combo = 0;
    maxCombo = 0;
    counts = { perfect: 0, great: 0, good: 0, bad: 0, miss: 0 };
    started = true;

    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    updateHud();

    audio.currentTime = 0;
    audio.play();
    document.body.classList.add('playing');
    audio.onended = () => finishGame();

    if (rafId) cancelAnimationFrame(rafId);
    loop();
  }

  function finishGame() {
    started = false;
    cancelAnimationFrame(rafId);
    document.body.classList.remove('playing');
    gameScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');

    const total = counts.perfect + counts.great + counts.good + counts.bad + counts.miss;
    const acc = total > 0
      ? ((counts.perfect * 300 + counts.great * 200 + counts.good * 100 + counts.bad * 50) / (total * 300) * 100)
      : 0;

    let title = "Nice try!";
    if (acc >= 95) title = "PERFECT RUN! 🏆";
    else if (acc >= 85) title = "Great job! 🌟";
    else if (acc >= 70) title = "Solid! 🎶";
    else if (acc >= 50) title = "Not bad!";
    endTitle.textContent = title;

    endStats.innerHTML = `
      Score: <b>${score}</b><br>
      Max Combo: <b>${maxCombo}</b><br>
      Accuracy: <b>${acc.toFixed(2)}%</b><br>
      Perfect: ${counts.perfect} &nbsp; Great: ${counts.great} &nbsp;
      Good: ${counts.good} &nbsp; Bad: ${counts.bad} &nbsp; Miss: ${counts.miss}
    `;
    birthdayMsg.textContent = CHART.birthdayMessage || "Happy birthday!! 🎉";
  }

  function updateHud() {
    scoreEl.textContent = `SCORE: ${score}`;
  }

  // on-canvas judge popup state (shown near the receptor line)
  let judgeDisplay = { text: '', color: '#fff', timer: 0 };
  const JUDGE_DISPLAY_TIME = 0.5; // seconds

  function showJudge(text, color) {
    judgeDisplay = { text, color, timer: JUDGE_DISPLAY_TIME };
  }

  function registerHit(judgment) {
    counts[judgment]++;
    score += SCORE_VALUES[judgment];
    if (judgment === 'miss') {
      combo = 0;
    } else {
      combo++;
      maxCombo = Math.max(maxCombo, combo);
    }
    updateHud();

    const colors = {
      perfect: '#ffd23f',
      great: '#4fd8ff',
      good: '#b26bff',
      bad: '#ff8a5c',
      miss: '#ff5f5f'
    };
    const labels = {
      perfect: 'PERFECT',
      great: 'GREAT',
      good: 'GOOD',
      bad: 'BAD',
      miss: 'MISS'
    };
    showJudge(labels[judgment], colors[judgment]);
  }

  // ---------- input ----------
  const laneFlash = [0, 0, 0, 0]; // flash timer per lane for visual feedback

  window.addEventListener('keydown', (e) => {
    if (!started) return;
    const key = e.key.toLowerCase();
    const lane = KEYS.indexOf(key);
    if (lane === -1) return;

    laneFlash[lane] = 1;

    const now = audio.currentTime;
    // find closest un-hit, un-missed note in this lane within the "bad" window
    let bestNote = null;
    let bestDiff = Infinity;
    for (const nt of notes) {
      if (nt.lane !== lane || nt.hit || nt.missed) continue;
      const diff = Math.abs(nt.time - now);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestNote = nt;
      }
    }

    if (bestNote && bestDiff <= WINDOWS.bad) {
      bestNote.hit = true;
      let judgment = 'bad';
      if (bestDiff <= WINDOWS.perfect) judgment = 'perfect';
      else if (bestDiff <= WINDOWS.great) judgment = 'great';
      else if (bestDiff <= WINDOWS.good) judgment = 'good';
      registerHit(judgment);
    }
  });

  // ---------- render loop ----------
  function loop() {
    if (!started) return;
    const now = audio.currentTime;

    // auto-miss notes that scrolled past the window
    for (const nt of notes) {
      if (!nt.hit && !nt.missed && now - nt.time > WINDOWS.bad) {
        nt.missed = true;
        registerHit('miss');
      }
    }

    draw(now);
    for (let i = 0; i < LANES; i++) {
      if (laneFlash[i] > 0) laneFlash[i] -= 0.08;
    }
    if (judgeDisplay.timer > 0) judgeDisplay.timer -= 1 / 60;

    rafId = requestAnimationFrame(loop);
  }

  function draw(now) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // lane backgrounds
    for (let i = 0; i < LANES; i++) {
      const x = i * LANE_W;
      ctx.fillStyle = laneFlash[i] > 0
        ? `rgba(255,255,255,${0.05 + laneFlash[i] * 0.15})`
        : 'rgba(255,255,255,0.02)';
      ctx.fillRect(x, 0, LANE_W, CANVAS_H);

      // lane divider
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }

    // receptor line
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, RECEPTOR_Y);
    ctx.lineTo(CANVAS_W, RECEPTOR_Y);
    ctx.stroke();
    ctx.lineWidth = 1;

    // receptor key boxes
    for (let i = 0; i < LANES; i++) {
      const x = i * LANE_W + LANE_W / 2;
      ctx.save();
      ctx.translate(x, RECEPTOR_Y);
      ctx.fillStyle = laneFlash[i] > 0
        ? LANE_COLORS[i]
        : 'rgba(255,255,255,0.15)';
      ctx.strokeStyle = LANE_COLORS[i];
      ctx.lineWidth = 2;
      const size = 34;
      ctx.beginPath();
      roundRect(ctx, -size / 2, -size / 2, size, size, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Segoe UI';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(KEYS[i].toUpperCase(), 0, 1);
      ctx.restore();
    }

    // combo counter, displayed just above the receptor line
    if (combo > 1) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd23f';
      ctx.shadowColor = '#ffd23f';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 30px Segoe UI';
      ctx.fillText(`${combo}`, CANVAS_W / 2, RECEPTOR_Y - 110);
      ctx.font = 'bold 13px Segoe UI';
      ctx.shadowBlur = 0;
      ctx.fillText('COMBO', CANVAS_W / 2, RECEPTOR_Y - 86);
      ctx.restore();
    }

    // judge popup (PERFECT/GREAT/GOOD/BAD/MISS), fades out near the receptors
    if (judgeDisplay.timer > 0) {
      const alpha = Math.min(1, judgeDisplay.timer / JUDGE_DISPLAY_TIME * 2);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = judgeDisplay.color;
      ctx.shadowColor = judgeDisplay.color;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 22px Segoe UI';
      ctx.fillText(judgeDisplay.text, CANVAS_W / 2, RECEPTOR_Y - 50);
      ctx.restore();
    }

    // notes
    for (const nt of notes) {
      if (nt.hit || nt.missed) continue;
      const timeUntilHit = nt.time - now;
      const progress = 1 - (timeUntilHit / CHART.approachTime);
      const y = progress * RECEPTOR_Y;
      if (y < -NOTE_H || y > CANVAS_H + NOTE_H) continue;

      const x = nt.lane * LANE_W + LANE_W / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = LANE_COLORS[nt.lane];
      ctx.shadowColor = LANE_COLORS[nt.lane];
      ctx.shadowBlur = 12;
      const w = LANE_W - 16;
      ctx.beginPath();
      roundRect(ctx, -w / 2, -NOTE_H / 2, w, NOTE_H, 6);
      ctx.fill();
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
})();
