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
  
// RZP Continuation: find path to pure trigger case using restricted moves
// Main axis: HT only. Secondary axis: QT + HT. Remaining axis: HT only.
// For EOUD + RZP on RL: main=UD (U2,D2), secondary=RL (R,R',R2,L,L',L2), remaining=FB (F2,B2)
// For EOUD + RZP on FB: main=UD (U2,D2), secondary=FB (F,F',F2,B,B',B2), remaining=RL (R2,L2)

// RZP Categories: EO axis x setup axis x trigger axis
// Setup: setup axis can QT, others only HT (to preserve XCYE)
// Trigger: trigger axis moves (RZP CO counted for trigger axis)
// Example: EOFB + U' setup + R trigger = EO=FB, setup=UD, trigger=RL
const RZP_CATEGORIES = {
  'UD-FB-RL': { eo: 'UD', setup: 'FB', trigger: 'RL' },
  'UD-RL-FB': { eo: 'UD', setup: 'RL', trigger: 'FB' },
  'FB-UD-RL': { eo: 'FB', setup: 'UD', trigger: 'RL' },
  'FB-RL-UD': { eo: 'FB', setup: 'RL', trigger: 'UD' },
  'RL-UD-FB': { eo: 'RL', setup: 'UD', trigger: 'FB' },
  'RL-FB-UD': { eo: 'RL', setup: 'FB', trigger: 'UD' },
};

function getCategoryMoves(eoAxis, setupAxis, triggerAxis) {
  // Category key: EO-Setup-Trigger
  const key = eoAxis + '-' + setupAxis + '-' + triggerAxis;
  const cat = RZP_CATEGORIES[key];
  if (!cat) return null;
  // Setup moves: setup axis QT+HT, others HT only
  const ht = { 'UD': ['U2','D2'], 'FB': ['F2','B2'], 'RL': ['R2','L2'] };
  const qt = { 'UD': ['U',"U'",'U2','D',"D'",'D2'], 'FB': ['F',"F'",'F2','B',"B'",'B2'], 'RL': ['R',"R'",'R2','L',"L'",'L2'] };
  return [...qt[cat.setup], ...ht[cat.eo], ...ht[cat.trigger]];
}

function getTriggersForCategory(eoAxis, setupAxis, triggerAxis, caseStr) {
  const key = eoAxis + '-' + setupAxis + '-' + triggerAxis;
  const cat = RZP_CATEGORIES[key];
  if (!cat) return [];
  const movesFor = (ax) => ax === 'UD' ? ['U',"U'",'D',"D'"] : ax === 'FB' ? ['F',"F'",'B',"B'"] : ['R',"R'",'L',"L'"];
  const setupMoves = movesFor(cat.setup);
  const triggerMoves = movesFor(cat.trigger);
  const setup2 = cat.setup === 'UD' ? ['U2','D2'] : cat.setup === 'FB' ? ['F2','B2'] : ['R2','L2'];
  const triggers = [];
  const inv = (m) => m.endsWith("'") ? m[0] : m + "'";
  if (caseStr === '4c2e') {
    for (const t of triggerMoves) triggers.push(t);
  } else if (caseStr === '3c1e') {
    for (const t1 of triggerMoves) {
      for (const s of setupMoves) {
        triggers.push(t1 + ' ' + s + ' ' + inv(t1));
      }
    }
  } else if (caseStr === '4c1e') {
    for (const t1 of triggerMoves) {
      for (const s2 of setup2) {
        triggers.push(t1 + ' ' + s2 + ' ' + t1);
      }
    }
    for (const s1 of setupMoves) {
      for (const t of triggerMoves) {
        triggers.push(s1 + ' ' + t + ' ' + inv(s1));
      }
    }
  }
  return triggers;
}


function getContinuationMoves(mainAxis, secondaryAxis) {
  const ht = { 'UD': ['U2','D2'], 'FB': ['F2','B2'], 'RL': ['R2','L2'] };
  const qt = { 'UD': ['U',"U'",'U2','D',"D'",'D2'], 'FB': ['F',"F'",'F2','B',"B'",'B2'], 'RL': ['R',"R'",'R2','L',"L'",'L2'] };
  const axes = ['UD','FB','RL'];
  const remaining = axes.find(a => a !== mainAxis && a !== secondaryAxis);
  return [...ht[mainAxis], ...qt[secondaryAxis], ...ht[remaining]];
}

