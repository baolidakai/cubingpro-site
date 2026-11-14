/* Cubing Pro timer — free online speedcubing timer.
 *
 * Scrambles are RANDOM MOVES (e.g. 20 random moves for 3x3), generated
 * in the browser. They are NOT random-state scrambles like WCA official
 * scrambles. The page says so plainly next to the scramble.
 *
 * Interaction (csTimer-style, our own layout and wording):
 *  hold SPACE (or touch and hold) -> timer turns red, then green when
 *  ready -> release to start inspection (15 s, if enabled) or the solve
 *  -> SPACE / tap to stop. ESC cancels.
 * All solves are saved in localStorage (key cubingpro-timer-solves).
 */
(function () {
  'use strict';

  /* ---------------- i18n: UI strings (8 languages) ---------------- */
  var I18N = {
    'en': {
      hold: 'Hold SPACE to start',
      tap: 'Tap and hold to start',
      release: 'Release to start',
      ready: 'Ready — release!',
      inspecting: 'Inspection',
      running: 'Solving… SPACE to stop',
      stopped: 'Tap SPACE for a new scramble',
      newScramble: 'New scramble',
      inspection: 'Inspection (15 s)',
      on: 'On', off: 'Off',
      best: 'Best', ao5: 'Ao5', ao12: 'Ao12', mean: 'Mean', solves: 'Solves',
      noSolves: 'No solves yet — hold SPACE to start your first one.',
      plus2: '+2', dnf: 'DNF', del: 'Delete',
      copy: 'Copy scramble',
      copied: 'Copied!',
      randomMovesNote: 'Random-move scramble',
      event: 'Event'
    },
    'zh-cn': {
      hold: '按住空格开始',
      tap: '按住屏幕开始',
      release: '松开开始',
      ready: '可以开始了，松开！',
      inspecting: '观察',
      running: '计时中…按空格停止',
      stopped: '按空格换下一个打乱',
      newScramble: '换个打乱',
      inspection: '观察（15 秒）',
      on: '开', off: '关',
      best: '最快', ao5: '五次平均', ao12: '十二次平均', mean: '平均', solves: '次数',
      noSolves: '还没有成绩，按住空格开始第一次。',
      plus2: '+2', dnf: 'DNF', del: '删除',
      copy: '复制打乱',
      copied: '已复制！',
      randomMovesNote: '随机步数打乱',
      event: '项目'
    },
    'zh-tw': {
      hold: '按住空白鍵開始',
      tap: '按住螢幕開始',
      release: '放開開始',
      ready: '可以開始了，放開！',
      inspecting: '觀察',
      running: '計時中…按空白鍵停止',
      stopped: '按空白鍵換下一個打亂',
      newScramble: '換個打亂',
      inspection: '觀察（15 秒）',
      on: '開', off: '關',
      best: '最快', ao5: '五次平均', ao12: '十二次平均', mean: '平均', solves: '次數',
      noSolves: '還沒有成績，按住空白鍵開始第一次。',
      plus2: '+2', dnf: 'DNF', del: '刪除',
      copy: '複製打亂',
      copied: '已複製！',
      randomMovesNote: '隨機步數打亂',
      event: '項目'
    },
    'ja': {
      hold: 'スペースを長押しでスタート',
      tap: '長押しでスタート',
      release: '離してスタート',
      ready: '準備OK、離して！',
      inspecting: 'インスペクション',
      running: '計測中…スペースでストップ',
      stopped: 'スペースで次のスクランブル',
      newScramble: '新しいスクランブル',
      inspection: 'インスペクション（15秒）',
      on: 'オン', off: 'オフ',
      best: 'ベスト', ao5: 'Ao5', ao12: 'Ao12', mean: '平均', solves: '回数',
      noSolves: 'まだ記録がありません。スペースを長押しして始めましょう。',
      plus2: '+2', dnf: 'DNF', del: '削除',
      copy: 'スクランブルをコピー',
      copied: 'コピーしました！',
      randomMovesNote: 'ランダムムーブのスクランブル',
      event: '種目'
    },
    'de': {
      hold: 'LEERTASTE halten zum Starten',
      tap: 'Gedrückt halten zum Starten',
      release: 'Loslassen zum Starten',
      ready: 'Bereit — loslassen!',
      inspecting: 'Inspektion',
      running: 'Läuft… LEERTASTE zum Stoppen',
      stopped: 'LEERTASTE für neuen Scramble',
      newScramble: 'Neuer Scramble',
      inspection: 'Inspektion (15 s)',
      on: 'An', off: 'Aus',
      best: 'Beste', ao5: 'Ao5', ao12: 'Ao12', mean: 'Mittel', solves: 'Solves',
      noSolves: 'Noch keine Solves — LEERTASTE halten für den ersten.',
      plus2: '+2', dnf: 'DNF', del: 'Löschen',
      copy: 'Scramble kopieren',
      copied: 'Kopiert!',
      randomMovesNote: 'Zufalls-Zug-Scramble',
      event: 'Event'
    },
    'fr': {
      hold: 'Maintenir ESPACE pour démarrer',
      tap: 'Maintenir appuyé pour démarrer',
      release: 'Relâcher pour démarrer',
      ready: 'Prêt — relâchez !',
      inspecting: 'Inspection',
      running: 'En cours… ESPACE pour arrêter',
      stopped: 'ESPACE pour un nouveau mélange',
      newScramble: 'Nouveau mélange',
      inspection: 'Inspection (15 s)',
      on: 'Oui', off: 'Non',
      best: 'Meilleur', ao5: 'Ao5', ao12: 'Ao12', mean: 'Moyenne', solves: 'Résolutions',
      noSolves: 'Aucune résolution — maintenez ESPACE pour commencer.',
      plus2: '+2', dnf: 'DNF', del: 'Supprimer',
      copy: 'Copier le mélange',
      copied: 'Copié !',
      randomMovesNote: 'Mélange par coups aléatoires',
      event: 'Épreuve'
    },
    'it': {
      hold: 'Tieni premuto SPAZIO per partire',
      tap: 'Tieni premuto per partire',
      release: 'Rilascia per partire',
      ready: 'Pronto — rilascia!',
      inspecting: 'Ispezione',
      running: 'In corso… SPAZIO per fermare',
      stopped: 'SPAZIO per un nuovo scramble',
      newScramble: 'Nuovo scramble',
      inspection: 'Ispezione (15 s)',
      on: 'Sì', off: 'No',
      best: 'Migliore', ao5: 'Ao5', ao12: 'Ao12', mean: 'Media', solves: 'Solve',
      noSolves: 'Ancora nessuno solve — tieni premuto SPAZIO per iniziare.',
      plus2: '+2', dnf: 'DNF', del: 'Elimina',
      copy: 'Copia lo scramble',
      copied: 'Copiato!',
      randomMovesNote: 'Scramble a mosse casuali',
      event: 'Evento'
    },
    'ko': {
      hold: '스페이스바를 눌러 시작',
      tap: '길게 눌러 시작',
      release: '놓으면 시작',
      ready: '준비 완료 — 놓으세요!',
      inspecting: '인스펙션',
      running: '측정 중… 스페이스바로 정지',
      stopped: '스페이스바로 새 스크램블',
      newScramble: '새 스크램블',
      inspection: '인스펙션 (15초)',
      on: '켬', off: '끔',
      best: '최고', ao5: 'Ao5', ao12: 'Ao12', mean: '평균', solves: '횟수',
      noSolves: '아직 기록이 없습니다. 스페이스바를 눌러 시작하세요.',
      plus2: '+2', dnf: 'DNF', del: '삭제',
      copy: '스크램블 복사',
      copied: '복사됨!',
      randomMovesNote: '랜덤 무브 스크램블',
      event: '종목'
    }
  };

  var LANGS = ['en', 'zh-cn', 'zh-tw', 'ja', 'de', 'fr', 'it', 'ko'];
  var LANG_KEY = 'cubingpro-lang';
  var STORE_KEY = 'cubingpro-timer-solves';
  var SETTINGS_KEY = 'cubingpro-timer-settings';

  var lang = 'en';
  try { lang = localStorage.getItem(LANG_KEY) || 'en'; } catch (e) {}
  if (LANGS.indexOf(lang) === -1) lang = 'en';
  function t(k) { return (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; }

  /* ---------------- scramble: RANDOM MOVES (not random-state) ---------------- */
  var EVENTS = {
    '2x2': { moves: ['R', 'U', 'F'], wide: [], n: 11 },
    '3x3': { moves: ['R', 'L', 'U', 'D', 'F', 'B'], wide: [], n: 20 },
    '4x4': { moves: ['R', 'L', 'U', 'D', 'F', 'B'], wide: ['Rw', 'Lw', 'Uw', 'Dw', 'Fw', 'Bw'], n: 40 },
    '5x5': { moves: ['R', 'L', 'U', 'D', 'F', 'B'], wide: ['Rw', 'Lw', 'Uw', 'Dw', 'Fw', 'Bw'], n: 60 }
  };
  var MODS = ['', "'", '2'];
  function randomScramble(event) {
    var cfg = EVENTS[event] || EVENTS['3x3'];
    var faces = cfg.moves.concat(cfg.wide);
    var out = [], last = '';
    while (out.length < cfg.n) {
      var f = faces[Math.floor(Math.random() * faces.length)];
      // never repeat the same face twice in a row
      if (f.replace('w', '') === last.replace('w', '')) continue;
      out.push(f + MODS[Math.floor(Math.random() * MODS.length)]);
      last = f;
    }
    return out.join(' ');
  }

  /* ---------------- state ---------------- */
  var settings = { inspection: true, event: '3x3' };
  try {
    var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (typeof s.inspection === 'boolean') settings.inspection = s.inspection;
    if (EVENTS[s.event]) settings.event = s.event;
  } catch (e) {}
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  var solves = [];
  try { solves = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { solves = []; }
  function saveSolves() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(solves)); } catch (e) {}
  }

  var state = 'idle'; // idle | arming | ready | inspecting | running
  var armTimer = null;
  var startTime = 0;
  var tickTimer = null;
  var inspectLeft = 15; // seconds remaining (can go negative: +2 / DNF)
  var inspectTimer = null;
  var currentScramble = '';
  var lastSolve = null;

  /* ---------------- dom ---------------- */
  function $(id) { return document.getElementById(id); }
  var display = $('timer'), hint = $('timer-hint'), scrambleEl = $('scramble'),
      scrambleNote = $('scramble-note'), eventSel = $('cube-selector'),
      inspToggle = $('inspection-toggle'),
      statBest = $('stat-best'), statAo5 = $('stat-ao5'), statAo12 = $('stat-ao12'),
      statMean = $('stat-mean'), statCount = $('stat-count'),
      listEl = $('solve-list'), emptyEl = $('solve-empty');

  /* ---------------- formatting / stats ---------------- */
  function fmt(ms) {
    if (ms == null) return '--';
    var s = ms / 1000;
    var m = Math.floor(s / 60);
    var sec = s - m * 60;
    if (m > 0) return m + ':' + (sec < 10 ? '0' : '') + sec.toFixed(2);
    return sec.toFixed(2);
  }
  function effMs(sv) {
    if (sv.penalty === 'DNF') return null;
    return sv.ms + (sv.penalty === '+2' ? 2000 : 0);
  }
  function averageOf(arr) {
    // WCA-style trimmed average: drop best and worst; DNF counts as worst.
    if (arr.length < 3) return null;
    var vals = arr.map(effMs);
    var dnfCount = vals.filter(function (v) { return v == null; }).length;
    if (dnfCount > 1) return 'DNF';
    var nums = vals.filter(function (v) { return v != null; }).sort(function (a, b) { return a - b; });
    if (dnfCount === 1) nums = nums.slice(1); // drop best, DNF is the worst
    else nums = nums.slice(1, -1); // drop best and worst
    if (!nums.length) return null;
    return nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
  }
  function renderStats() {
    var done = solves.filter(function (sv) { return sv.penalty !== 'DNF'; });
    var best = done.length ? Math.min.apply(null, done.map(effMs)) : null;
    var mean = done.length ? done.map(effMs).reduce(function (a, b) { return a + b; }, 0) / done.length : null;
    var ao5 = solves.length >= 5 ? averageOf(solves.slice(-5)) : null;
    var ao12 = solves.length >= 12 ? averageOf(solves.slice(-12)) : null;
    statBest.textContent = fmt(best);
    statAo5.textContent = ao5 === 'DNF' ? 'DNF' : fmt(ao5);
    statAo12.textContent = ao12 === 'DNF' ? 'DNF' : fmt(ao12);
    statMean.textContent = fmt(mean);
    statCount.textContent = String(solves.length);
  }
  function renderList() {
    listEl.innerHTML = '';
    emptyEl.style.display = solves.length ? 'none' : 'block';
    solves.slice().reverse().forEach(function (sv, ri) {
      var idx = solves.length - 1 - ri;
      var li = document.createElement('li');
      li.className = 'solve-row' + (sv.penalty === 'DNF' ? ' is-dnf' : '');
      var timeTxt = sv.penalty === 'DNF' ? 'DNF (' + fmt(sv.ms) + ')' : fmt(effMs(sv)) + (sv.penalty === '+2' ? ' +' : '');
      li.innerHTML =
        '<span class="solve-num">#' + (idx + 1) + '</span>' +
        '<span class="solve-time">' + timeTxt + '</span>' +
        '<span class="solve-scr" title="' + sv.scramble.replace(/"/g, '&quot;') + '">' + sv.scramble + '</span>' +
        '<span class="solve-actions">' +
        '<button type="button" data-act="plus2" title="+2">+2</button>' +
        '<button type="button" data-act="dnf" title="DNF">DNF</button>' +
        '<button type="button" data-act="del" title="' + t('del') + '">&times;</button>' +
        '</span>';
      li.querySelector('[data-act="plus2"]').addEventListener('click', function () {
        sv.penalty = sv.penalty === '+2' ? '' : '+2';
        saveSolves(); renderList(); renderStats();
      });
      li.querySelector('[data-act="dnf"]').addEventListener('click', function () {
        sv.penalty = sv.penalty === 'DNF' ? '' : 'DNF';
        saveSolves(); renderList(); renderStats();
      });
      li.querySelector('[data-act="del"]').addEventListener('click', function () {
        solves.splice(idx, 1);
        saveSolves(); renderList(); renderStats();
      });
      listEl.appendChild(li);
    });
  }

  /* ---------------- display helpers ---------------- */
  function setDisplay(text, cls) {
    display.textContent = text;
    display.className = cls || '';
  }
  function setHint(text) { hint.textContent = text; }
  function newScramble() {
    currentScramble = randomScramble(settings.event);
    scrambleEl.textContent = currentScramble;
  }

  /* ---------------- timer engine ---------------- */
  function stopTick() { if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } }
  function stopInspect() { if (inspectTimer) { clearInterval(inspectTimer); inspectTimer = null; } }

  function arm() {
    if (state !== 'idle' && state !== 'inspecting') return;
    state = 'arming';
    setDisplay('0.00', 'arming');
    setHint(t('hold'));
    armTimer = setTimeout(function () {
      if (state !== 'arming') return;
      state = 'ready';
      setDisplay('0.00', 'ready');
      setHint(t('ready'));
    }, 300);
  }
  function disarm() {
    if (armTimer) { clearTimeout(armTimer); armTimer = null; }
    if (state === 'arming' || state === 'ready') {
      if (inspectTimer) {
        // released too early during inspection: go back to inspecting
        state = 'inspecting';
        setHint(t('inspecting'));
      } else {
        state = 'idle';
        setDisplay('0.00', '');
        setHint(t('hold'));
      }
    }
  }
  function releaseToStart() {
    if (state === 'ready') {
      if (inspectTimer) startSolve(); // already inspecting: start the solve
      else if (settings.inspection) startInspection();
      else startSolve();
    } else if (state === 'arming') {
      disarm(); // released too early: nothing happens
    }
  }
  function startInspection() {
    state = 'inspecting';
    inspectLeft = 15;
    setDisplay('15', 'inspecting');
    setHint(t('inspecting'));
    stopInspect();
    var t0 = Date.now();
    inspectTimer = setInterval(function () {
      var el = (Date.now() - t0) / 1000;
      var left = 15 - el;
      inspectLeft = left;
      if (state === 'arming' || state === 'ready') return; // arming: leave the red/green display alone
      if (left > 0) {
        setDisplay(String(Math.ceil(left)), 'inspecting');
      } else if (left > -2) {
        setDisplay('+2', 'inspecting-warn');
      } else {
        setDisplay('DNF', 'inspecting-warn');
      }
    }, 100);
  }
  function startSolve() {
    stopInspect();
    state = 'running';
    startTime = Date.now();
    setDisplay('0.00', 'running');
    setHint(t('running'));
    stopTick();
    tickTimer = setInterval(function () {
      setDisplay(((Date.now() - startTime) / 1000).toFixed(2), 'running');
    }, 31);
  }
  function stopSolve() {
    if (state !== 'running') return;
    stopTick();
    var ms = Date.now() - startTime;
    var penalty = '';
    if (settings.inspection) {
      if (inspectLeft <= -2) penalty = 'DNF';
      else if (inspectLeft <= 0) penalty = '+2';
    }
    var sv = { ms: ms, penalty: penalty, scramble: currentScramble, event: settings.event, at: Date.now() };
    solves.push(sv);
    lastSolve = sv;
    saveSolves();
    state = 'idle';
    setDisplay(fmt(effMs(sv)) + (penalty === '+2' ? '+' : penalty === 'DNF' ? ' (DNF)' : ''), '');
    setHint(t('stopped'));
    renderList(); renderStats();
    newScramble();
  }
  function cancel() {
    stopTick(); stopInspect();
    if (armTimer) { clearTimeout(armTimer); armTimer = null; }
    state = 'idle';
    setDisplay('0.00', '');
    setHint(t('hold'));
  }

  /* ---------------- input: keyboard ---------------- */
  var spaceDown = false;
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Escape') { cancel(); return; }
    if (e.code !== 'Space' || e.repeat) return;
    if (e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT')) return;
    e.preventDefault();
    spaceDown = true;
    if (state === 'running') { stopSolve(); return; }
    arm();
  });
  document.addEventListener('keyup', function (e) {
    if (e.code !== 'Space') return;
    e.preventDefault();
    spaceDown = false;
    releaseToStart();
  });

  /* ---------------- input: touch / mouse on the timer ---------------- */
  var touchArming = false;
  function onPressStart(e) {
    if (e.target.closest('button, select, a, input')) return;
    if (state === 'running') { stopSolve(); return; }
    touchArming = true;
    arm();
  }
  function onPressEnd(e) {
    if (!touchArming) return;
    touchArming = false;
    releaseToStart();
  }
  display.addEventListener('touchstart', function (e) { e.preventDefault(); onPressStart(e); }, { passive: false });
  display.addEventListener('touchend', function (e) { e.preventDefault(); onPressEnd(e); }, { passive: false });
  display.addEventListener('mousedown', function (e) { onPressStart(e); });
  display.addEventListener('mouseup', function (e) { onPressEnd(e); });

  /* ---------------- controls ---------------- */
  eventSel.value = settings.event;
  eventSel.addEventListener('change', function () {
    settings.event = eventSel.value;
    saveSettings();
    newScramble();
  });
  inspToggle.checked = settings.inspection;
  inspToggle.addEventListener('change', function () {
    settings.inspection = inspToggle.checked;
    saveSettings();
  });
  $('new-scramble-btn').addEventListener('click', function () { newScramble(); });
  $('copy-scramble-btn').addEventListener('click', function () {
    var done = function (ok) {
      var btn = $('copy-scramble-btn');
      var old = btn.textContent;
      btn.textContent = ok ? t('copied') : currentScramble;
      setTimeout(function () { btn.textContent = old; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentScramble).then(function () { done(true); }, function () { done(false); });
    } else { done(false); }
  });

  /* ---------------- language switcher ---------------- */
  var langBtns = document.querySelectorAll('#lang-toggle button');
  function applyLang(l) {
    lang = LANGS.indexOf(l) === -1 ? 'en' : l;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    langBtns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (I18N[lang] && I18N[lang][k]) el.textContent = I18N[lang][k];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (I18N[lang] && I18N[lang][k]) el.innerHTML = I18N[lang][k];
    });
    if (state === 'idle') setHint(t('hold'));
    scrambleNote.textContent = t('randomMovesNote') + ' · ' + (EVENTS[settings.event] ? EVENTS[settings.event].n : 20) + ' moves';
    renderList(); renderStats();
  }
  langBtns.forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
  });

  /* ---------------- init ---------------- */
  newScramble();
  setDisplay('0.00', '');
  applyLang(lang);
  renderList(); renderStats();
})();
