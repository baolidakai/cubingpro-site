/**
 * EO Solver v2 - Clean implementation.
 * Model: 12 edges, each with orientation 0/1.
 * A move permutes edges and flips a subset.
 */

// Edge positions: 0=UR, 1=UF, 2=UL, 3=UB, 4=DR, 5=DF, 6=DL, 7=DB, 8=FR, 9=FL, 10=BL, 11=BR

// EO axes: which moves flip edges
// UD axis: F,B,R,L flip (standard)
// FB axis: U,D,R,L flip
// RL axis: U,D,F,B flip
const AXES = {
  'UD': {
    'F': [1,5,8,9], 'B': [3,7,10,11], 'R': [0,4,8,11], 'L': [2,6,9,10],
  },
  'FB': {
    'U': [0,1,2,3], 'D': [4,5,6,7], 'R': [0,4,8,11], 'L': [2,6,9,10],
  },
  'RL': {
    'U': [0,1,2,3], 'D': [4,5,6,7], 'F': [1,5,8,9], 'B': [3,7,10,11],
  }
};

// For each move: [permutation, flipped positions]
// permutation[i] = where edge at position i goes to
// flipped = set of positions (after move) where edge is flipped
const MOVES = {
  'U':  { perm: [1,2,3,0, 4,5,6,7, 8,9,10,11], flip: [] },
  'U\'': { perm: [3,0,1,2, 4,5,6,7, 8,9,10,11], flip: [] },
  'U2': { perm: [2,3,0,1, 4,5,6,7, 8,9,10,11], flip: [] },
  'D':  { perm: [0,1,2,3, 5,6,7,4, 8,9,10,11], flip: [] },
  'D\'': { perm: [0,1,2,3, 7,4,5,6, 8,9,10,11], flip: [] },
  'D2': { perm: [0,1,2,3, 6,7,4,5, 8,9,10,11], flip: [] },
  'F':  { perm: [0,8,2,3, 4,9,6,7, 5,1,10,11], flip: [1,5,8,9] },
  'F\'': { perm: [0,9,2,3, 4,8,6,7, 1,5,10,11], flip: [1,5,8,9] },
  'F2': { perm: [0,5,2,3, 4,1,6,7, 9,8,10,11], flip: [] },
  'B':  { perm: [0,1,11,3, 4,5,10,7, 8,9,6,2], flip: [2,3,10,11] }, // Wait, need correct
  'B\'': { perm: [0,1,10,3, 4,5,11,7, 8,9,2,6], flip: [2,3,10,11] },
  'B2': { perm: [0,1,6,3, 4,5,2,7, 8,9,10,11], flip: [] },
  'R':  { perm: [8,1,2,3, 11,5,6,7, 4,9,10,0], flip: [0,4,8,11] },
  'R\'': { perm: [11,1,2,3, 8,5,6,7, 0,9,10,4], flip: [0,4,8,11] },
  'R2': { perm: [4,1,2,3, 0,5,6,7, 11,9,10,8], flip: [] },
  'L':  { perm: [0,1,10,3, 4,5,9,7, 8,6,2,11], flip: [2,6,9,10] },
  'L\'': { perm: [0,1,9,3, 4,5,10,7, 8,2,6,11], flip: [2,6,9,10] },
  'L2': { perm: [0,1,6,3, 4,5,2,7, 8,10,9,11], flip: [] },
};

// Note: B perm above is wrong, fixing:
// B: UB(3)->BL(10)->DB(7)->BR(11)->UB(3)? No.
// Standard B: UB->BR->DB->BL->UB, and UBR->... let me use a reference.
// Actually, let me define by cycles:
// B: (3 11 7 10) for positions, meaning 3->11, 11->7, 7->10, 10->3
// So perm[3]=11, perm[11]=7, perm[7]=10, perm[10]=3
// B': reverse: perm[3]=10, perm[10]=7, perm[7]=11, perm[11]=3
// B2: perm[3]=7, perm[7]=3, perm[10]=11, perm[11]=10

