// --- Config ---
const DIAMETERS = [20, 30, 40, 60];
const DISTANCES = [100, 200, 300, 400];
const DIRECTIONS = ["left", "right"];
const BLOCKS = 10;

// --- State ---
let participantId = "";
let device = "";
let blockIndex = 0;
let trialIndex = 0;
let allTrials = [];
let currentCombo = null;

let tracking = false;
let trialActive = false;
let lastMouse = null;
let pathLen = 0;
let tStart = 0;

const welcome   = document.getElementById("welcome");
const lab       = document.getElementById("lab");
const done      = document.getElementById("done");
const homeEl    = document.getElementById("home");
const targetEl  = document.getElementById("target");
const banner    = document.getElementById("banner");
const blockNum  = document.getElementById("blockNum");
const trialNum  = document.getElementById("trialNum");
const pLabel    = document.getElementById("pLabel");
const dLabel    = document.getElementById("dLabel");
const completed = document.getElementById("completed");
const errorsEl  = document.getElementById("errors");
const idVal     = document.getElementById("idVal");
const summary   = document.getElementById("summary");

let errorsTotal = 0;

// Build randomized schedule (32 combos per block)
function makeBlockSchedule() {
  const combos = [];
  for (const d of DIAMETERS) {
    for (const dist of DISTANCES) {
      for (const dir of DIRECTIONS) {
        combos.push({ diameter: d, distance: dist, direction: dir });
      }
    }
  }

  // Fisher–Yates shuffle
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }

  return combos;
}

let schedule = makeBlockSchedule();

