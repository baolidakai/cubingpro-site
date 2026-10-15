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
  window.EOSolver2 = { solveEO, getEOState, randomScramble, getRZPState, findRZPSetup, findAllRZPSetups, getRZPStateFull, findRZPSetups };
}
if (typeof module !== 'undefined') {
  module.exports = { solveEO, getEOState, randomScramble, applyMoveEO, eoFromScramble, getRZPState, findRZPSetup, findAllRZPSetups, getRZPStateFull, findRZPSetups };
}

// ===== RZP: Corner Orientation + E-edge tracking =====
// CORNER_POSITIONS: UFR, UFL, UBL, UBR, DFR, DFL, DBL, DBR
// Indices: 0=UFR,1=UFL,2=UBL,3=UBR,4=DFR,5=DFL,6=DBL,7=DBR
const CORNER_PERM = {
  'U': [3, 0, 1, 2, 4, 5, 6, 7], "U'": [1, 2, 3, 0, 4, 5, 6, 7], 'U2': [2, 3, 0, 1, 4, 5, 6, 7],
  'D': [0, 1, 2, 3, 5, 6, 7, 4], "D'": [0, 1, 2, 3, 7, 4, 5, 6], 'D2': [0, 1, 2, 3, 6, 7, 4, 5],
  'R': [4, 1, 2, 0, 7, 5, 6, 3], "R'": [3, 1, 2, 7, 0, 5, 6, 4], 'R2': [7, 1, 2, 4, 3, 5, 6, 0],
  'L': [0, 2, 6, 3, 4, 1, 5, 7], "L'": [0, 5, 1, 3, 4, 6, 2, 7], 'L2': [0, 6, 5, 3, 4, 2, 1, 7],
  'F': [1, 5, 2, 3, 0, 4, 6, 7], "F'": [4, 0, 2, 3, 5, 1, 6, 7], 'F2': [5, 4, 2, 3, 1, 0, 6, 7],
  'B': [0, 1, 3, 7, 4, 5, 2, 6], "B'": [0, 1, 6, 2, 4, 5, 7, 3], 'B2': [0, 1, 7, 6, 4, 5, 3, 2],
};
// CORNER_DELTA indexed by SOURCE position (piece at src gets delta[src])
// From user's Python: delta = orientation_change[(i-1) % len] for piece at cycle[i]
const CORNER_DELTA = {
  'U': [0,0,0,0,0,0,0,0], "U'": [0,0,0,0,0,0,0,0], 'U2': [0,0,0,0,0,0,0,0],
  'D': [0,0,0,0,0,0,0,0], "D'": [0,0,0,0,0,0,0,0], 'D2': [0,0,0,0,0,0,0,0],
  'R': [1,0,0,2,2,0,0,1], "R'": [1,0,0,2,2,0,0,1], 'R2': [0,0,0,0,0,0,0,0],
  'L': [0,2,1,0,0,1,2,0], "L'": [0,2,1,0,0,1,2,0], 'L2': [0,0,0,0,0,0,0,0],
  'F': [2,1,0,0,1,2,0,0], "F'": [2,1,0,0,1,2,0,0], 'F2': [0,0,0,0,0,0,0,0],
  'B': [0,0,2,1,0,0,1,2], "B'": [0,0,2,1,0,0,1,2], 'B2': [0,0,0,0,0,0,0,0],
};
// Edge position tracking: E-edges are FR(8), FL(9), BL(10), BR(11) in solved state
// After moves, track where they are. E-layer positions are 8,9,10,11.
function applyCornerCO(co, move) {
  const perm = CORNER_PERM[move];
  const delta = CORNER_DELTA[move];
  const result = new Array(8);
  for (let i = 0; i < 8; i++) {
    const src = perm[i];
    result[i] = (co[src] + delta[src]) % 3; // delta indexed by SOURCE
  }
  return result;
}
function applyEdgePos(epos, move) {
  const perm = PERM[move];
  const result = new Array(12);
  for (let i = 0; i < 12; i++) {
    result[i] = epos[perm[i]];
  }
  return result;
}
function countBadCorners(co) {
  let c = 0;
  for (let i = 0; i < 8; i++) if (co[i] !== 0) c++;
  return c;
}
function countBadEEdges(epos) {
  // E-edges are pieces 8,9,10,11 (FR,FL,BL,BR in solved). Count those NOT in E-layer positions (8,9,10,11).
  let c = 0;
  for (let pos = 0; pos < 12; pos++) {
    const piece = epos[pos];
    if (piece >= 8 && piece <= 11) {
      if (pos < 8) c++; // E-edge in U/D layer = bad
    }
  }
  return c;
}
// Multi-axis CO: track piece + orientation, check letter on axis face
const PIECE_CYCLE = [
  ['U','F','R'], ['U','L','F'], ['U','B','L'], ['U','R','B'],
  ['D','R','F'], ['D','F','L'], ['D','L','B'], ['D','B','R'],
];
const FACE_CYCLE = [
  ['U','F','R'], ['U','L','F'], ['U','B','L'], ['U','R','B'],
  ['D','R','F'], ['D','F','L'], ['D','L','B'], ['D','B','R'],
];
function getColorOnFace(piece, pos, udOrient, targetFace) {
  const faces = FACE_CYCLE[pos];
  const faceIdx = faces.indexOf(targetFace);
  if (faceIdx === -1) return null;
  const colors = PIECE_CYCLE[piece];
  const colorIdx = (faceIdx - udOrient + 3) % 3;
  return colors[colorIdx];
}
function isBadForAxis(piece, pos, udOrient, axis) {
  const faces = FACE_CYCLE[pos];
  const axisFaces = axis === 'UD' ? ['U','D'] : axis === 'FB' ? ['F','B'] : ['R','L'];
  let axisFace = null;
  for (const f of faces) { if (axisFaces.includes(f)) { axisFace = f; break; } }
  if (!axisFace) return false;
  const color = getColorOnFace(piece, pos, udOrient, axisFace);
  return !axisFaces.includes(color);
}
function applyCornerPieces(pieces, orients, move) {
  const perm = CORNER_PERM[move];
  const delta = CORNER_DELTA[move];
  const np = new Array(8), no = new Array(8);
  for (let i = 0; i < 8; i++) {
    const src = perm[i];
    np[i] = pieces[src];
    no[i] = (orients[src] + delta[src]) % 3;
  }
  return [np, no];
}
function countBadForAxis(pieces, orients, axis) {
  let c = 0;
  for (let pos = 0; pos < 8; pos++) {
    if (isBadForAxis(pieces[pos], pos, orients[pos], axis)) c++;
  }
  return c;
}
function getRZPStateFull(scramble, axis) {
  let eo = 0;
  let pieces = [0,1,2,3,4,5,6,7];
  let orients = [0,0,0,0,0,0,0,0];
  let epos = [0,1,2,3,4,5,6,7,8,9,10,11];
  for (const m of scramble.trim().split(/\s+/)) {
    if (!PERM[m]) continue;
    eo = applyMoveEO(eo, m, axis);
    [pieces, orients] = applyCornerPieces(pieces, orients, m);
    epos = applyEdgePos(epos, m);
  }
  const badE = countBadEEdges(epos);
  // For RZP, consider the two non-main axes
  const nonMain = axis === 'UD' ? ['FB','RL'] : axis === 'FB' ? ['UD','RL'] : ['UD','FB'];
  let best = null;
  for (const ax of nonMain) {
    const badC = countBadForAxis(pieces, orients, ax);
    const caseStr = badC + 'c' + badE + 'e';
    if (!best || (isRZP({badCorners: badC, badEdges: badE}) && !isRZP(best))) {
      best = { badCorners: badC, badEdges: badE, case: caseStr, axis: ax, eo, pieces, orients, epos };
    }
  }
  // Fallback to UD if no RZP found
  if (!best) {
    const badC = countBadForAxis(pieces, orients, 'UD');
    best = { badCorners: badC, badEdges: badE, case: badC + 'c' + badE + 'e', axis: 'UD', eo, pieces, orients, epos };
  }
  return best;
}
function isRZP(state) {
  return (state.badCorners === 4 && state.badEdges === 2) ||
         (state.badCorners === 3 && state.badEdges === 1) ||
         (state.badCorners === 4 && state.badEdges === 1);
}
function getTriggerForCase(caseStr) {
  if (caseStr === '4c2e') return 'R';
  if (caseStr === '3c1e') return "R U' R' / R U R'";
  if (caseStr === '4c1e') return 'R U2 R\'';
  return null;
}
function findRZPSetups(scramble, axis, maxDepth) {
  if (typeof axis === 'number') { maxDepth = axis; axis = 'UD'; }
  axis = axis || 'UD';
  maxDepth = maxDepth || 3;
  const nonMain = axis === 'UD' ? ['FB','RL'] : axis === 'FB' ? ['UD','RL'] : ['UD','FB'];
  const start = getRZPStateFull(scramble, axis);
  for (const ax of nonMain) {
    const badC = countBadForAxis(start.pieces, start.orients, ax);
    const badE = countBadEEdges(start.epos);
    if (isRZP({badCorners: badC, badEdges: badE})) {
      return [{ setup: '', case: badC + 'c' + badE + 'e', trigger: getTriggerForCase(badC + 'c' + badE + 'e'), axis: ax }];
    }
  }
  const results = [];
  const queue = [{ eo: start.eo, pieces: start.pieces, orients: start.orients, epos: start.epos, path: [] }];
  const seen = new Set();
  seen.add(start.eo + '|' + start.pieces.join(',') + '|' + start.orients.join('') + '|' + start.epos.join(','));
  while (queue.length) {
    const cur = queue.shift();
    if (cur.path.length >= maxDepth) continue;
    for (const m of Object.keys(PERM)) {
      if (cur.path.length && m[0] === cur.path[cur.path.length-1][0]) continue;
      const neo = applyMoveEO(cur.eo, m, axis);
      const [npieces, norients] = applyCornerPieces(cur.pieces, cur.orients, m);
      const nepos = applyEdgePos(cur.epos, m);
      const key = neo + '|' + npieces.join(',') + '|' + norients.join('') + '|' + nepos.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      const npath = [...cur.path, m];
      const badE = countBadEEdges(nepos);
      for (const ax of nonMain) {
        const badC = countBadForAxis(npieces, norients, ax);
        if (isRZP({badCorners: badC, badEdges: badE})) {
          results.push({ setup: npath.join(' '), case: badC + 'c' + badE + 'e', trigger: getTriggerForCase(badC + 'c' + badE + 'e'), axis: ax });
          if (results.length >= 10) return results;
        }
      }
      if (npath.length < maxDepth) {
        queue.push({ eo: neo, pieces: npieces, orients: norients, epos: nepos, path: npath });
      }
    }
  }
  return results;
}


// Override stub RZP functions
function getRZPState(scramble, axis) {
  const s = getRZPStateFull(scramble, axis || 'UD');
  return { badCorners: s.badCorners, badEdges: s.badEdges, case: s.case };
}
function findRZPSetup(scramble, axis, maxDepth) {
  if (typeof axis === 'number') { maxDepth = axis; axis = 'UD'; }
  const r = findRZPSetups(scramble, axis || 'UD', maxDepth || 3);
  return r.length ? r[0] : null;
}
function findAllRZPSetups(scramble, axis, maxDepth) {
  if (typeof axis === 'number') { maxDepth = axis; axis = 'UD'; }
  return findRZPSetups(scramble, axis || 'UD', maxDepth || 3);
}