MOVES['B'].perm = [0,1,2,11, 4,5,6,10, 8,9,3,7];
MOVES['B\''].perm = [0,1,2,10, 4,5,6,11, 8,9,7,3];
// B2 is correct above

const MOVE_LIST = Object.keys(MOVES);

// Get flip set for a move on a specific axis
function getFlip(move, axis='UD') {
  const base = move[0]; // F, B, R, L, U, D
  const ax = AXES[axis];
  if (ax[base]) return ax[base];
  return []; // U/D on UD axis don't flip, etc.
}

// Random scramble generator: 20 moves, no consecutive same face
function randomScramble(length=20) {
  const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
  const suffixes = ['', "'", '2'];
  let result = [];
  let lastFace = '';
  for (let i = 0; i < length; i++) {
    let face;
    do {
      face = faces[Math.floor(Math.random() * 6)];
    } while (face === lastFace);
    lastFace = face;
    const suf = suffixes[Math.floor(Math.random() * 3)];
    result.push(face + suf);
  }
  return result.join(' ');
}

function applyMove(eo, move, axis='UD') {
  // eo: array of 12 (0/1) OR 12-bit int. Let's use array for clarity.
  // Convert to array if int
  let arr;
  if (typeof eo === 'number') {
    arr = [];
    for (let i = 0; i < 12; i++) arr.push((eo >> i) & 1);
  } else {
    arr = eo.slice();
  }
  const { perm } = MOVES[move];
  const flip = getFlip(move, axis);
  const result = new Array(12);
  for (let i = 0; i < 12; i++) {
    // Edge at position i goes to perm[i]
    // So edge at new position j came from old position i where perm[i]=j
    // Easier: for each new position j, find i such that perm[i]=j
    // Actually perm[i] = destination of edge i. So new[j] = old[i] where perm[i]=j.
    // Let's invert: build invPerm
  }
  // Build inverse permutation
  const inv = new Array(12);
  for (let i = 0; i < 12; i++) inv[perm[i]] = i;

  for (let j = 0; j < 12; j++) {
    const i = inv[j]; // edge comes from position i
    let bit = arr[i];
    if (flip.includes(j)) bit ^= 1; // flip if destination is in flip set
    result[j] = bit;
  }
  return result;
}

function arrToInt(arr) {
  let n = 0;
  for (let i = 0; i < 12; i++) if (arr[i]) n |= (1 << i);
  return n;
}

function eoFromScramble(scramble, axis='UD') {
  let eo = new Array(12).fill(0);
  const moves = scramble.trim().split(/\s+/).filter(m => m);
  for (const m of moves) {
    if (MOVES[m]) eo = applyMove(eo, m, axis);
  }
  return arrToInt(eo);
}

// Test
if (typeof module !== 'undefined') {
  // F should flip 4 edges
  let eo = eoFromScramble('F');
  console.log('F:', eo.toString(2), '(expect 4 bits)');
  // F F' should be solved
  eo = eoFromScramble("F F'");
  console.log("F F':", eo, eo === 0 ? 'OK' : 'FAIL');
  // R' U' F
  eo = eoFromScramble("R' U' F");
  console.log("R' U' F:", eo);
  module.exports = { eoFromScramble, applyMove, arrToInt, MOVES, MOVE_LIST };
}

// BFS distance table (cached per axis)
let _distCache = {};
function getDist(axis='UD') {
  if (_distCache[axis]) return _distCache[axis];
  const _dist = new Int8Array(2048).fill(-1);
  _dist[0] = 0;
  const queue = [0];
  function intToArr(n) { const a=[]; for(let i=0;i<12;i++) a.push((n>>i)&1); return a; }
  while (queue.length) {
    const cur = queue.shift();
    const d = _dist[cur];
    const arr = intToArr(cur);
    for (const m of MOVE_LIST) {
      const nxt = arrToInt(applyMove(arr, m, axis)) & 0x7FF;
      if (_dist[nxt] === -1) { _dist[nxt] = d+1; queue.push(nxt); }
    }
  }
  _distCache[axis] = _dist;
  return _dist;
}

