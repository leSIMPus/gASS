el3.js — логика уровня 3 с белыми зонами
document.addEventListener('DOMContentLoaded', () => {
  // DOM элементы
  const boardEl = document.getElementById('board');
  const dialogText = document.getElementById('dialogText');
  const nextBtn = document.getElementById('nextBtn');
  const rublesEl = document.getElementById('rubles');
  const finGasEl = document.getElementById('finGas');
  const quizModal = document.getElementById('quizModal');
  const quizAnswers = document.getElementById('quizAnswers');
  const quizClose = document.getElementById('quizClose');
  const productModal = document.getElementById('productModal');
  const productClose = document.getElementById('productClose');
  const productInfo = document.getElementById('productInfo');
  const resultModal = document.getElementById('resultModal');
  const resultNote = document.getElementById('resultNote');
  const bonusInfo = document.getElementById('bonusInfo');
  const closeResult = document.getElementById('closeResult');
  const dailyModal = document.getElementById('dailyModal');
  const closeDaily = document.getElementById('closeDaily');
  const playerNameEl = document.getElementById('playerName');

  // состояние игры
  const rows = 8, cols = 5;
  let grid = [];
  let selectedPipeType = null;
  let rubles = Number(localStorage.getItem('fg_rub')) || 0;
  let finGas = Number(localStorage.getItem('fg_gas')) || 100;
  let dialogIdx = 0;
  let pipesUsed = 0;
  let correctAnswers = 0;
  let gaziksCollected = 0;
  let usedQuestions = new Set();
  let hasSeenWhiteZoneIntro = false;
  let hasSeenGazikiIntro = false;

  // направления и типы труб
  const DIRS = { t: [-1, 0], r: [0, 1], b: [1, 0], l: [0, -1] };
  const OPP = { t: 'b', b: 't', l: 'r', r: 'l' };
  const DIR_KEYS = Object.keys(DIRS);

  const TYPE_DEFS = {
    H:  { sym: "━", dirs: ["l", "r"] },
    V:  { sym: "┃", dirs: ["t", "b"] },
    LD: { sym: "┐", dirs: ["l", "b"] },
    RD: { sym: "┌", dirs: ["r", "b"] },
    LU: { sym: "┘", dirs: ["l", "t"] },
    UR: { sym: "└", dirs: ["r", "t"] }
  };

  // Вопросы для белых зон (те же, что и для жёлтых, бонусные)
  const FINANCE_QUESTIONS = [
    { q: "Что лучше: тратить все деньги сразу или откладывать часть?", answers: [
      { text: "Откладывать 10-20% от дохода", correct: true },
      { text: "Тратить все, жизнь одна", correct: false },
      { text: "Брать кредиты на все покупки", correct: false }
    ] },
    { q: "Какой минимальный размер 'финансовой подушки'?", answers: [
      { text: "3-6 месячных доходов", correct: true },
      { text: "1 месячный доход", correct: false },
      { text: "Достаточно 10 000 рублей", correct: false }
    ] },
    { q: "Что выгоднее: дебетовая карта с кешбэком или кредитная?", answers: [
      { text: "Дебетовая с кешбэком для повседневных трат", correct: true },
      { text: "Кредитная для всех покупок", correct: false },
      { text: "Не важно, главное красивая карта", correct: false }
    ] }
    // остальные вопросы по желанию
  ];

  // Продукты банка для газиков
  const BANK_PRODUCTS = [
    { name: "Накопительный счет", description: "До 8% годовых на остаток, пополнение и снятие в любой момент" },
    { name: "Инвестиции", description: "Покупка акций и облигаций с доходностью выше вклада" },
    { name: "Страхование", description: "Защита здоровья, имущества и финансовых рисков" },
    { name: "Ипотека", description: "Выгодные ставки от 5% на покупку жилья" }
  ];

  // Вспомогательные функции
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
    img.src = `images/${type}.png`;
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

  // Создание игрового поля
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

    // Старт и финиш
    const start = getCell(7, 0);
    start.classList.add('start');
    renderPipe(start, 'H', { fixed: true });

    const goal = getCell(0, 4);
    goal.classList.add('goal');
    renderPipe(goal, 'V', { fixed: true });

    // Белые зоны вместо желтых
    placeWhiteZones();

    // Газики
    spawnGazik();

    // Обновление интерфейса
    updateHUD();
  }

  // Размещение белых зон
  function placeWhiteZones() {
    const whitePositions = [
      [6, 2], [5, 1], [4, 3], [3, 2], [2, 0], [1, 3]
    ];

    whitePositions.forEach(([r, c]) => {
      const cell = getCell(r, c);
      if (cell && !cell.classList.contains('start') && !cell.classList.contains('goal')) {
        cell.classList.add('white-zone');
        cell.textContent = '?';
      }
    });
  }
  // Создание газиков
  function spawnGazik() {
    document.querySelectorAll('.cell.gazik').forEach(cell => {
      cell.classList.remove('gazik');
      cell.textContent = '';
    });

    const gazikCount = Math.floor(Math.random() * 2) + 2;
    let placed = 0;

    while (placed < gazikCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const cell = getCell(r, c);

      if (cell && !cell.dataset.pipe &&
          !cell.classList.contains('start') &&
          !cell.classList.contains('goal') &&
          !cell.classList.contains('white-zone')) {
        cell.classList.add('gazik');
        cell.textContent = '🔥';
        placed++;
      }
    }
  }

  // Выбор трубы
  window.choosePipe = function(type) {
    selectedPipeType = type;
    document.querySelectorAll("#pipeChoice .btn").forEach(btn => {
      btn.classList.remove("active");
      if (btn.dataset.type === type) {
        btn.classList.add("active");
      }
    });
  };

  // Проверка возможности установки трубы
  function canPlacePipe(r, c, type) {
    if (!TYPE_DEFS[type]) return false;
    const dirs = getPipeDirsFromType(type);

    const targetCell = getCell(r, c);
    if (targetCell && targetCell.dataset.pipeFixed) return false;

    for (const dir of dirs) {
      const [dr, dc] = DIRS[dir];
      const neigh = getCell(r + dr, c + dc);
      if (!neigh) continue;
      if (!neigh.dataset.pipe) continue;
      const neighDirs = getPipeDirsFromCell(neigh);
      const opp = OPP[dir];
      if (!neighDirs.includes(opp)) {
        return false;
      }
    }

    for (const dirKey of DIR_KEYS) {
      const [dr, dc] = DIRS[dirKey];
      const neigh = getCell(r + dr, c + dc);
      if (!neigh) continue;
      if (!neigh.dataset.pipe) continue;
      const neighDirs = getPipeDirsFromCell(neigh);
      const opp = OPP[dirKey];
      if (neighDirs.includes(opp) && !dirs.includes(dirKey)) {
        return false;
      }
    }

    return true;
  }

  // Обработка клика по клетке
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

    // Установка трубы
    renderPipe(cell, selectedPipeType);
    pipesUsed++;

    // Проверка специальных клеток
    if (cell.classList.contains('white-zone')) {
      if (!hasSeenWhiteZoneIntro) {
        showWhiteZoneIntro(cell);
      } else {
        collectWhiteBonus(cell);
      }
    } else if (cell.classList.contains('gazik')) {
      if (!hasSeenGazikiIntro) {
        showGazikiIntro(cell);
      } else {
        collectGazik(cell);
      }
    } else {
      checkFlow();
    }
  }

  // Введение про белую зону (при первом входе)
  function showWhiteZoneIntro(cell) {
    hasSeenWhiteZoneIntro = true;

    const currentDialog = dialogText.textContent;

    dialogText.textContent = "Это белая зона! Здесь ты можешь получить бонусы без потери ФинГаза.";
    nextBtn.disabled = false;
    nextBtn.style.display = 'inline-block';
    nextBtn.textContent = "Понятно";

    const originalClick = nextBtn.onclick;

    nextBtn.onclick = () => {
      dialogText.textContent = currentDialog;
      nextBtn.disabled = true;
      nextBtn.style.display = 'none';
      nextBtn.textContent = "Далее";
      nextBtn.onclick = originalClick;

      collectWhiteBonus(cell);
    };
  }

  // Получение бонуса на белой зоне
  function collectWhiteBonus(cell) {
    // В белых зонах просто даем бонус без вопросов
    rubles += 15;
    gaziksCollected++;
    createFloatingText(cell, '+15 ₽', 'gold');
    createFloatingText(cell, '+1 🔥', '#2a7ade', 'gazik-floating');

    updateHUD();
    cell.classList.remove('white-zone');
    checkFlow();
  }

  // Вопросы для белых зон — бонусные
  const WHITE_ZONE_QUESTIONS = [
    {
      q: "Какой предмет чаще всего помогает зарабатывать рубли?",
      answers: [
        { text: "Правильное планирование", correct: true },
        { text: "Сон", correct: false },
        { text: "Прогулки", correct: false }
      ]
    },
    {
      q: "Что увеличивает количество Газиков?",
      answers: [
        { text: "Сбор бонусов и выполнение заданий", correct: true },
        { text: "Игнорирование бонусов", correct: false },
        { text: "Случайные клики", correct: false }
      ]
    },
    {
      q: "Что важно для игрового прогресса?",
      answers: [
        { text: "Использовать трубы стратегически", correct: true },
        { text: "Кликать куда попало", correct: false },
        { text: "Сидеть на месте", correct: false }
      ]
    }
  ];

  // Открытие бонусного квиза белой зоны
  function openWhiteZoneQuiz(cell) {
    const availableQuestions = WHITE_ZONE_QUESTIONS.filter(q => !usedQuestions.has(q.q));

    if (availableQuestions.length === 0) {
      usedQuestions.clear();
    }

    const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    usedQuestions.add(question.q);

    quizAnswers.innerHTML = '';
    document.getElementById('quizQuestion').textContent = question.q;

    question.answers.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.text;
      btn.className = 'btn';
      btn.addEventListener('click', () => {
        quizModal.setAttribute('aria-hidden', 'true');
        if (opt.correct) {
          rubles += 20; // бонус за правильный ответ
          gaziksCollected += 1;
          createFloatingText(cell, '+20 ₽', 'gold');
          createFloatingText(cell, '+1 🔥', '#ff4500', 'gazik-floating');
        } else {
          // бонус все равно даем, но меньше
          rubles += 10;
          createFloatingText(cell, '+10 ₽', 'gold');
        }
        updateHUD();
        cell.classList.remove('white-zone');
        checkFlow();
      });
      quizAnswers.appendChild(btn);
    });

    quizModal.setAttribute('aria-hidden', 'false');
  }

  // Изменяем collectWhiteBonus, чтобы запускал квиз
  function collectWhiteBonus(cell) {
    openWhiteZoneQuiz(cell);
  }