// --- Helpers ---
function centerCoords() {
  const rect = lab.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function placeTarget(combo) {
  const c = centerCoords();
  const dx = combo.direction === "left" ? -combo.distance : combo.distance;
  const x = c.x + dx;
  const y = c.y;
  const r = combo.diameter / 2;

  targetEl.style.width  = combo.diameter + "px";
  targetEl.style.height = combo.diameter + "px";
  targetEl.style.left   = x - r + "px";
  targetEl.style.top    = y - r + "px";
  targetEl.style.display = "block";

  return { x, y, r };
}

function targetCenterFromEl() {
  const rect = targetEl.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function withinCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function shannonID(D, W) {
  return Math.log2(D / W + 1);
}

function resetHome() {
  homeEl.style.left = "50%";
  homeEl.style.top  = "50%";
  homeEl.style.transform = "translate(-50%, -50%) scale(1)";
}

// Show / hide instructions
document.getElementById("howto").addEventListener("click", () => {
  const el = document.getElementById("instructions");
  el.style.display = el.style.display === "none" ? "block" : "none";
});

// Begin experiment
document.getElementById("begin").addEventListener("click", () => {
  const pid = document.getElementById("pid").value.trim();
  const dev = document.getElementById("device").value;
  const consent = document.getElementById("consent").checked;

  if (!pid) {
    alert("Please enter a Participant ID.");
    return;
  }
  if (!consent) {
    alert("You must agree to participate to proceed.");
    return;
  }

  participantId = pid;
  device = dev;

  pLabel.textContent = participantId;
  dLabel.textContent = device;

  welcome.style.display = "none";
  lab.style.display = "block";

  startTrial();
});

// --- Trial control ---
function startTrial() {
  // End of block?
  if (trialIndex >= 32) {
    blockIndex++;
    if (blockIndex >= BLOCKS) {
      finishExperiment();
      return;
    }
    schedule = makeBlockSchedule();
    trialIndex = 0;
  }

  currentCombo = schedule[trialIndex];

  blockNum.textContent = String(blockIndex + 1);
  trialNum.textContent = String(trialIndex + 1);
  idVal.textContent = shannonID(currentCombo.distance, currentCombo.diameter).toFixed(3);

  // Prepare "waiting at home"
  resetHome();
  targetEl.style.display = "none";

  tracking = false;
  trialActive = false;
  lastMouse = null;
  pathLen = 0;

  homeEl.dataset.state = "ready"; 
}

// Clicking Home starts a trial and shows the target
homeEl.addEventListener("pointerdown", () => {
  if (homeEl.dataset.state !== "ready") return;

  const combo = currentCombo;

  homeEl.style.transform = "translate(-50%, -50%) scale(0.9)";

  placeTarget(combo);

  tracking = true;
  trialActive = true;
  lastMouse = null;
  pathLen = 0;
  tStart = performance.now();

  homeEl.dataset.state = "running";
});

// Track pointer path while trial is active
lab.addEventListener("pointermove", (e) => {
  if (!tracking) return;

  const x = e.clientX;
  const y = e.clientY;

  if (lastMouse) {
    const dx = x - lastMouse.x;
    const dy = y - lastMouse.y;
    pathLen += Math.hypot(dx, dy);
  }

  lastMouse = { x, y };
});

// Pointer up: end trial ONLY if it's not on Home
lab.addEventListener("pointerup", (e) => {
  if (!trialActive) return;

  // Maintains target until clicked.
  if (e.target === homeEl) {
    return;
  }

  tracking = false;
  trialActive = false;

  const clickX = e.clientX;
  const clickY = e.clientY;

  const { x: tcx, y: tcy } = targetCenterFromEl();
  const r = currentCombo.diameter / 2;
  const hit = withinCircle(clickX, clickY, tcx, tcy, r);

  const mt = performance.now() - tStart;

  if (!hit) {
    errorsTotal++;
  }
  errorsEl.textContent = String(errorsTotal);

  const trial = {
    participant_id: participantId,
    device,
    block: blockIndex + 1,
    trial_in_block: trialIndex + 1,
    diameter_px: currentCombo.diameter,
    distance_px: currentCombo.distance,
    direction: currentCombo.direction,
    id_shannon: shannonID(currentCombo.distance, currentCombo.diameter),
    movement_time_ms: mt,
    path_length_px: pathLen,
    target_cx: tcx,
    target_cy: tcy,
    click_x: clickX,
    click_y: clickY,
    hit: hit ? 1 : 0
  };

  allTrials.push(trial);

  // Feedback banner
  banner.innerHTML = hit
    ? `✔ Hit — ${mt.toFixed(1)} ms`
    : `✖ Miss — ${mt.toFixed(1)} ms`;

  setTimeout(() => {
    banner.innerHTML = `Block ${blockIndex + 1}/10 · Trial ${trialIndex + 1}/32`;
  }, 600);

  // Hide target AFTER the click
  targetEl.style.display = "none";

  // Progress
  const doneCount = blockIndex * 32 + (trialIndex + 1);
  completed.textContent = `${doneCount}/320`;

  // Move to next trial, but user must click Home again to start it
  trialIndex++;
  startTrial();
});

// --- Finish and download CSV and/or JSON---
function finishExperiment() {
  lab.style.display = "none";
  done.style.display = "block";

  const totalMT = allTrials.reduce((sum, t) => sum + t.movement_time_ms, 0);
  const meanMT = totalMT / allTrials.length;

  const hits = allTrials.filter(t => t.hit === 1).length;
  const errRate = 100 * (1 - hits / allTrials.length);

  summary.innerHTML = `
    <p><b>Participant:</b> ${participantId}</p>
    <p><b>Device:</b> ${device}</p>
    <p><b>Trials:</b> ${allTrials.length}</p>
    <p><b>Mean MT:</b> ${meanMT.toFixed(1)} ms</p>
    <p><b>Error rate:</b> ${errRate.toFixed(1)}%</p>
  `;

  document.getElementById("dlCsv").onclick = () => {
    const csv = toCSV(allTrials);
    download(csv, `fitts_trials_${participantId}.csv`, "text/csv");
  };

  document.getElementById("dlJson").onclick = () => {
    const json = JSON.stringify(allTrials, null, 2);
    download(json, `fitts_trials_${participantId}.json`, "application/json");
  };
}

function toCSV(rows) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map(h => row[h]).join(","));
  }

  return lines.join("\n");
}

function download(data, filename, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
