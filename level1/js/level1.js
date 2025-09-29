// level1.js — логика уровня 1 (cols=5, rows=8)
// Подключать в <script src="js/level1.js"></script>

document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const boardEl = document.getElementById('board');
  const dialogText = document.getElementById('dialogText');
  const nextBtn = document.getElementById('nextBtn');
  const rublesEl = document.getElementById('rubles');
  const finGasEl = document.getElementById('finGas');
  const quizModal = document.getElementById('quizModal');
  const quizAnswers = document.getElementById('quizAnswers');
  const quizClose = document.getElementById('quizClose');
  const gazpi = document.getElementById('gazpi');
  const resultModal = document.getElementById('resultModal');
  const resultNote = document.getElementById('resultNote');
  const closeResult = document.getElementById('closeResult');
  const playerNameEl = document.getElementById('playerName');

  // state
  const rows = 8, cols = 5;
  let grid = []; // grid[row][col] => cell element
  let selectedPipeType = null;
  let rubles = Number(localStorage.getItem('fg_rub')) || 0;
  let finGas = Number(localStorage.getItem('fg_gas')) || 100;
  let dialogIdx = 0;

  // pipe type defs: dirs relative to (r,c): U(-1,0), R(0,1), D(1,0), L(0,-1)

  // направления: top, right, bottom, left
  const DIRS = {
    t: [-1, 0],
    r: [0, 1],
    b: [1, 0],
    l: [0, -1]
  };
  const OPP = { t: 'b', b: 't', l: 'r', r: 'l' };
  // после const DIRS = {...} и const OPP = {...}
  const DIR_KEYS = Object.keys(DIRS); // ['t','r','b','l']

  // Вопросы для квиза
  // Вопросы для квиза
  const QUIZ_QUESTIONS = [
    {
      q: "Кто-то звонит и просит данные карты. Что делать?",
      answers: [
        { text: "Повесить трубку и позвонить в банк", correct: true },
        { text: "Назвать номер карты и код", correct: false },
        { text: "Спросить у звонящего, прошёл ли платёж", correct: false }
      ]
    },
    {
      q: "Вам пишут в мессенджере и просят перевести деньги 'родственнику'. Ваши действия?",
      answers: [
        { text: "Перезвонить родственнику лично и уточнить", correct: true },
        { text: "Сразу перевести деньги", correct: false },
        { text: "Ответить и спросить реквизиты", correct: false }
      ]
    },
    {
      q: "На улице предлагают вложить деньги в 'супер проект'. Как поступить?",
      answers: [
        { text: "Проверить информацию в официальных источниках и отказаться", correct: true },
        { text: "Вложить сразу наличные", correct: false },
        { text: "Отдать данные карты", correct: false }
      ]
    },
    {
      q: "Пришло SMS от 'банка' с просьбой перейти по ссылке. Что делать?",
      answers: [
        { text: "Игнорировать и проверить через официальный сайт банка", correct: true },
        { text: "Перейти по ссылке и ввести данные", correct: false },
        { text: "Ответить на SMS и уточнить", correct: false }
      ]
    },
    {
      q: "Вы нашли кошелёк с картой. Как правильно поступить?",
      answers: [
        { text: "Сдать находку в полицию или банк", correct: true },
        { text: "Оставить себе", correct: false },
        { text: "Попробовать расплатиться картой", correct: false }
      ]
    },
    {
      q: "Вам предлагают бесплатный 'кредит без документов'. Что это?",
      answers: [
        { text: "Скорее всего мошенничество", correct: true },
        { text: "Реальная выгода, нужно соглашаться", correct: false },
        { text: "Государственная помощь", correct: false }
      ]
    },
    {
      q: "Почему не стоит хранить ПИН-код на карте?",
      answers: [
        { text: "Потому что его легко украсть вместе с картой", correct: true },
        { text: "Чтобы не забыть номер", correct: false },
        { text: "Так все делают", correct: false }
      ]
    },
    {
      q: "Что безопаснее: перевести деньги через официальный сайт банка или по ссылке из письма?",
      answers: [
        { text: "Через официальный сайт/приложение", correct: true },
        { text: "Через ссылку из письма", correct: false },
        { text: "Через соцсеть", correct: false }
      ]
    },
    {
      q: "Зачем нужен финансовый план?",
      answers: [
        { text: "Чтобы грамотно распределять доходы и расходы", correct: true },
        { text: "Чтобы тратить больше", correct: false },
        { text: "Чтобы хранить секреты от семьи", correct: false }
      ]
    },
    {
      q: "Что делать, если банкомат 'съел' карту?",
      answers: [
        { text: "Позвонить в банк и заблокировать карту", correct: true },
        { text: "Ждать, пока карта сама вернётся", correct: false },
        { text: "Ударить банкомат", correct: false }
      ]
    },
    {
      q: "Вам предлагают заработать в пирамиде. Это безопасно?",
      answers: [
        { text: "Нет, это финансовая ловушка", correct: true },
        { text: "Да, можно разбогатеть", correct: false },
        { text: "Это как вклад в банке", correct: false }
      ]
    },
    {
      q: "К вам пришёл 'курьер из банка' и просит карту. Ваши действия?",
      answers: [
        { text: "Немедленно отказать и позвонить в банк", correct: true },
        { text: "Передать карту курьеру", correct: false },
        { text: "Дать ПИН-код вместе с картой", correct: false }
      ]
    },
    {
      q: "Почему важно копить 'финансовую подушку'?",
      answers: [
        { text: "Чтобы быть готовым к непредвиденным расходам", correct: true },
        { text: "Чтобы потратить всё сразу", correct: false },
        { text: "Чтобы показывать друзьям баланс", correct: false }
      ]
    },
    {
      q: "Как правильно выбрать пароль для онлайн-банка?",
      answers: [
        { text: "Сложный, длинный и уникальный", correct: true },
        { text: "12345", correct: false },
        { text: "Дата рождения", correct: false }
      ]
    },
    {
      q: "Зачем проверять адрес сайта перед вводом данных?",
      answers: [
        { text: "Чтобы убедиться, что это настоящий сайт", correct: true },
        { text: "Просто привычка", correct: false },
        { text: "Не имеет значения", correct: false }
      ]
    }
  ];


  // описание всех труб
  const TYPE_DEFS = {
    H:  { dirs: ["l", "r"], img: "images/H.png" },
    V:  { dirs: ["t", "b"], img: "images/V.png" },
    LD: { dirs: ["l", "b"], img: "images/LD.png" },
    RD: { dirs: ["r", "b"], img: "images/RD.png" },
    LU: { dirs: ["l", "t"], img: "images/LU.png" },
    UR: { dirs: ["r", "t"], img: "images/UR.png" }
  };


  // --- helper: безопасно получить массив направлений
  function getPipeDirsFromType(type) {
    if (!type) return [];
    const def = TYPE_DEFS[type];
    return def ? def.dirs : [];
  }
  function getPipeDirsFromCell(cell) {
    if (!cell) return [];
    return getPipeDirsFromType(cell.dataset.pipe);
  }


  // отрисовка трубы (символы или картинки)
  function renderPipe(cell, type, opts = {}) {
    const def = TYPE_DEFS[type];
    if (!def) {
      console.warn('renderPipe: unknown type', type);
      return;
    }

    cell.dataset.pipe = type;
    cell.classList.add('has-pipe');
    cell.innerHTML = '';

    // создаём картинку
    const img = document.createElement('img');
    img.src = def.img;
    img.alt = type;
    img.className = 'pipe-img';
    img.style.width = '100%';
    img.style.height = '100%';
    cell.appendChild(img);

    if (opts.fixed) {
      cell.classList.add('pipe-fixed');
      cell.dataset.pipeFixed = 'true';
    }
}

  // util: get cell by coords safely
  function getCell(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
    return grid[r][c];
  }

  function generateThieves() {
    // обязательные воришки на коридоре
    const forcedThieves = [
      [7, 2], // низ коридора
      [1, 1], // переход вверх
      [2, 3], // ближе к финишу
      [4, 4]  // середина вертикального пути
    ];
    forcedThieves.forEach(([r, c]) => {
      const cell = getCell(r, c);
      if (!cell) return;
      if (cell.classList.contains('start') || cell.classList.contains('goal')) return;
      cell.classList.add('thief');
      cell.textContent = '';
    });

    // дополнительные воришки случайно (вне коридора, чтобы не мешали пути)
    let extraPlaced = 0, tries = 0;
    while (extraPlaced < 2 && tries < 200) {
      tries++;
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const cell = getCell(r, c);
      if (!cell) continue;
      if (cell.classList.contains('start') || cell.classList.contains('goal')) continue;
      if (cell.classList.contains('thief')) continue;
      if (corridorSet.has(`${r},${c}`)) continue; // на коридор не ставим лишних
      cell.classList.add('thief');
      cell.textContent = '';
      extraPlaced++;
    }
  }




  // build board
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
    // start and goal
    const start = getCell(7, 0);
    start.classList.add('start');
    renderPipe(start, 'H', { fixed: true });

    const goal = getCell(0, 4);
    goal.classList.add('goal');
    renderPipe(goal, 'V', { fixed: true });



    // create safe corridor (guaranteed path along bottom row to right, then up)
    markSafeCorridor();

    // generate thieves not on corridor
    generateThieves();

    // update HUD
    updateHUD();

    // tutorial highlight start
    highlightCell(7, 0, 1300);
  }

  // create safe corridor cells set to avoid thief placement
  const corridorSet = new Set();
  function markSafeCorridor() {
    corridorSet.clear();
    // bottom row from (7,0) to (7,4)
    for (let c = 0; c <= 4; c++) corridorSet.add(`7,${c}`);
    // up column at last column from (6,4) up to (0,4)
    for (let r = 6; r >= 0; r--) corridorSet.add(`${r},4`);
    // mark visually (optional thin outline) — we DO NOT mark on UI, just exclude from thieves
  }



  // tutorial highlight helper
  function highlightCell(r, c, ms = 700) {
    const cell = getCell(r, c);
    if (!cell) return;
    cell.classList.add('tutorial');
    setTimeout(() => cell.classList.remove('tutorial'), ms);
  }

  // pipe issuance: one pipe at a time, random type
  // выбор трубы пользователем
  function choosePipe(type) {
    selectedPipeType = type;
    // подсветка выбранной кнопки
    document.querySelectorAll("#pipeChoice .btn").forEach(btn => btn.classList.remove("active"));
    const btn = document.querySelector(`#pipeChoice .btn[data-type="${type}"]`);
    if (btn) btn.classList.add("active");
  }
  window.choosePipe = choosePipe;

  // Заменить всю старую функцию canPlacePipe на эту
  function canPlacePipe(r, c, type) {
    // базовые проверки
    if (!TYPE_DEFS[type]) return false;
    const dirs = getPipeDirsFromType(type);

    // если на клетке уже стоит "фиксированная" труба — нельзя менять
    const targetCell = getCell(r, c);
    if (targetCell && targetCell.dataset.pipeFixed) return false;

    // 1) Если у нас есть выход к соседу — проверяем только в случае,
    //    когда сосед уже содержит трубу: сосед должен смотреть в ответ.
    for (const dir of dirs) {
      const [dr, dc] = DIRS[dir];
      const neigh = getCell(r + dr, c + dc);
      if (!neigh) continue;
      if (!neigh.dataset.pipe) continue; // сосед пуст — ок, позволяем смотреть в пустоту
      const neighDirs = getPipeDirsFromCell(neigh);
      const opp = OPP[dir];
      if (!neighDirs.includes(opp)) {
        // сосед есть, но не смотрит в нашу сторону — несовместимо
        return false;
      }
    }

    // 2) Если сосед содержит трубу и сосед смотрит на нас — у нас тоже должен быть обратный выход
    for (const dirKey of DIR_KEYS) {
      const [dr, dc] = DIRS[dirKey];
      const neigh = getCell(r + dr, c + dc);
      if (!neigh) continue;
      if (!neigh.dataset.pipe) continue;
      const neighDirs = getPipeDirsFromCell(neigh);
      const opp = OPP[dirKey];
      if (neighDirs.includes(opp) && !dirs.includes(dirKey)) {
        // сосед смотрит на нас, а мы не смотрим на него — несовместимо
        return false;
      }
    }

    // всё ок
    return true;
  }




  // клик по клетке
  function onCellClick(r, c) {
    const cell = getCell(r, c);
    if (!cell) return;
    if (cell.classList.contains('start') || cell.classList.contains('goal')) return;
    if (cell.dataset.pipe) {
      // уже стоит труба
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

    // ставим выбранную трубу
    //cell.dataset.pipe = selectedPipeType;
    //cell.textContent = TYPE_DEFS[selectedPipeType].sym;
    renderPipe(cell, selectedPipeType);
    //start и goal теперь будут отрисовываться через renderPipe и выглядеть как трубы.
    //В будущем, когда появятся красивые картинки труб, достаточно будет поменять
    //содержимое renderPipe (подставить <img src="...">) — логика игры останется прежней.


    // если это вор — открываем квиз
    if (cell.classList.contains('thief')) {
      openQuiz(cell);
    }
    // сразу проверяем поток
    checkFlow();
  }

  // quiz modal
  let quizTargetCell = null;
  function openQuiz(cell) {
    quizTargetCell = cell;
    quizAnswers.innerHTML = '';
    const options = [
      { text: 'Повесить трубку и позвонить в банк (правильно)', correct: true },
      { text: 'Назвать номер карты и код (неправильно)', correct: false },
      { text: 'Спросить у мошенника, как прошёл платёж (неправильно)', correct: false }
    ];
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.text;
      btn.className = 'btn';
      btn.addEventListener('click', () => {
        quizModal.setAttribute('aria-hidden', 'true');
        if (opt.correct) {
          rubles += 10;
          localStorage.setItem('fg_rub', rubles);
          showGazpiAtCell(cell);
        } else {
          finGas = Math.max(0, finGas - 20);
          localStorage.setItem('fg_gas', finGas);
          // small visual feedback
          cell.animate([{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:300});
        }
        updateHUD();
      });
      quizAnswers.appendChild(btn);
    });
    quizModal.setAttribute('aria-hidden', 'false');
  }

  quizClose.addEventListener('click', () => { quizModal.setAttribute('aria-hidden','true'); });

  // Gazpi floating animation
  function showGazpiAtCell(cell) {
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    gazpi.style.left = (rect.left - boardRect.left + rect.width / 2) + 'px';
    gazpi.style.top = (rect.top - boardRect.top - 10) + 'px';
    gazpi.classList.remove('hidden');
    gazpi.style.opacity = '1';
    gazpi.style.transform = 'translateY(-40px)';
    setTimeout(() => {
      gazpi.style.opacity = '0';
      gazpi.style.transform = 'translateY(-70px)';
      setTimeout(() => gazpi.classList.add('hidden'), 600);
    }, 800);
  }

  // BFS — проверка соединений по ориентациям и построение пути
  function checkFlow() {
    const start = { r: 7, c: 0 };
    const goal = { r: 0, c: 4 };
    const startKey = `${start.r},${start.c}`;
    const goalKey = `${goal.r},${goal.c}`;

    const visited = new Set();
    const prev = new Map();
    const queue = [startKey];

    function pushIfValid(nr, nc, fromKey) {
      const k = `${nr},${nc}`;
      if (visited.has(k)) return;
      const neigh = getCell(nr, nc);
      if (!neigh) return;
      // If neighbour is goal -> we can reach goal if current pipe has dir to it
      // But neighbor may be goal and have no pipe — goal is terminal
      queue.push(k);
      prev.set(k, fromKey);
    }

    // helper to check connection from (r,c) via direction dirKey to neighbor (nr,nc)
    function canConnect(r, c, dirKey) {
      const cell = getCell(r, c);
      if (!cell) return false;
      const type = cell.dataset.pipe;
      if (!type) {
        // start cell has dataset.pipe set already; if missing -> cannot connect
        return false;
      }
      const dirs = TYPE_DEFS[type].dirs;
      return dirs.includes(dirKey);
    }

    // BFS using queue of keys
    while (queue.length) {
      const key = queue.shift();
      if (visited.has(key)) continue;
      visited.add(key);
      const [r, c] = key.split(',').map(Number);

      // if reached goal coordinate
      if (r === goal.r && c === goal.c) {
        const path = reconstructPath(prev, key, startKey);
        animateFlow(path);
        return true;
      }

      // need the type of current cell to know outgoing directions
      // need the type of current cell to know outgoing directions
      const curCell = getCell(r, c);
      const curType = curCell ? curCell.dataset.pipe : null;
      if (!curType || !TYPE_DEFS[curType]) continue; // ✅ проверка на валидность


      // for each outgoing direction of current pipe
      for (const dirKey of TYPE_DEFS[curType].dirs) {
        const [dr, dc] = DIRS[dirKey];
        const nr = r + dr, nc = c + dc;
        // bounds
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const neigh = getCell(nr, nc);
        if (!neigh) continue;
        // if neighbour is goal -> accept and set prev
        if (neigh.classList.contains('goal')) {
          prev.set(goalKey, key);
          const path = reconstructPath(prev, goalKey, startKey);
          animateFlow(path);
          return true;
        }
        const neighType = neigh.dataset.pipe;
        if (!neighType) continue;
        // check neighbour has an incoming direction opposite to dirKey
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
    // no path found
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
    return path.reverse(); // from start to end
  }

  // animateFlow: step-by-step highlight .flow; when finished show result modal and award rubles
  let flowInProgress = false;
  function animateFlow(pathKeys) {
    if (flowInProgress) return;
    flowInProgress = true;
    // clear previous
    document.querySelectorAll('.cell.flow').forEach(el => el.classList.remove('flow'));
    let i = 0;
    const interval = setInterval(() => {
      if (i >= pathKeys.length) {
        clearInterval(interval);
        flowInProgress = false;
        // award based on path length (example)
        const gained = Math.max(5, 12 - pathKeys.length + 8); // simple formula
        rubles += gained;
        localStorage.setItem('fg_rub', rubles);
        resultNote.textContent = `Поток дошёл до мечты — +${gained} ₽`;
        resultModal.setAttribute('aria-hidden', 'false');
        updateHUD();
        return;
      }
      const [r, c] = pathKeys[i].split(',').map(Number);
      const cell = getCell(r, c);
      if (cell) cell.classList.add('flow');
      i++;
    }, 240);
  }

  // UI helpers
  function updateHUD() {
    rublesEl.textContent = rubles;
    finGasEl.textContent = finGas;
    playerNameEl.textContent = localStorage.getItem('fg_name') || 'Игрок';
  }

  // dialog flow
  const DIALOGS = [
    'Видишь эту трубу? По ней текут твои сбережения.',
    'У каждого из нас есть мечта. Собери путь из труб к мечте!'
  ];

  nextBtn.addEventListener('click', () => {
    if (dialogIdx < DIALOGS.length) {
      dialogText.textContent = DIALOGS[dialogIdx];
      // after first message, highlight start
      if (dialogIdx === 0) highlightCell(7, 0, 1200);
      // after second message, highlight goal and give first pipe
      if (dialogIdx === 1) {
        highlightCell(0, 4, 1200);
      }
      dialogIdx++;
    } else {
      // hide dialog if beyond
      dialogText.textContent = 'Удачи!';
      nextBtn.disabled = true;
    }
  });


  // quiz close behavior
  quizClose.addEventListener('click', () => quizModal.setAttribute('aria-hidden', 'true'));

  // result close
  closeResult.addEventListener('click', () => {
  resultModal.setAttribute('aria-hidden', 'true');
  // Добавляем переход на уровень 2 после небольшой паузы
  setTimeout(() => {
    window.location.href = 'level2.html';
  }, 500);
});

  // init
  initBoard();
  updateHUD();

  // expose for debug (optional)
  window._fg = { grid, checkFlow };

});
