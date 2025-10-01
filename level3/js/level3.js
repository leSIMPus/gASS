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
  const nextLevelBtn = document.getElementById('nextLevel'); // Новая кнопка
  const playerNameEl = document.getElementById('playerName');

  // Новые элементы для обучающих модалок
  const whiteZoneIntroModal = document.getElementById('whiteZoneIntroModal');
  const whiteZoneIntroClose = document.getElementById('whiteZoneIntroClose');

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
  const DIRS = {
    t: [-1, 0], r: [0, 1], b: [1, 0], l: [0, -1]
  };
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

  // Вопросы для белых зон
  const FINANCE_QUESTIONS = [
    {
      q: "Что лучше всего делать с кредитной картой, чтобы не переплачивать?",
      answers: [
        { text: "Снимать с неё наличные при каждой возможности", correct: false },
        { text: "Оплачивать покупки полностью каждый месяц", correct: true },
        { text: "Использовать только половину лимита карты", correct: false }
      ]
    },
    {
      q: "Что из этого является инвестициями?",
      answers: [
        { text: "Покупка акций компании", correct: true },
        { text: "Покупка нового смартфона", correct: false },
        { text: "Оплата ежемесячного мобильного тарифа", correct: false }
      ]
    },
    {
      q: "Что выгоднее: дебетовая карта с кешбэком или кредитная?",
      answers: [
        { text: "Дебетовая с кешбэком для повседневных трат", correct: true },
        { text: "Кредитная для всех покупок", correct: false },
        { text: "Не важно, главное красивая карта", correct: false }
      ]
    },
    {
      q: "Почему важно иметь финансовую подушку безопасности?",
      answers: [
        { text: "Чтобы тратить больше денег на развлечения", correct: false },
        { text: "Чтобы иметь средства на непредвиденные расходы", correct: true },
        { text: "Чтобы брать кредиты чаще", correct: false }
      ]
    },
    {
      q: "Что такое процент по кредиту?",
      answers: [
        { text: "Дополнительная сумма, которую банк начисляет на ваш долг", correct: true },
        { text: "Скидка за быстрое погашение кредита", correct: false },
        { text: "Ежемесячная комиссия за использование карты", correct: false }
      ]
    }
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

    // Белые зоны
    placeWhiteZones();

    // Обновление интерфейса
    updateHUD();
  }

  // Размещение белых зон
  function placeWhiteZones() {
    const whitePositions = [
      [0, 0], [2, 2], [6, 2], [7, 4]
    ];

    whitePositions.forEach(([r, c]) => {
      const cell = getCell(r, c);
      if (cell && !cell.classList.contains('start') && !cell.classList.contains('goal')) {
        cell.classList.add('white-zone');
        cell.textContent = '?';
      }
    });
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
        // Первый раз на белой зоне - показываем объяснение
        showWhiteZoneIntro(cell);
      } else {
        openFinanceQuiz(cell);
      }
    } else {
      // Обычная клетка - сразу проверяем поток
      checkFlow();
    }
  }


  // Введение в белую зону
  function showWhiteZoneIntro(cell) {
    hasSeenWhiteZoneIntro = true;
    whiteZoneIntroModal.setAttribute('aria-hidden', 'false');

    whiteZoneIntroClose.onclick = () => {
      whiteZoneIntroModal.setAttribute('aria-hidden', 'true');
      openFinanceQuiz(cell);
    };
  }


  // Финансовый квиз
  function openFinanceQuiz(cell) {
    const availableQuestions = FINANCE_QUESTIONS.filter(q => !usedQuestions.has(q.q));

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
          correctAnswers++;
          rubles += 15;
          createFloatingText(cell, '+15 ₽', 'gold');
        } else {
        createFloatingText(cell, 'Увы :(', '#ff6600');
        }

        updateHUD();
        cell.classList.remove('white-zone');
        checkFlow();
      });

      quizAnswers.appendChild(btn);
    });


    quizModal.setAttribute('aria-hidden', 'false');
  }

  // Создание всплывающего текста
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

    // ДОБАВЛЯЕМ эту проверку для класса:
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

  // Проверка потока
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

  // Завершение уровня
  function completeLevel() {
    const baseReward = 20;
    const pipeBonus = Math.max(0, 30 - pipesUsed * 2);
    const answerBonus = correctAnswers * 10;

    const totalReward = baseReward + pipeBonus + answerBonus;
    rubles += totalReward;
    localStorage.setItem('fg_rub', rubles);
    localStorage.setItem('fg_gas', finGas);

    resultNote.textContent = `Супер! Тебе опять начислили много Рубликов за успешное прохождение уровня!`;
    bonusInfo.innerHTML = `
      <div class="bonus-item">Всего получено: +${totalReward} ₽</div>
      <div class="bonus-item">Базовая награда: +${baseReward} ₽</div>
      <div class="bonus-item">Бонус за трубы: +${pipeBonus} ₽</div>
      <div class="bonus-item">Бонус за ответы: +${answerBonus} ₽</div>
    `;

    resultModal.setAttribute('aria-hidden', 'false');
  }

  // Вспомогательные функции
  function updateHUD() {
    rublesEl.textContent = rubles;
    finGasEl.textContent = finGas;
    playerNameEl.textContent = localStorage.getItem('fg_name') || 'Игрок';
  }

  // Диалоги (точный сюжет)
  const DIALOGS = [
    'Новый уровень – новые приключения!',
    'В этот раз можешь немного расслабиться, не будет никакого подвоха: ни мошенников, ни соблазна потратить все свои сбережения. ',
    'Это белая зона бонусов: чтобы получить дополнительные Рублики, тебе нужно выполнить задания. ',
    'Эта зона никак не влияет на поток ФинГаза, так что если ответишь неправильно - потеряешь только шанс заработать бонусные Рублики. '
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
      dialogText.textContent = 'Покоряй свои мечты, герой.';
      nextBtn.disabled = true;
      nextBtn.style.display = 'none';
    }
  });

  // Обработчики модальных окон
  quizClose.addEventListener('click', () => quizModal.setAttribute('aria-hidden', 'true'));

  closeResult.addEventListener('click', () => {
    resultModal.setAttribute('aria-hidden', 'true');
    // Показываем сообщение про ежедневные награды
    setTimeout(() => {
      dialogText.textContent = "Ты также можешь получать еще больше Рубликов и Газиков в ежедневных наградах.";
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
    // Возвращаем в главное меню
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  });

  // Обработчик для перехода на следующий уровень
  nextLevelBtn.addEventListener('click', () => {
    dailyModal.setAttribute('aria-hidden', 'true');
    // Переход на третий уровень
    setTimeout(() => {
      window.location.href = 'level4/level4.html';
    }, 500);
  });

  // Инициализация
  initBoard();
  updateHUD();
});