function solveEO(scramble, maxExtra=2, axis='UD') {
  const start = eoFromScramble(scramble, axis); // full 12-bit
  const dist = getDist(axis);
  const opt = dist[start & 0x7FF];
  if (opt < 0) return [];
  const sols = [];
  function intToArr(n) { const a=[]; for(let i=0;i<12;i++) a.push((n>>i)&1); return a; }
  function dfs(state, depth, maxD, path) {
    // state is 12-bit, mask only for table lookup and solved check
    if (depth === maxD) {
      if ((state & 0xFFF) === 0) sols.push({moves: path.join(' '), length: path.length});
      return;
    }
    if (dist[state & 0x7FF] > maxD - depth) return;
    for (const m of MOVE_LIST) {
      if (path.length && m[0] === path[path.length-1][0]) continue;
      const nxt = arrToInt(applyMove(intToArr(state), m, axis)); // keep 12-bit
      path.push(m);
      dfs(nxt, depth+1, maxD, path);
      path.pop();
      if (sols.length >= 50) return;
    }
  }
  for (let d = opt; d <= opt + maxExtra; d++) dfs(start, 0, d, []);
  return sols.sort((a,b) => a.length - b.length);
}

if (typeof module !== 'undefined') { module.exports.solveEO = solveEO; module.exports.randomScramble = randomScramble; }
if (typeof window !== 'undefined') window.EOSolver2 = { solveEO, eoFromScramble, randomScramble };

// === Corner orientation tracking for RZP ===
// Corners: 0=URF, 1=UFL, 2=ULB, 3=UBR, 4=DFR, 5=DLF, 6=DBL, 7=DRB
// Each corner has orientation 0,1,2 (0 = oriented)

// Corner permutation for each move (where corner i goes)
const CORNER_PERM = {
  'U':  [3,0,1,2, 4,5,6,7],
  'U\'': [1,2,3,0, 4,5,6,7],
  'U2': [2,3,0,1, 4,5,6,7],
  'D':  [0,1,2,3, 7,4,5,6],
  'D\'': [0,1,2,3, 5,6,7,4],
  'D2': [0,1,2,3, 6,7,4,5],
  'F':  [4,0,2,3, 5,1,6,7],
  'F\'': [1,5,2,3, 0,4,6,7],
  'F2': [5,4,2,3, 1,0,6,7],
  'B':  [0,1,6,2, 4,5,7,3],
  'B\'': [0,1,3,7, 4,5,2,6],
  'B2': [0,1,7,6, 4,5,3,2],
  'R':  [3,1,2,7, 0,5,6,4],
  'R\'': [4,1,2,0, 7,5,6,3],
  'R2': [7,1,2,4, 3,5,6,0],
  'L':  [0,5,1,3, 4,6,2,7],
  'L\'': [0,2,6,3, 4,1,5,7],
  'L2': [0,6,5,3, 4,2,1,7],
};

// Corner orientation changes: for each move, which corners get twisted and by how much
// Format: {move: [[corner_position, twist], ...]} where twist is 1 or 2 (mod 3)
// This is the orientation delta for the corner that MOVES TO that position
const CORNER_TWIST = {
  'U': [], 'U\'': [], 'U2': [], 'D': [], 'D\'': [], 'D2': [],
  'F': [[0,1],[1,2],[4,2],[5,1]],
  'F\'': [[0,2],[1,1],[4,1],[5,2]],
  'F2': [],
  'B': [[2,1],[3,2],[6,2],[7,1]],
  'B\'': [[2,2],[3,1],[6,1],[7,2]],
  'B2': [],
  'R': [[0,2],[3,1],[4,1],[7,2]],
  'R\'': [[0,1],[3,2],[4,2],[7,1]],
  'R2': [],
  'L': [[1,1],[2,2],[5,2],[6,1]],
  'L\'': [[1,2],[2,1],[5,1],[6,2]],
  'L2': [],
};

