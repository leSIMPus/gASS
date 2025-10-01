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
  const yellowZoneIntroModal = document.getElementById('yellowZoneIntroModal');
  const yellowZoneIntroClose = document.getElementById('yellowZoneIntroClose');
  const gazikIntroModal = document.getElementById('gazikIntroModal');
  const gazikIntroClose = document.getElementById('gazikIntroClose');

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
  let hasSeenYellowZoneIntro = false;
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

  // Вопросы для желтых зон
  const FINANCE_QUESTIONS = [
    {
      q: "Что лучше: тратить все деньги сразу или откладывать часть?",
      answers: [
        { text: "Откладывать 10-20% от дохода", correct: true },
        { text: "Тратить все, жизнь одна", correct: false },
        { text: "Брать кредиты на все покупки", correct: false }
      ]
    },
    {
      q: "Какой минимальный размер 'финансовой подушки'?",
      answers: [
        { text: "3-6 месячных доходов", correct: true },
        { text: "1 месячный доход", correct: false },
        { text: "Достаточно 10 000 рублей", correct: false }
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
      q: "Нужно ли страховать крупные покупки?",
      answers: [
        { text: "Да, особенно технику и недвижимость", correct: true },
        { text: "Нет, это лишние траты", correct: false },
        { text: "Только если очень дорогие", correct: false }
      ]
    },
    {
      q: "Как правильно планировать бюджет?",
      answers: [
        { text: "Учитывать все доходы и расходы", correct: true },
        { text: "Тратить по настроению", correct: false },
        { text: "Просить у родителей при нехватке", correct: false }
      ]
    },
    {
      q: "Что такое кредитная история?",
      answers: [
        { text: "История всех ваших кредитов и платежей", correct: true },
        { text: "Список всех банков, где вы были", correct: false },
        { text: "История ваших покупок за год", correct: false }
      ]
    }
  ];

  // Продукты банка для газиков
  const BANK_PRODUCTS = [
    {
      name: "Накопительный счет",
      description: "До 8% годовых на остаток, пополнение и снятие в любой момент"
    },
    {
      name: "Инвестиции",
      description: "Покупка акций и облигаций с доходностью выше вклада"
    },
    {
      name: "Страхование",
      description: "Защита здоровья, имущества и финансовых рисков"
    },
    {
      name: "Ипотека",
      description: "Выгодные ставки от 5% на покупку жилья"
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
  
    // Желтые зоны
    placeYellowZones();
  
    // Газики
    spawnGazik();
  
    // Создаем мобильную панель выбора труб
    createMobilePipePanel();
  
    // Обновление интерфейса
    updateHUD();
  }
  
  // Новая функция для создания мобильной панели выбора труб
  function createMobilePipePanel() {
    // Если панель уже существует, удаляем ее
    const existingPanel = document.querySelector('.mobile-pipe-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // Создаем новую панель только для мобильных устройств
    if (window.innerWidth <= 768) {
      const mobilePanel = document.createElement('div');
      mobilePanel.className = 'mobile-pipe-panel';
      
      // Копируем содержимое из оригинальной панели
      const originalPipeChoice = document.getElementById('pipeChoice');
      mobilePanel.innerHTML = originalPipeChoice.innerHTML;
      
      // Добавляем на страницу
      document.body.appendChild(mobilePanel);
      
      // Обновляем обработчики клика для мобильной панели
      const mobileButtons = mobilePanel.querySelectorAll('.btn[data-type]');
      mobileButtons.forEach(btn => {
        btn.onclick = function() {
          choosePipe(this.dataset.type);
        };
      });
    }
  }
  
  // Обработчик изменения размера окна
  window.addEventListener('resize', function() {
    createMobilePipePanel();
  });
  }

  // Размещение желтых зон
  function placeYellowZones() {
    const yellowPositions = [
      [6, 2], [5, 1], [4, 3], [3, 2], [2, 0], [1, 3]
    ];

    yellowPositions.forEach(([r, c]) => {
      const cell = getCell(r, c);
      if (cell && !cell.classList.contains('start') && !cell.classList.contains('goal')) {
        cell.classList.add('yellow-zone');
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
          !cell.classList.contains('yellow-zone')) {
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
    if (cell.classList.contains('yellow-zone')) {
      if (!hasSeenYellowZoneIntro) {
        // Первый раз на желтой зоне - показываем объяснение
        showYellowZoneIntro(cell);
      } else {
        openFinanceQuiz(cell);
      }
    } else if (cell.classList.contains('gazik')) {
      if (!hasSeenGazikiIntro) {
        // Первый раз на газике - показываем объяснение
        showGazikiIntro(cell);
      } else {
        collectGazik(cell);
      }
    } else {
      // Обычная клетка - сразу проверяем поток
      checkFlow();
    }
  }

  // Введение про желтую зону (при первом входе на желтую зону)
  function showYellowZoneIntro(cell) {
    hasSeenYellowZoneIntro = true;
    yellowZoneIntroModal.setAttribute('aria-hidden', 'false');

    yellowZoneIntroClose.onclick = () => {
      yellowZoneIntroModal.setAttribute('aria-hidden', 'true');
      openFinanceQuiz(cell);
    };
  }

  // Введение про Газики (при первом входе на газик)
  function showGazikiIntro(cell) {
    hasSeenGazikiIntro = true;
    gazikIntroModal.setAttribute('aria-hidden', 'false');

    gazikIntroClose.onclick = () => {
      gazikIntroModal.setAttribute('aria-hidden', 'true');
      collectGazik(cell);
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
          finGas = Math.max(0, finGas - 25);
          createFloatingText(cell, '-25 🔥', '#2a7ade', 'gazik-floating');
        }
        updateHUD();
        cell.classList.remove('yellow-zone');
        checkFlow();
      });
      quizAnswers.appendChild(btn);
    });

    quizModal.setAttribute('aria-hidden', 'false');
  }

  // Сбор газика
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
    const gazikBonus = gaziksCollected * 5;

    const totalReward = baseReward + pipeBonus + answerBonus + gazikBonus;
    rubles += totalReward;
    localStorage.setItem('fg_rub', rubles);
    localStorage.setItem('fg_gas', finGas);

    resultNote.textContent = `Супер! Тебе опять начислили много Рубликов за успешное прохождение уровня!`;
    bonusInfo.innerHTML = `
      <div class="bonus-item">Всего получено: +${totalReward} ₽</div>
      <div class="bonus-item">Базовая награда: +${baseReward} ₽</div>
      <div class="bonus-item">Бонус за трубы: +${pipeBonus} ₽</div>
      <div class="bonus-item">Бонус за ответы: +${answerBonus} ₽</div>
      <div class="bonus-item">Бонус за газики: +${gazikBonus} ₽</div>
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
    'Ты прекрасно справился с первым уровнем: не дал мошенникам себя обмануть и сохранил большую часть ФинГаза!',
    'Но все не так просто, впереди тебя ждут новые испытания.',
    '*появляется желтая зона потерь*',
    'В этот раз ты попал в желтую зону. Зона будет всячески поддалкивать тебя неграмотно распорядится финансами,',
    'твоя же задача - обуздать свои желания и правильно распорядится ресурсами, ответив на вопросы по финансовой грамотности.',
    'Повторюсь, если ты неправильно ответишь на вопросы, то потеряешь часть ФинГаза.'
  ];

  nextBtn.addEventListener('click', () => {
    if (dialogIdx < DIALOGS.length) {
      dialogText.textContent = DIALOGS[dialogIdx];
      if (dialogIdx === 2) {
        // Подсветка желтых зон
        setTimeout(() => {
          document.querySelectorAll('.yellow-zone').forEach(cell => {
            cell.classList.add('tutorial');
            setTimeout(() => cell.classList.remove('tutorial'), 2000);
          });
        }, 500);
      }
      dialogIdx++;
    } else {
      dialogText.textContent = 'Теперь попробуй построить путь к мечте!';
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
      window.location.href = '.../level3.html';
    }, 500);
  });

  // Инициализация
  initBoard();
  updateHUD();
});

// Обработчик изменения размера окна
window.addEventListener('resize', function() {
  if (window.innerWidth <= 768) {
    createMobilePipePanel();
  } else {
    const mobilePanel = document.querySelector('.mobile-pipe-panel');
    if (mobilePanel) {
      mobilePanel.remove();
    }
  }
});