function findRZPContinuation(scramble, eoAxis, rzpAxis, maxDepth) {
  // Find continuation from current state to a pure trigger case
  // Pure trigger cases: 4c2e -> R, 3c1e -> R U R, 4c1e -> R U2 R
  const start = getRZPStateFull(scramble, eoAxis);
  const moves = getContinuationMoves(eoAxis, rzpAxis);
  const results = [];
  const queue = [{ pieces: start.pieces, orients: start.orients, epos: start.epos, path: [] }];
  const seen = new Set();
  seen.add(start.pieces.join(',') + '|' + start.orients.join('') + '|' + start.epos.join(','));
  while (queue.length) {
    const cur = queue.shift();
    if (cur.path.length >= (maxDepth || 4)) continue;
    for (const m of moves) {
      if (cur.path.length && m[0] === cur.path[cur.path.length-1][0]) continue;
      const [npieces, norients] = applyCornerPieces(cur.pieces, cur.orients, m);
      const nepos = applyEdgePos(cur.epos, m);
      const key = npieces.join(',') + '|' + norients.join('') + '|' + nepos.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      const npath = [...cur.path, m];
      const badC = countBadForAxis(npieces, norients, triggerAxis);
      const badE = countBadEEdges(nepos);
      const caseStr = badC + 'c' + badE + 'e';
      let trigger = null;
      if (caseStr === '4c2e') trigger = 'R';
      else if (caseStr === '3c1e') trigger = 'R U R';
      else if (caseStr === '4c1e') trigger = 'R U2 R';
      if (trigger) {
        results.push({ continuation: npath.join(' '), case: caseStr, trigger, axis: rzpAxis });
        if (results.length >= 5) return results;
      }
      if (npath.length < (maxDepth || 4)) {
        queue.push({ pieces: npieces, orients: norients, epos: nepos, path: npath });
      }
    }
  }
  return results;
}


// Check if state is DR: CO=0 (for EO axis), EO=0, E-edges in E-layer
function isDRState(pieces, orients, epos, eoAxis, eoValue) {
  if (eoValue !== 0) return false;
  // CO for EO axis must be 0
  const badC = countBadForAxis(pieces, orients, eoAxis);
  if (badC !== 0) return false;
  // E-edges in E-layer
  const badE = countBadEEdges(epos);
  if (badE !== 0) return false;
  return true;
}