function applyCorner(co, move) {
  // co: array of 8 (0,1,2)
  const perm = CORNER_PERM[move];
  const twist = CORNER_TWIST[move] || [];
  const twistMap = {};
  for (const [pos, t] of twist) twistMap[pos] = t;
  
  const inv = new Array(8);
  for (let i = 0; i < 8; i++) inv[perm[i]] = i;
  
  const result = new Array(8);
  for (let j = 0; j < 8; j++) {
    const i = inv[j];
    let o = co[i];
    if (twistMap[j]) o = (o + twistMap[j]) % 3;
    result[j] = o;
  }
  return result;
}

// E-layer edges: positions 8=FR, 9=FL, 10=BL, 11=BR are E-layer in solved state
// After moves, track where the 4 E-edges are
// E-edges are the ones that started at positions 8,9,10,11
function applyEdgePos(epos, move) {
  // epos: array of 12, epos[i] = which edge is at position i (0-11)
  // We track the 4 E-edges (originally at 8,9,10,11)
  const perm = MOVES[move].perm; // perm[i] = destination of edge i
  const inv = new Array(12);
  for (let i = 0; i < 12; i++) inv[perm[i]] = i;
  const result = new Array(12);
  for (let j = 0; j < 12; j++) result[j] = epos[inv[j]];
  return result;
}

function countBadCorners(co) {
  // A corner is "bad" for DR if orientation != 0
  // (In DR context, we care about corners that need orientation)
  let count = 0;
  for (let i = 0; i < 8; i++) if (co[i] !== 0) count++;
  return count;
}

function countBadEEdges(epos) {
  // E-edges are 8,9,10,11 (by identity). Count how many are NOT in E-layer positions (8,9,10,11)
  const eLayerPos = [8, 9, 10, 11];
  let count = 0;
  for (let pos = 0; pos < 12; pos++) {
    const edge = epos[pos];
    const isEEdge = edge >= 8 && edge <= 11;
    const inELayer = eLayerPos.includes(pos);
    if (isEEdge && !inELayer) count++;
  }
  return count;
}

function getRZPState(scramble) {
  // Returns {badCorners, badEdges, case} for RZP classification
  let co = [0,0,0,0,0,0,0,0];
  let epos = [0,1,2,3,4,5,6,7,8,9,10,11];
  let eo = new Array(12).fill(0);
  
  const moves = scramble.trim().split(/\s+/).filter(m => m);
  for (const m of moves) {
    if (!MOVES[m]) continue;
    co = applyCorner(co, m);
    epos = applyEdgePos(epos, m);
    eo = applyMove(eo, m, 'UD');
  }
  
  const bc = countBadCorners(co);
  const be = countBadEEdges(epos);
  return { badCorners: bc, badEdges: be, case: `${bc}c${be}e` };
}

if (typeof window !== 'undefined') {
  window.EOSolver2.getRZPState = getRZPState;
}
if (typeof module !== 'undefined') {
  module.exports.getRZPState = getRZPState;
}

// === RZP Setup Search: find 0-3 moves to reach an RZP case ===
const RZP_GOOD_CASES = ['4c2e', '3c1e', '4c1e', '4c4e', '3c2e'];