// Сбор газика — уровень 3
function collectGazik(cell) {
  const product = BANK_PRODUCTS[Math.floor(Math.random() * BANK_PRODUCTS.length)];
  productInfo.innerHTML = `
    <h4>${product.name}</h4>
    <p>${product.description}</p>
  `;

  productModal.setAttribute('aria-hidden', 'false');

  productClose.onclick = () => {
    productModal.setAttribute('aria-hidden', 'true');
    finGas += 5;
    gaziksCollected++;
    createFloatingText(cell, '+5 🔥', '#2a7ade', 'gazik-floating');
    cell.classList.remove('gazik');
    spawnGazik();
    updateHUD();
    checkFlow();
  };
}


// Создание всплывающего текста — без изменений
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
    z-index: 100;
    transition: transform 0.9s ease, opacity 0.9s ease;
    opacity: 1;
  `;

  if (className) {
    floatingText.className = className;
  }

  const rect = cell.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();

  floatingText.style.left = (rect.left - boardRect.left + rect.width / 2) + 'px';
  floatingText.style.top = (rect.top - boardRect.top - 10) + 'px';

  boardEl.parentElement.appendChild(floatingText);

  setTimeout(() => {
    floatingText.style.opacity = '0';
    floatingText.style.transform = 'translateY(-70px)';
    setTimeout(() => {
      if (floatingText.parentElement) {
        floatingText.parentElement.removeChild(floatingText);
      }
    }, 900);
  }, 100);
}



// Проверка потока — без изменений, только увеличиваем скорость анимации
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
  }, 180); // быстрее поток для уровня 3
}

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
    queue.push(k);
    prev.set(k, fromKey);
  }

  function canConnect(r, c, dirKey) {
    const cell = getCell(r, c);
    if (!cell) return false;
    const type = cell.dataset.pipe;
    if (!type) return false;
    const dirs = TYPE_DEFS[type].dirs;
    return dirs.includes(dirKey);
  }

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

// Завершение уровня — увеличенные бонусы
function completeLevel() {
  const baseReward = 30;
  const pipeBonus = Math.max(0, 40 - pipesUsed * 2);
  const answerBonus = correctAnswers * 15;
  const gazikBonus = gaziksCollected * 10;

  const totalReward = baseReward + pipeBonus + answerBonus + gazikBonus;
  rubles += totalReward;
  localStorage.setItem('fg_rub', rubles);
  localStorage.setItem('fg_gas', finGas);

  resultNote.textContent = `Отлично! Ты успешно прошёл уровень 3 и получил много Рубликов!`;
  bonusInfo.innerHTML = `
    <div class="bonus-item">Всего получено: +${totalReward} ₽</div>
    <div class="bonus-item">Базовая награда: +${baseReward} ₽</div>
    <div class="bonus-item">Бонус за трубы: +${pipeBonus} ₽</div>
    <div class="bonus-item">Бонус за ответы: +${answerBonus} ₽</div>
    <div class="bonus-item">Бонус за газики: +${gazikBonus} ₽</div>
  `;

  resultModal.setAttribute('aria-hidden', 'false');
}

// Обновление HUD — без изменений
function updateHUD() {
  rublesEl.textContent = rubles;
  finGasEl.textContent = finGas;
  playerNameEl.textContent = localStorage.getItem('fg_name') || 'Игрок';
}

// Диалоги уровня 3
const DIALOGS = [
  'Ты отлично справилась с предыдущим уровнем!',
  'Теперь впереди уровень 3: новые задачи, новые возможности.',
  '*появляется белая зона бонусов*',
  'Белая зона не опасна — здесь ты можешь получить дополнительные рубли и Газики!',
  'Используй свои знания и собирай бонусы стратегически.',
  'Помни: чем больше правильных ответов, тем больше наград!'
];

nextBtn.addEventListener('click', () => {
  if (dialogIdx < DIALOGS.length) {
    dialogText.textContent = DIALOGS[dialogIdx];
    if (dialogIdx === 2) {
      // Подсветка белых зон
      setTimeout(() => {
        document.querySelectorAll('.white-zone').forEach(cell => {
          cell.classList.add('tutorial');
          setTimeout(() => cell.classList.remove('tutorial'), 2000);
        });
      }, 500);
    }
    dialogIdx++;
  } else {
    dialogText.textContent = 'Попробуй построить путь и собрать все бонусы!';
    nextBtn.disabled = true;
    nextBtn.style.display = 'none';
  }
});

// Обработчики модальных окон — без изменений
quizClose.addEventListener('click', () => quizModal.setAttribute('aria-hidden', 'true'));
closeResult.addEventListener('click', () => {
  resultModal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    dialogText.textContent = "Ежедневные награды помогут тебе собрать ещё больше Рубликов и Газиков!";
    nextBtn.disabled = false;
    nextBtn.style.display = 'inline-block';
    nextBtn.textContent = "Посмотреть награды";

    nextBtn.onclick = () => {
      dailyModal.setAttribute('aria-hidden', 'false');
      nextBtn.style.display = 'none';
    };
  }, 500);
});
closeDaily.addEventListener('click', () => {
  dailyModal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
});
// --- Вспомогательная функция для восстановления пути ---
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

// --- Анимация потока с завершением уровня ---
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
      completeLevel(); // вызываем завершение уровня
      return;
    }
    const [r, c] = pathKeys[i].split(',').map(Number);
    const cell = getCell(r, c);
    if (cell) cell.classList.add('flow');
    i++;
  }, 180);
}

// Инициализация уровня 3
initBoard();
updateHUD();
});

// Инициализация уровня 3
initBoard();
updateHUD();
});
