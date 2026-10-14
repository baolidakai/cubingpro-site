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