function findRZPSetup(scramble, maxDepth = 3) {
  // BFS for setup moves to reach a good RZP case
  // Returns {setup, case, trigger} or null
  const DR_MOVES = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F2', 'B2'];
  const TRIGGER_FOR_CASE = {
    '4c2e': 'R',
    '3c1e': "R U' R' or R U R'",
    '4c1e': 'R U2 R\'',
    '4c4e': 'R (or setup further)',
    '3c2e': 'setup further',
  };
  
  // Check depth 0
  let state = getRZPState(scramble);
  if (RZP_GOOD_CASES.includes(state.case)) {
    return { setup: '', case: state.case, trigger: TRIGGER_FOR_CASE[state.case] };
  }
  
  // BFS
  let queue = [{ moves: [], scramble: scramble }];
  let visited = new Set([scramble]);
  
  for (let depth = 1; depth <= maxDepth; depth++) {
    let nextQueue = [];
    for (const node of queue) {
      for (const m of DR_MOVES) {
        // Avoid same-face consecutive
        if (node.moves.length > 0) {
          const lastFace = node.moves[node.moves.length - 1][0];
          if (m[0] === lastFace) continue;
        }
        const newScramble = (node.scramble + ' ' + m).trim();
        if (visited.has(newScramble)) continue;
        visited.add(newScramble);
        
        const s = getRZPState(newScramble);
        if (RZP_GOOD_CASES.includes(s.case)) {
          return {
            setup: [...node.moves, m].join(' '),
            case: s.case,
            trigger: TRIGGER_FOR_CASE[s.case],
          };
        }
        if (depth < maxDepth) {
          nextQueue.push({ moves: [...node.moves, m], scramble: newScramble });
        }
      }
    }
    queue = nextQueue;
    if (queue.length === 0) break;
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.EOSolver2.findRZPSetup = findRZPSetup;
}
if (typeof module !== 'undefined') {
  module.exports.findRZPSetup = findRZPSetup;
}

// === Find ALL RZP setups within 0-3 moves ===
function findAllRZPSetups(scramble, maxDepth = 3) {
  const DR_MOVES = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F2', 'B2'];
  const TRIGGER_FOR_CASE = {
    '4c2e': 'R',
    '3c1e': "R U' R' / R U R'",
    '4c1e': 'R U2 R\'',
    '4c4e': 'R (or setup further)',
    '3c2e': 'setup further',
  };
  const results = [];
  
  // Depth 0
  let state = getRZPState(scramble);
  if (RZP_GOOD_CASES.includes(state.case)) {
    results.push({ setup: '', case: state.case, trigger: TRIGGER_FOR_CASE[state.case] });
  }
  
  // BFS, collect all at each depth
  let queue = [{ moves: [], scramble: scramble }];
  let visited = new Set([scramble]);
  
  for (let depth = 1; depth <= maxDepth; depth++) {
    let nextQueue = [];
    for (const node of queue) {
      for (const m of DR_MOVES) {
        if (node.moves.length > 0) {
          const lastFace = node.moves[node.moves.length - 1][0];
          if (m[0] === lastFace) continue;
        }
        const newScramble = (node.scramble + ' ' + m).trim();
        if (visited.has(newScramble)) continue;
        visited.add(newScramble);
        
        const s = getRZPState(newScramble);
        if (RZP_GOOD_CASES.includes(s.case)) {
          results.push({
            setup: [...node.moves, m].join(' '),
            case: s.case,
            trigger: TRIGGER_FOR_CASE[s.case],
          });
        }
        if (depth < maxDepth) {
          nextQueue.push({ moves: [...node.moves, m], scramble: newScramble });
        }
      }
    }
    queue = nextQueue;
    if (queue.length === 0) break;
    // Limit results to avoid explosion
    if (results.length >= 10) break;
  }
  return results;
}

if (typeof window !== 'undefined') {
  window.EOSolver2.findAllRZPSetups = findAllRZPSetups;
}
if (typeof module !== 'undefined') {
  module.exports.findAllRZPSetups = findAllRZPSetups;
}

// === Get EO state (0 = solved) for validation ===
function getEOState(scramble, axis = 'UD') {
  let eo = new Array(12).fill(0);
  const moves = scramble.trim().split(/\s+/).filter(m => m);
  for (const m of moves) {
    if (!MOVES[m]) continue;
    eo = applyMove(eo, m, axis);
  }
  // Count bad edges
  let bad = 0;
  for (let i = 0; i < 12; i++) if (eo[i] !== 0) bad++;
  return bad;
}

if (typeof window !== 'undefined') {
  window.EOSolver2.getEOState = getEOState;
}
if (typeof module !== 'undefined') {
  module.exports.getEOState = getEOState;
}
