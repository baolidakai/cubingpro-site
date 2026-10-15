// EO Solver - Based on user's Python brain.py (MIDGE logic)
// MIDGE_POSITIONS: UF, UL, UB, UR, DF, DL, DB, DR, FR, FL, BL, BR
// Indices: 0=UF,1=UL,2=UB,3=UR,4=DF,5=DL,6=DB,7=DR,8=FR,9=FL,10=BL,11=BR
// UD axis: U/D flip. FB axis: F/B flip. RL axis: R/L flip.

const PERM = {
  'U': [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
  "U'": [1, 2, 3, 0, 4, 5, 6, 7, 8, 9, 10, 11],
  'U2': [2, 3, 0, 1, 4, 5, 6, 7, 8, 9, 10, 11],
  'D': [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
  "D'": [0, 1, 2, 3, 7, 4, 5, 6, 8, 9, 10, 11],
  'D2': [0, 1, 2, 3, 6, 7, 4, 5, 8, 9, 10, 11],
  'R': [0, 1, 2, 8, 4, 5, 6, 11, 7, 9, 10, 3],
  "R'": [0, 1, 2, 11, 4, 5, 6, 8, 3, 9, 10, 7],
  'R2': [0, 1, 2, 7, 4, 5, 6, 3, 11, 9, 10, 8],
  'L': [0, 10, 2, 3, 4, 9, 6, 7, 8, 1, 5, 11],
  "L'": [0, 9, 2, 3, 4, 10, 6, 7, 8, 5, 1, 11],
  'L2': [0, 5, 2, 3, 4, 1, 6, 7, 8, 10, 9, 11],
  'F': [9, 1, 2, 3, 8, 5, 6, 7, 0, 4, 10, 11],
  "F'": [8, 1, 2, 3, 9, 5, 6, 7, 4, 0, 10, 11],
  'F2': [4, 1, 2, 3, 0, 5, 6, 7, 9, 8, 10, 11],
  'B': [0, 1, 11, 3, 4, 5, 10, 7, 8, 9, 2, 6],
  "B'": [0, 1, 10, 3, 4, 5, 11, 7, 8, 9, 6, 2],
  'B2': [0, 1, 6, 3, 4, 5, 2, 7, 8, 9, 11, 10],
};

// FLIP per axis
const FLIP_AXES = {
  'UD': {
    'U': [0,1,2,3], "U'": [0,1,2,3], 'U2': [],
    'D': [4,5,6,7], "D'": [4,5,6,7], 'D2': [],
    'R': [], "R'": [], 'R2': [], 'L': [], "L'": [], 'L2': [],
    'F': [], "F'": [], 'F2': [], 'B': [], "B'": [], 'B2': [],
  },
  'FB': {
    'U': [], "U'": [], 'U2': [], 'D': [], "D'": [], 'D2': [],
    'R': [], "R'": [], 'R2': [], 'L': [], "L'": [], 'L2': [],
    'F': [0,4,8,9], "F'": [0,4,8,9], 'F2': [],
    'B': [2,6,10,11], "B'": [2,6,10,11], 'B2': [],
  },
  'RL': {
    'U': [], "U'": [], 'U2': [], 'D': [], "D'": [], 'D2': [],
    'R': [3,7,8,11], "R'": [3,7,8,11], 'R2': [],
    'L': [1,5,9,10], "L'": [1,5,9,10], 'L2': [],
    'F': [], "F'": [], 'F2': [], 'B': [], "B'": [], 'B2': [],
  },
};

function applyMoveEO(eo, move, axis) {
  const perm = PERM[move];
  const flip = (FLIP_AXES[axis] && FLIP_AXES[axis][move]) || [];
  let result = 0;
  for (let i = 0; i < 12; i++) {
    let bit = (eo >> perm[i]) & 1;
    if (flip.includes(perm[i])) bit ^= 1;
    if (bit) result |= (1 << i);
  }
  return result;
}

function eoFromScramble(scramble, axis) {
  let eo = 0;
  for (const m of scramble.trim().split(/\s+/)) {
    if (PERM[m]) eo = applyMoveEO(eo, m, axis);
  }
  return eo;
}

function countBadEO(eo) {
  let c = 0;
  for (let i = 0; i < 12; i++) if ((eo >> i) & 1) c++;
  return c;
}

function getEOState(scramble, axis) {
  return countBadEO(eoFromScramble(scramble, axis));
}

function solveEO(scramble, maxExtra, axis) {
  const start = eoFromScramble(scramble, axis);
  const seen = new Map();
  seen.set(start, []);
  const queue = [start];
  const solutions = [];
  let optLen = -1;
  while (queue.length) {
    const cur = queue.shift();
    const path = seen.get(cur);
    if (cur === 0) {
      if (optLen === -1) optLen = path.length;
      if (path.length > optLen + maxExtra) break;
      solutions.push({ moves: path.join(' '), length: path.length });
      if (solutions.length >= 50) break;
      continue;
    }
    if (optLen !== -1 && path.length >= optLen + maxExtra) continue;
    for (const m of Object.keys(PERM)) {
      if (path.length && m[0] === path[path.length-1][0]) continue;
      const nxt = applyMoveEO(cur, m, axis);
      if (!seen.has(nxt)) {
        seen.set(nxt, [...path, m]);
        queue.push(nxt);
      }
    }
  }
  return solutions;
}

// Random scramble
function randomScramble(length) {
  const faces = ['U','D','F','B','L','R'];
  const suffixes = ['', "'", '2'];
  let result = [];
  let lastFace = '';
  for (let i = 0; i < length; i++) {
    let face;
    do { face = faces[Math.floor(Math.random() * 6)]; } while (face === lastFace);
    lastFace = face;
    result.push(face + suffixes[Math.floor(Math.random() * 3)]);
  }
  return result.join(' ');
}

// RZP stubs (keep for compatibility, simplified)
function getRZPState(scramble) { return { badCorners: 0, badEdges: 0, case: 'N/A' }; }
function findRZPSetup(scramble, maxDepth) { return null; }
function findAllRZPSetups(scramble, maxDepth) { return []; }

if (typeof window !== 'undefined') {
  window.EOSolver2 = { solveEO, getEOState, randomScramble, getRZPState, findRZPSetup, findAllRZPSetups };
}
if (typeof module !== 'undefined') {
  module.exports = { solveEO, getEOState, randomScramble, applyMoveEO, eoFromScramble };
}
