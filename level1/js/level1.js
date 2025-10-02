// level1.js — логика уровня 1 (cols=5, rows=8)
// Подключать в <script src="js/level1.js"></script>

document.addEventListener('DOMContentLoaded', () => {
  // -----------------------
  // DOM (убрал несуществующие селекторы, добавил boardEl)
  // -----------------------
  const boardEl = document.getElementById('board');
  const dialogOverlay = document.getElementById('dialogOverlay');
  const dialogTextOverlay = document.getElementById('dialogTextOverlay');
  const nextBtnOverlay = document.getElementById('nextBtnOverlay');

  // элементы модалок / HUD
  const rublesEl = document.getElementById('rubles');
  const finGasEl = document.getElementById('finGas');
  const quizModal = document.getElementById('quizModal');
  const quizAnswers = document.getElementById('quizAnswers');
  const quizClose = document.getElementById('quizClose');
  const resultModal = document.getElementById('resultModal');
  const resultNote = document.getElementById('resultNote');
  const closeResult = document.getElementById('closeResult');
  const dailyModal = document.getElementById('dailyModal');
  const closeDaily = document.getElementById('closeDaily');
  const nextLevelBtn = document.getElementById('nextLevel');
  const playerNameEl = document.getElementById('playerName');
  const bonusInfo = document.getElementById('bonusInfo');

  const redZoneIntroModal = document.getElementById('redZoneIntroModal');
  const redZoneIntroClose = document.getElementById('redZoneIntroClose');

  // Базовая защита: если board отсутствует — прекращаем.
  if (!boardEl) {
    console.error('level1.js: элемент #board не найден в DOM. Исправь HTML или путь к файлу.');
    return;
  }

  // -----------------------
  // state
  // -----------------------
  const cols = 5;
  const rows = 7; // Важно: rows должно соответствовать реальному числу строк в логике (start = rows-1)
  let grid = []; // grid[row][col] => cell element
  let selectedPipeType = null;
  let rubles = Number(localStorage.getItem('fg_rub')) || 0;
  let finGas = Number(localStorage.getItem('fg_gas')) || 100;
  let dialogIndex = 0;            // индекс текущего сообщения в активном диалоге
  let currentDialog = null;       // null | "intro" | "firstPipe"
  let pipesUsed = 0;
  let correctAnswers = 0;
  let usedQuestions = new Set();
  let hasSeenRedZoneIntro = false;
  let isFirstPipeDialogActive = false;



  // -----------------------
  // направления и типы труб
  // -----------------------
  const DIRS = { t: [-1, 0], r: [0, 1], b: [1, 0], l: [0, -1] };
  const OPP = { t: 'b', b: 't', l: 'r', r: 'l' };
  const DIR_KEYS = Object.keys(DIRS);

  const FINANCE_QUESTIONS = [
    // ... (оставляем те же вопросы, что у тебя) ...
    { q: "Кто-то звонит и просит данные карты. Что делать?", answers: [{ text: "Повесить трубку и позвонить в банк", correct: true }, { text: "Назвать номер карты и код", correct: false }, { text: "Спросить у звонящего, прошёл ли платёж", correct: false }] },
    // остальные вопросы...
  ];

  const TYPE_DEFS = {
    H:  { dirs: ["l", "r"], img: "images/H.png" },
    V:  { dirs: ["t", "b"], img: "images/V.png" },
    LD: { dirs: ["l", "b"], img: "images/LD.png" },
    RD: { dirs: ["r", "b"], img: "images/RD.png" },
    LU: { dirs: ["l", "t"], img: "images/LU.png" },
    UR: { dirs: ["r", "t"], img: "images/UR.png" }
  };

  // -----------------------
  // утилиты
  // -----------------------
  function getPipeDirsFromType(type) {
    if (!type) return [];
    const def = TYPE_DEFS[type];
    return def ? def.dirs : [];
  }
  function getPipeDirsFromCell(cell) {
    if (!cell) return [];
    return getPipeDirsFromType(cell.dataset.pipe);
  }

  function renderPipe(cell, type, opts = {}) {
    if (!TYPE_DEFS[type]) return;
    cell.dataset.pipe = type;
    cell.classList.add('has-pipe');
    cell.innerHTML = '';
    const img = document.createElement('img');
    img.src = TYPE_DEFS[type].img || `images/${type}.png`;
    img.alt = type;
    img.className = 'pipe-img';
    cell.appendChild(img);
    if (opts.fixed) {
      cell.classList.add('pipe-fixed');
      cell.dataset.pipeFixed = 'true';
    }
  }

  function getCell(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
    return grid[r][c];
  }

  // -----------------------
  // построение поля
  // -----------------------
  function initBoard() {
    boardEl.innerHTML = '';
    grid = [];
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', () => onCellClick(r, c));
        boardEl.appendChild(cell);
        row.push(cell);
      }
      grid.push(row);
    }

    // start и goal — вычисляем динамически на основе rows/cols
    const start = getCell(rows - 1, 0);
    if (start) {
      start.classList.add('start');
      renderPipe(start, 'H', { fixed: true });
    }

    const goal = getCell(0, cols - 1);
    if (goal) {
      goal.classList.add('goal');
      renderPipe(goal, 'V', { fixed: true });
    }

    placeRedZones();

    updateHUD();
    // tutorial highlight на старте
    highlightCell(rows - 1, 0, 1200);
  }

  function placeRedZones() {
    const redPositions = [
      [5, 2], [4, 1], [3, 3], [2, 0], [1, 3], [3, 4]
    ];
    redPositions.forEach(([r, c]) => {
      const cell = getCell(r, c);
      if (cell && !cell.classList.contains('start') && !cell.classList.contains('goal')) {
        cell.classList.add('red-zone');
        cell.textContent = '?';
      }
    });
  }

  function highlightCell(r, c, ms = 700) {
    const cell = getCell(r, c);
    if (!cell) return;
    cell.classList.add('tutorial');
    setTimeout(() => cell.classList.remove('tutorial'), ms);
  }

  // -----------------------
  // выбор трубы из UI
  // -----------------------
  window.choosePipe = function(type) {
    selectedPipeType = type;
    // Поддерживаем оба варианта: десктопные и мобильные панели
    document.querySelectorAll('.pipe-buttons .btn, .pipe-buttons-mobile .btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset && btn.dataset.type === type) btn.classList.add('active');
    });
  };

  // -----------------------
  // проверка установки трубы (логика совместимости)
  // -----------------------
  function canPlacePipe(r, c, type) {
    if (!TYPE_DEFS[type]) return false;
    const dirs = getPipeDirsFromType(type);
    const targetCell = getCell(r, c);
    if (targetCell && targetCell.dataset.pipeFixed) return false;

    // 1) если у нас есть выход к соседу — проверяем, что сосед (если труба есть) смотрит на нас
    for (const dir of dirs) {
      const [dr, dc] = DIRS[dir];
      const neigh = getCell(r + dr, c + dc);
      if (!neigh) continue;
      if (!neigh.dataset.pipe) continue;
      const neighDirs = getPipeDirsFromCell(neigh);
      const opp = OPP[dir];
      if (!neighDirs.includes(opp)) return false;
    }

    // 2) если сосед смотрит в нашу сторону, мы должны смотреть в его
    for (const dirKey of DIR_KEYS) {
      const [dr, dc] = DIRS[dirKey];
      const neigh = getCell(r + dr, c + dc);
      if (!neigh) continue;
      if (!neigh.dataset.pipe) continue;
      const neighDirs = getPipeDirsFromCell(neigh);
      const opp = OPP[dirKey];
      if (neighDirs.includes(opp) && !dirs.includes(dirKey)) return false;
    }
    return true;
  }

  // -----------------------
  // клик по клетке
  // -----------------------
  function onCellClick(r, c) {
    const cell = getCell(r, c);
    if (!cell) return;
    if (cell.classList.contains('start') || cell.classList.contains('goal')) return;

    if (cell.dataset.pipe) {
      cell.animate([{transform:'scale(1)'},{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:180});
      return;
    }
    if (!selectedPipeType) {
      alert('Сначала выберите трубу внизу.');
      return;
    }
    if (!canPlacePipe(r, c, selectedPipeType)) {
      alert('Эта труба не стыкуется с соседними!');
      return;
    }

    renderPipe(cell, selectedPipeType);
    pipesUsed++;


    // проверка: первая труба → мини-диалог
    // проверка: первая труба → мини-диалог (через showDialog)
    if (pipesUsed === 1) {
      isFirstPipeDialogActive = true;
      showDialog(FIRST_PIPE_DIALOGS, 'firstPipe');
      return; // не продолжаем игру, пока диалог не закончен
    }



    if (cell.classList.contains('red-zone')) {
      if (!hasSeenRedZoneIntro) {
        showRedZoneIntro(cell);
      } else {
        openFinanceQuiz(cell);
      }
    } else {
      checkFlow();
    }
  }

  // -----------------------
  // red-zone intro
  // -----------------------
  function showRedZoneIntro(cell) {
    hasSeenRedZoneIntro = true;
    if (!redZoneIntroModal) {
      // если модалки нет — просто открываем квиз
      openFinanceQuiz(cell);
      return;
    }
    redZoneIntroModal.setAttribute('aria-hidden', 'false');
    redZoneIntroClose.onclick = () => {
      redZoneIntroModal.setAttribute('aria-hidden', 'true');
      openFinanceQuiz(cell);
    };
  }

  // -----------------------
  // квиз
  // -----------------------
  function openFinanceQuiz(cell) {
    let availableQuestions = FINANCE_QUESTIONS.filter(q => !usedQuestions.has(q.q));
    if (availableQuestions.length === 0) {
      usedQuestions.clear();
      availableQuestions = FINANCE_QUESTIONS.slice();
    }
    const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    usedQuestions.add(question.q);

    quizAnswers.innerHTML = '';
    const quizQuestionEl = document.getElementById('quizQuestion');
    if (quizQuestionEl) quizQuestionEl.textContent = question.q;

    question.answers.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.text;
      btn.className = 'btn';
      btn.addEventListener('click', () => {
        quizModal.setAttribute('aria-hidden', 'true');
        if (opt.correct) {
          correctAnswers++;
          rubles += 15;
          createFloatingText(cell, '+15 ₽', 'gold');
        } else {
          finGas = Math.max(0, finGas - 20);
        }
        updateHUD();
        cell.classList.remove('red-zone');
        checkFlow();
      });
      quizAnswers.appendChild(btn);
    });

    quizModal.setAttribute('aria-hidden', 'false');
  }

  quizClose.addEventListener('click', () => quizModal.setAttribute('aria-hidden', 'true'));

  // -----------------------
  // вспомогательная анимация текста (+15 и т.п.)
  // -----------------------
  function createFloatingText(cell, text, color, className = '') {
    if (!cell) return;
    const floatingText = document.createElement('div');
    floatingText.textContent = text;
    floatingText.style.cssText = `
      position: absolute;
      pointer-events: none;
      font-weight: 800;
      color: ${color};
      font-size: 20px;
      z-index: 1000;
      transition: transform 0.9s ease, opacity 0.9s ease;
      opacity: 1;
    `;
    if (className) floatingText.className = className;

    const rect = cell.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();

    floatingText.style.left = (rect.left - boardRect.left + rect.width / 2) + 'px';
    floatingText.style.top = (rect.top - boardRect.top - 10) + 'px';

    boardEl.parentElement.appendChild(floatingText);

    setTimeout(() => {
      floatingText.style.opacity = '0';
      floatingText.style.transform = 'translateY(-70px)';
      setTimeout(() => {
        if (floatingText.parentElement) floatingText.parentElement.removeChild(floatingText);
      }, 900);
    }, 100);
  }

  // -----------------------
  // проверка потока (BFS) — теперь старт/цель вычисляются динамически
  // -----------------------
  function checkFlow() {
    const start = { r: rows - 1, c: 0 };
    const goal = { r: 0, c: cols - 1 };
    const startKey = `${start.r},${start.c}`;
    const goalKey = `${goal.r},${goal.c}`;

    const visited = new Set();
    const prev = new Map();
    const queue = [startKey];

    while (queue.length) {
      const key = queue.shift();
      if (visited.has(key)) continue;
      visited.add(key);
      const [r, c] = key.split(',').map(Number);

      if (r === goal.r && c === goal.c) {
        const path = reconstructPath(prev, key, startKey);
        animateFlow(path);
        return true;
      }

      const curCell = getCell(r, c);
      const curType = curCell ? curCell.dataset.pipe : null;
      if (!curType || !TYPE_DEFS[curType]) continue;

      for (const dirKey of TYPE_DEFS[curType].dirs) {
        const [dr, dc] = DIRS[dirKey];
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const neigh = getCell(nr, nc);
        if (!neigh) continue;

        if (neigh.classList.contains('goal')) {
          prev.set(goalKey, key);
          const path = reconstructPath(prev, goalKey, startKey);
          animateFlow(path);
          return true;
        }

        const neighType = neigh.dataset.pipe;
        if (!neighType) continue;
        const oppKey = OPP[dirKey];
        if (TYPE_DEFS[neighType].dirs.includes(oppKey)) {
          const nkey = `${nr},${nc}`;
          if (!visited.has(nkey) && !queue.includes(nkey)) {
            prev.set(nkey, key);
            queue.push(nkey);
          }
        }
      }
    }
    return false;
  }

  function reconstructPath(prevMap, endKey, startKey) {
    const path = [];
    let cur = endKey;
    while (cur) {
      path.push(cur);
      if (cur === startKey) break;
      cur = prevMap.get(cur);
    }
    return path.reverse();
  }

  // -----------------------
  // анимация потока и завершение уровня
  // -----------------------
  let flowInProgress = false;
  function animateFlow(pathKeys) {
    if (flowInProgress) return;
    flowInProgress = true;
    document.querySelectorAll('.cell.flow').forEach(el => el.classList.remove('flow'));
    let i = 0;
    const interval = setInterval(() => {
      if (i >= pathKeys.length) {
        clearInterval(interval);
        flowInProgress = false;
        completeLevel();
        return;
      }
      const [r, c] = pathKeys[i].split(',').map(Number);
      const cell = getCell(r, c);
      if (cell) cell.classList.add('flow');
      i++;
    }, 240);
  }

  function completeLevel() {
    const baseReward = 20;
    const pipeBonus = Math.max(0, 30 - pipesUsed * 2);
    const answerBonus = correctAnswers * 10;
    const totalReward = baseReward + pipeBonus + answerBonus;
    rubles += totalReward;
    localStorage.setItem('fg_rub', rubles);
    localStorage.setItem('fg_gas', finGas);

    resultNote.textContent = `Супер! Тебе начислили +${totalReward} ₽ за прохождение уровня!`;
    if (bonusInfo) {
      bonusInfo.innerHTML = `
        <div class="bonus-item">Всего получено: +${totalReward} ₽</div>
        <div class="bonus-item">Базовая награда: +${baseReward} ₽</div>
        <div class="bonus-item">Бонус за трубы: +${pipeBonus} ₽</div>
        <div class="bonus-item">Бонус за ответы: +${answerBonus} ₽</div>
      `;
    }

    resultModal.setAttribute('aria-hidden', 'false');
  }

  // -----------------------
  // HUD + диалоги
  // -----------------------
  function updateHUD() {
    if (rublesEl) rublesEl.textContent = rubles;
    if (finGasEl) finGasEl.textContent = finGas;
    if (playerNameEl) playerNameEl.textContent = localStorage.getItem('fg_name') || 'Игрок';
  }

  const DIALOGS = [
    'В нашем мире все деньги это единый газовый поток. Мы называем его ФинГаз.',
    'Видишь эту трубу? По ней текут твои сбережения.',
    'У каждого из нас есть мечта. Собери путь из труб к мечте!',
    'Твоя задача: собрать путь из труб к мечте. ',
    'Для этого используй трубы в нижней части экрана.',
  ];
  const FIRST_PIPE_DIALOGS = [
    "Ох. Видишь эту красную зону?",
    "Это скопление мошенников, которые ну очень хотят украсть твои накопления. ",
    "Попав в такую тебе придется выбрать правильную тактику общения с ними, а иначе потеряешь часть ФинГаза и Газики.",
    "Запомни: чем больше потока дойдет до мечты – тем больше Рубликов ты получишь. ",
    "Позже я объясню зачем они нужны. Удачи, дорогой друг!"
  ];

   // универсальная функция
    function showDialog(dialogs, mode) {
      currentDialog = mode;
      dialogIndex = 0;
      dialogTextOverlay.textContent = dialogs[0];
      dialogOverlay.style.display = 'flex';
      nextBtnOverlay.style.display = 'inline-block';
      nextBtnOverlay.textContent = 'Далее';
    }

    // единый обработчик кнопки
    nextBtnOverlay.onclick = () => {
      if (!currentDialog) return;
      const dialogs = currentDialog === 'intro' ? DIALOGS : FIRST_PIPE_DIALOGS;
      dialogIndex++;

      if (dialogIndex < dialogs.length) {
        dialogTextOverlay.textContent = dialogs[dialogIndex];
      } else {
        dialogOverlay.style.display = 'none';
        const finished = currentDialog;
        currentDialog = null;
        if (finished === 'firstPipe') {
          isFirstPipeDialogActive = false;
          checkFlow();
        }
      }
    };

    // запуск стартового диалога
    showDialog(DIALOGS, 'intro');

  // -----------------------
  // обработчики модалок и навигация
  // -----------------------
  closeResult.addEventListener('click', () => {
    resultModal.setAttribute('aria-hidden', 'true');
    // показываем подсказку про награды в overlay (переназначаем overlay)
    if (dialogTextOverlay && nextBtnOverlay) {
      dialogTextOverlay.textContent = "Ты также можешь получать еще больше Рубликов в ежедневных наградах.";
      nextBtnOverlay.disabled = false;
      nextBtnOverlay.style.display = 'inline-block';
      nextBtnOverlay.textContent = "Посмотреть награды";
      nextBtnOverlay.onclick = () => {
        dailyModal.setAttribute('aria-hidden', 'false');
        nextBtnOverlay.style.display = 'none';
      };
      if (dialogOverlay) dialogOverlay.style.display = 'flex';
    }
  });

  closeDaily.addEventListener('click', () => {
    dailyModal.setAttribute('aria-hidden', 'true');
    setTimeout(() => { window.location.href = 'index.html'; }, 500);
  });

  if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', () => {
      dailyModal.setAttribute('aria-hidden', 'true');
      setTimeout(() => { window.location.href = 'level2.html'; }, 500);
    });
  }

  // -----------------------
  // init
  // -----------------------
  initBoard();
  updateHUD();

  adjustLayoutForViewport();
  window.addEventListener('resize', adjustLayoutForViewport);

  // экспорт для отладки
  window._fg = { grid, checkFlow };
});
function adjustLayoutForViewport() {
  const viewportHeight = window.innerHeight;

  const boardContainer = document.querySelector('.board-container');
  const mobilePanel = document.getElementById('mobilePipePanel');

  // Если высота viewport меньше 700px, включаем компактный режим
  if (viewportHeight < 700) {
    document.body.style.overflowY = 'auto';
    if (boardContainer) {
      boardContainer.style.padding = '5px';
    }
    if (mobilePanel) {
      mobilePanel.style.minHeight = '60px';
    }
  } else {
    document.body.style.overflowY = 'hidden';
  }
}