// Find RZP solutions: EO-preserving moves to XCYE, then category setup + trigger, verified to DR
function findRZPVerified(scramble, eoAxis, setupAxis, triggerAxis, maxDepth) {
  // If only 3 args, try all categories for EO axis
  if (typeof setupAxis === 'number') { maxDepth = setupAxis; setupAxis = null; }
  if (!setupAxis) {
    const cats = Object.keys(RZP_CATEGORIES).filter(k => k.startsWith(eoAxis + '-'));
    for (const k of cats) {
      const parts = k.split('-');
      const res = findRZPVerified(scramble, eoAxis, parts[1], parts[2], maxDepth);
      if (res.length) return res;
    }
    return [];
  }
  const cat = RZP_CATEGORIES[eoAxis + '-' + setupAxis + '-' + triggerAxis];
  if (!cat) return [];
  const catMoves = getCategoryMoves(eoAxis, setupAxis, triggerAxis);
  const start = getRZPStateFull(scramble, eoAxis);
  const results = [];
  // Phase 1: BFS with category moves (setup QT+HT, EO HT, trigger HT) to XCYE
  // Category rule: only setup axis does QT, others HT only (preserves XCYE shape)
  const queue = [{ pieces: start.pieces, orients: start.orients, epos: start.epos, eo: start.eo, path: [] }];
  const seen = new Set();
  seen.add(start.pieces.join(',') + '|' + start.orients.join('') + '|' + start.epos.join(',') + '|' + start.eo);
  const maxStates = 20000; // Performance cap
  const p1Depth = Math.min(maxDepth || 6, 5);
  let phase2Count = 0;
  const maxPhase2 = 30; // Limit Phase 2 searches
  while (queue.length && seen.size < maxStates && phase2Count < maxPhase2) {
    const cur = queue.shift();
    if (cur.path.length >= p1Depth) continue;
    for (const m of catMoves) {
      if (cur.path.length && m[0] === cur.path[cur.path.length-1][0]) continue;
      const neo = applyMoveEO(cur.eo, m, eoAxis);
      const [npieces, norients] = applyCornerPieces(cur.pieces, cur.orients, m);
      const nepos = applyEdgePos(cur.epos, m);
      const key = npieces.join(',') + '|' + norients.join('') + '|' + nepos.join(',') + '|' + neo;
      if (seen.has(key)) continue;
      seen.add(key);
      const npath = [...cur.path, m];
      const badC = countBadForAxis(npieces, norients, triggerAxis);
      const badE = countBadEEdges(nepos);
      const caseStr = badC + 'c' + badE + 'e';
      if (caseStr === '4c2e' || caseStr === '3c1e' || caseStr === '4c1e') {
        phase2Count++;
        // Phase 2: BFS setup search (preserve XCYE) + trigger, verified to DR
        // From XCYE, search setup moves (category moves, must keep XCYE shape)
        // up to 4 deep, trying triggers at each state
        const triggers = getTriggersForCategory(eoAxis, setupAxis, triggerAxis, caseStr);
        const tryTriggers = (pieces, orients, epos, eo, setupPath) => {
          for (const trig of triggers) {
            let tpieces = [...pieces], torients = [...orients], tepos = [...epos], teo = eo;
            for (const tm of trig.split(' ')) {
              teo = applyMoveEO(teo, tm, eoAxis);
              [tpieces, torients] = applyCornerPieces(tpieces, torients, tm);
              tepos = applyEdgePos(tepos, tm);
            }
            if (isDRState(tpieces, torients, tepos, eoAxis, teo)) {
              return trig;
            }
          }
          return null;
        };
        // Direct trigger (0 setup moves)
        let trig = tryTriggers(npieces, norients, nepos, neo, npath);
        if (trig) {
          results.push({ setup: npath.join(' '), case: caseStr, trigger: trig, axis: triggerAxis, category: eoAxis + '-' + setupAxis + '-' + triggerAxis });
          if (results.length >= 5) return results;
        } else {
          // BFS setup: up to 3 moves, must preserve XCYE shape
          const sq = [{ pieces: npieces, orients: norients, epos: nepos, eo: neo, path: [...npath] }];
          const sseen = new Set();
          sseen.add(npieces.join(',') + '|' + norients.join('') + '|' + nepos.join(','));
          let sFound = false;
          while (sq.length && !sFound && sseen.size < 5000) {
            const cur = sq.shift();
            const setupDepth = cur.path.length - npath.length;
            if (setupDepth >= 3) continue;
            for (const sm of catMoves) {
              if (cur.path.length && sm[0] === cur.path[cur.path.length-1][0]) continue;
              let spieces = [...cur.pieces], sorients = [...cur.orients], sepos = [...cur.epos], seo = cur.eo;
              seo = applyMoveEO(seo, sm, eoAxis);
              [spieces, sorients] = applyCornerPieces(spieces, sorients, sm);
              sepos = applyEdgePos(sepos, sm);
              const sC = countBadForAxis(spieces, sorients, triggerAxis);
              const sE = countBadEEdges(sepos);
              if (sC + 'c' + sE + 'e' !== caseStr) continue; // Must preserve XCYE
              const skey = spieces.join(',') + '|' + sorients.join('') + '|' + sepos.join(',');
              if (sseen.has(skey)) continue;
              sseen.add(skey);
              const spath = [...cur.path, sm];
              trig = tryTriggers(spieces, sorients, sepos, seo, spath);
              if (trig) {
                results.push({ setup: spath.join(' '), case: caseStr, trigger: trig, axis: triggerAxis, category: eoAxis + '-' + setupAxis + '-' + triggerAxis });
                if (results.length >= 5) return results;
                sFound = true;
                break;
              }
              sq.push({ pieces: spieces, orients: sorients, epos: sepos, eo: seo, path: spath });
            }
          }
        }
      }
      if (npath.length < p1Depth) {
        queue.push({ pieces: npieces, orients: norients, epos: nepos, eo: neo, path: npath });
      }
    }
  }
  return results;
}

module.exports = { solveEO, getEOState, randomScramble, applyMoveEO, eoFromScramble, getRZPState, findRZPSetup, findAllRZPSetups, getRZPStateFull, findRZPSetups, findRZPContinuation, getContinuationMoves, findRZPVerified, getTriggersForCategory, getCategoryMoves, isDRState };
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
function getEOPreservingMoves(axis) {
  // Moves that preserve EO for the given axis (no quarter turns on the flip axis)
  // UD: U/D flip, so no U/U'/D/D'. Allowed: F,B,R,L,U2,D2
  // FB: F/B flip, so no F/F'/B/B'. Allowed: U,D,R,L,F2,B2
  // RL: R/L flip, so no R/R'/L/L'. Allowed: U,D,F,B,R2,L2
  if (axis === 'UD') return ['F', "F'", 'F2', 'B', "B'", 'B2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'U2', 'D2'];
  if (axis === 'FB') return ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F2', 'B2'];
  if (axis === 'RL') return ['U', "U'", 'U2', 'D', "D'", 'D2', 'F', "F'", 'F2', 'B', "B'", 'B2', 'R2', 'L2'];
  return Object.keys(PERM);
}

function findRZPSetups(scramble, axis, maxDepth) {
  if (typeof axis === 'number') { maxDepth = axis; axis = 'UD'; }
  axis = axis || 'UD';
  maxDepth = maxDepth || 3;
  const allowedMoves = getEOPreservingMoves(axis);
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
    for (const m of allowedMoves) {
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
